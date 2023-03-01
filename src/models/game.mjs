import uuid from 'uuid';
import {
  CLUES_PER_CATEGORY,
  DAILY_DOUBLE_MULTIPLIERS,
  DailyDoubleSettings,
  DEFAULT_ALLOW_UNREVEALED_CLUES,
  DEFAULT_DAILY_DOUBLE_SETTING,
  DEFAULT_FINAL_JEOPARDYE,
  DEFAULT_GAME_SETTINGS_MODE,
  DEFAULT_NUM_ROUNDS,
  GameSettingModes,
  MAX_INVALID_COUNT,
  NUM_DAILY_DOUBLES,
  Rounds,
  VALUE_INCREMENTS,
} from '../constants.mjs';
import { randomChoice, sanitizeQuestionText } from '../utils.mjs';

const DAILY_DOUBLE_CLUES_TO_SKIP = 2;

export function isValidClue(clue) {
  return (!!clue && !!clue.answer && !!clue.question && (!clue.invalid_count || clue.invalid_count <= MAX_INVALID_COUNT));
}

export function isValidCategory(category, round) {
  if (category) {
    const numClues = (round === Rounds.FINAL ? 1 : CLUES_PER_CATEGORY);
    const clues = category.clues || [];
    return clues.filter(isValidClue).length >= numClues;
  }
  return false;
}

export class Clue {
  static fromEpisode(clue, airDate, isGame = false) {
    // If we're playing a game and the clue was unrevealed, mark it as played so it won't show up on the board.
    const played = (isGame ? clue.unrevealed || false : null);
    return new Clue(clue.clueID, clue.categoryID, clue.answer, clue.clue, clue.value, airDate, played);
  }

  static fromJService(clue, value) {
    return new Clue(clue.id, clue.category_id, clue.answer, clue.question, value, clue.airdate);
  }

  constructor(clueID, categoryID, answer, question, value, airDate, played) {
    this.clueID = clueID;
    this.categoryID = categoryID;
    if (!answer || !question) {
      this.unrevealed = true;
    } else {
      this.answer = sanitizeQuestionText(answer);
      this.rawAnswer = answer;
      this.question = sanitizeQuestionText(question);
      this.rawQuestion = question;
      this.value = value || 0;  // Final round clues don't have a value; default to 0.
    }
    if (airDate !== null) {
      this.airDate = airDate;
    }
    if (played !== null) {
      this.played = played || false;
    }
  }
}

export class Category {
  static fromEpisode(category, clues, episodeID, airDate, isGame = false) {
    if (!isGame) {
      airDate = null;
    }
    clues = clues.map(clue => Clue.fromEpisode(clue, airDate, isGame));
    episodeID = episodeID.toString();
    let comments = '';
    if (category.hasOwnProperty('comments') && category.comments.hasOwnProperty(episodeID)) {
      comments = category.comments[episodeID];
    }
    return new Category(category.categoryID, category.name, clues, comments);
  }

  static fromJService(category, round) {
    const valueIncrement = VALUE_INCREMENTS[round];
    const numClues = (round === Rounds.FINAL ? 1 : CLUES_PER_CATEGORY);

    let i = 1;
    let clues = [];
    let usedClues = new Set();
    category.clues.forEach(clue => {
      if (clues.length < numClues && isValidClue(clue) && !usedClues.has(clue.question)) {
        clues.push(Clue.fromJService(clue, valueIncrement * i));
        usedClues.add(clue.question);
        i += 1;
      }
    });

    if (clues.length < numClues) {
      return null;
    }
    return new Category(category.id, category.title, clues);
  }

  constructor(categoryID, name, clues, comments) {
    this.categoryID = categoryID;
    this.name = name;  // titleizeCategoryName(name);
    this.clues = clues || [];
    if (comments) {
      this.comments = comments;
    }
  }
}

export class Round {
  static fromEpisode(categories, round, dailyDoubles) {
    return new Round(categories, round, DailyDoubleSettings.FROM_EPISODE, dailyDoubles);
  }

  static chooseDailyDoubles(categories, round, dailyDoubleSetting) {
    const numDailyDoubles = NUM_DAILY_DOUBLES[round] * DAILY_DOUBLE_MULTIPLIERS[dailyDoubleSetting];
    let dailyDoubles = [];
    let usedCategories = new Set();
    let usedClues = new Set();
    let categoryIDs = Object.keys(categories);
    let dailyDoubleRange = CLUES_PER_CATEGORY - DAILY_DOUBLE_CLUES_TO_SKIP;

    while (dailyDoubles.length < numDailyDoubles) {
      let categoryID = randomChoice(categoryIDs);
      let category = categories[categoryID];
      if (!usedCategories.has(categoryID) || numDailyDoubles > categoryIDs.length) {
        let clueIndex = Math.floor(Math.random() * dailyDoubleRange) + DAILY_DOUBLE_CLUES_TO_SKIP;
        if (category.clues.length >= clueIndex) {
          let clue = category.clues[clueIndex];
          if (!clue.unrevealed && !usedClues.has(clue.clueID)) {
            dailyDoubles.push(clue.clueID);
            usedCategories.add(categoryID);
            usedClues.add(clue.clueID);
          }
        }
      }
    }

    return dailyDoubles;
  }

