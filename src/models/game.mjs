import uuid from 'uuid';
import {
  CLUES_PER_CATEGORY,
  DAILY_DOUBLE_MULTIPLIERS,
  DailyDoubleSettings,
  DEFAULT_DAILY_DOUBLE_SETTING,
  DEFAULT_FINAL_JEOPARDYE,
  DEFAULT_NUM_ROUNDS,
  NUM_DAILY_DOUBLES,
  Rounds,
  VALUE_INCREMENTS,
} from '../constants.mjs';
import { randomChoice, sanitizeQuestionText, titleizeCategoryName } from '../utils.mjs';

const DAILY_DOUBLE_CLUES_TO_SKIP = 2;

export class Clue {
  static fromJService(clue, value) {
    return new Clue(clue.id, clue.category_id, clue.answer, clue.question, value);
  }

  constructor(clueID, categoryID, answer, question, value, played) {
    this.clueID = clueID;
    this.categoryID = categoryID;
    this.answer = sanitizeQuestionText(answer);
    this.rawAnswer = answer;
    this.question = sanitizeQuestionText(question);
    this.rawQuestion = question;
    this.value = value;
    this.played = played || false;
  }
}

export class Category {
  static fromJService(category, round) {
    const valueIncrement = VALUE_INCREMENTS[round];
    const numClues = (round === Rounds.FINAL ? 1 : CLUES_PER_CATEGORY);

    let i = 1;
    let clues = [];
    let usedClues = new Set();
    category.clues.forEach(clue => {
      if (clues.length < numClues && !!clue.question && !!clue.answer && !usedClues.has(clue.question)) {
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

  constructor(categoryID, name, clues) {
    this.categoryID = categoryID;
    this.name = titleizeCategoryName(name);
    this.clues = clues || [];
  }
}

export class Round {
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
          let clueID = category.clues[clueIndex].clueID;
          if (!usedClues.has(clueID)) {
            dailyDoubles.push(clueID);
            usedCategories.add(categoryID);
            usedClues.add(clueID);
          }
        }
      }
    }

    return dailyDoubles;
  }

  constructor(categories, round, dailyDoubleSetting) {
    this.categories = categories;
    this.dailyDoubles = Round.chooseDailyDoubles(categories, round || Rounds.SINGLE, dailyDoubleSetting || DailyDoubleSettings.NORMAL);
  }
}

export class Game {
  constructor(rounds, playerIDs, playerInControl, playerAnswering, currentRound, activeClue, currentWager) {
    this.gameID = uuid.v4();
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

    this.scores = {};
    this.playerIDs.forEach(playerID => this.scores[playerID] = 0);

    if (this.playerInControl === null && this.playerIDs.length) {
      /* Randomly pick a player to start in control of the game */
      this.playerInControl = randomChoice(this.playerIDs);
    }
  }
}

export class GameSettings {
  constructor(numRounds, dailyDoubles, finalJeopardye, playerIDs, playerInControl) {
    this.numRounds = numRounds || DEFAULT_NUM_ROUNDS;
    this.dailyDoubles = dailyDoubles || DEFAULT_DAILY_DOUBLE_SETTING;
    this.finalJeopardye = finalJeopardye ?? DEFAULT_FINAL_JEOPARDYE;
    this.playerIDs = playerIDs || [];
    this.playerInControl = playerInControl || null;
  }
}