  constructor(categories, round, dailyDoubleSetting, dailyDoubles) {
    this.categories = categories;
    if (dailyDoubleSetting === DailyDoubleSettings.FROM_EPISODE) {
      this.dailyDoubles = dailyDoubles;
    } else {
      this.dailyDoubles = Round.chooseDailyDoubles(categories, round || Rounds.SINGLE, dailyDoubleSetting || DailyDoubleSettings.NORMAL);
    }
  }
}

export class Game {
  static fromEpisode(episode, roomID, playerIDs, playerInControl) {
    if (!episode.hasOwnProperty('metadata')) {
      episode.metadata = {};
    }
    episode.metadata.episodeID = episode.episodeID;
    episode.metadata.episodeNumber = episode.episodeNumber;
    episode.metadata.seasonNumber = episode.seasonNumber;
    episode.metadata.airDate = episode.airDate;
    if (episode.hasUnrevealedClues) {
      episode.metadata.hasUnrevealedClues = true;
    }
    if (episode.hasInvalidRounds) {
      episode.metadata.hasInvalidRounds = true;
    }
    const currentRound = Object.keys(episode.rounds)[0];
    return new Game(roomID, episode.rounds, playerIDs, playerInControl, null, currentRound, null, null, episode.metadata);
  }

  constructor(roomID, rounds, playerIDs, playerInControl, playerAnswering, currentRound, activeClue, currentWager, episodeMetadata) {
    this.gameID = uuid.v4();
    this.roomID = roomID;
    this.rounds = rounds;
    this.numRounds = Object.keys(rounds).length - (rounds.hasOwnProperty(Rounds.FINAL) ? 1 : 0);
    this.playerIDs = playerIDs || [];
    this.playerInControl = playerInControl || null;
    this.playerAnswering = playerAnswering || null;
    this.currentRound = currentRound || Rounds.SINGLE;
    this.activeClue = activeClue || null;
    this.currentWager = currentWager || null;
    this.playersReadyForNextRound = [];
    this.roundSummary = null;
    this.createdTime = new Date();
    this.finishedTime = null;

    if (episodeMetadata) {
      this.episodeMetadata = episodeMetadata;
    }

    this.scores = {};
    this.playerIDs.forEach(playerID => this.scores[playerID] = 0);

    if (this.playerInControl === null && this.playerIDs.length) {
      /* Randomly pick a player to start in control of the game */
      this.playerInControl = randomChoice(this.playerIDs);
    }
  }
}

export class GameSettings {
  static byDateMode(roomID, seasonNumber, startDate, endDate, playerIDs) {
    return new GameSettings(roomID, GameSettingModes.BY_DATE, null, null, null, null, seasonNumber, startDate, endDate, null, playerIDs);
  }

  static byCategories(roomID, categories, playerIDs) {
    return new GameSettings(roomID, GameSettingModes.CATEGORY, null, null, null, null, null, null, null, categories, playerIDs);
  }

  static randomMode(roomID, numRounds, dailyDoubles, finalJeopardye, allowUnrevealedClues, playerIDs) {
    return new GameSettings(roomID, GameSettingModes.RANDOM, numRounds, dailyDoubles, finalJeopardye, allowUnrevealedClues, null, null, null, null, playerIDs);
  }

  constructor(roomID, mode, numRounds, dailyDoubles, finalJeopardye, allowUnrevealedClues, seasonNumber, startDate, endDate, categories, playerIDs, playerInControl) {
    this.roomID = roomID;
    this.mode = mode || DEFAULT_GAME_SETTINGS_MODE;
    if (this.mode === GameSettingModes.BY_DATE) {
      if (seasonNumber) {
        this.seasonNumber = seasonNumber;
      }
      if (startDate) {
        this.startDate = startDate;
      }
      if (endDate) {
        this.endDate = endDate;
      }
    } else if (this.mode === GameSettingModes.CATEGORY) {
      this.categories = categories || [];
    } else if (this.mode === GameSettingModes.RANDOM) {
      this.numRounds = numRounds || DEFAULT_NUM_ROUNDS;
      this.dailyDoubles = dailyDoubles || DEFAULT_DAILY_DOUBLE_SETTING;
      this.finalJeopardye = finalJeopardye ?? DEFAULT_FINAL_JEOPARDYE;
      this.allowUnrevealedClues = allowUnrevealedClues ?? DEFAULT_ALLOW_UNREVEALED_CLUES;
    }
    this.playerIDs = playerIDs || [];
    this.playerInControl = playerInControl || null;
  }
}
