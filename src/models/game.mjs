import uuid from 'uuid';
import { CLUES_PER_CATEGORY, DOUBLE_ROUND_VALUE_INCREMENT, Rounds, SINGLE_ROUND_VALUE_INCREMENT } from '../constants.mjs';
import { sanitizeQuestionText, titleizeCategoryName } from '../utils.mjs';

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
    const valueIncrement = (round === Rounds.SINGLE ? SINGLE_ROUND_VALUE_INCREMENT : DOUBLE_ROUND_VALUE_INCREMENT);

    let i = 1;
    let clues = [];
    let usedClues = new Set();
    category.clues.forEach(clue => {
      if (clues.length < CLUES_PER_CATEGORY && !!clue.question && !!clue.answer && !usedClues.has(clue.question)) {
        clues.push(Clue.fromJService(clue, valueIncrement * i));
        usedClues.add(clue.question);
        i += 1;
      }
    });

    if (clues.length < CLUES_PER_CATEGORY) {
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
  static chooseDailyDoubles(categories, round) {
    const numDailyDoubles = (round === Rounds.SINGLE ? 1 : 2);
    let dailyDoubles = [];
    let usedCategories = new Set();
    let categoryIDs = Object.keys(categories);
    let dailyDoubleRange = CLUES_PER_CATEGORY - DAILY_DOUBLE_CLUES_TO_SKIP;

    while (dailyDoubles.length < numDailyDoubles) {
      let categoryID = categoryIDs[Math.floor(Math.random() * categoryIDs.length)];
      let category = categories[categoryID];
      if (!usedCategories.has(categoryID)) {
        let clueIndex = Math.floor(Math.random() * dailyDoubleRange) + DAILY_DOUBLE_CLUES_TO_SKIP;
        if (category.clues.length >= clueIndex) {
          dailyDoubles.push(category.clues[clueIndex].clueID);
          usedCategories.add(categoryID);
        }
      }
    }

    return dailyDoubles;
  }

  constructor(categories, round) {
    this.categories = categories;
    this.dailyDoubles = Round.chooseDailyDoubles(categories, round || Rounds.SINGLE);
  }
}

export class Game {
  constructor(singleRound, doubleRound, currentRound, players, activeClue, playerAnswering, playerInControl) {
    this.gameID = uuid.v4();
    this.rounds = {
      [Rounds.SINGLE]: singleRound,
      [Rounds.DOUBLE]: doubleRound,
    };
    this.currentRound = currentRound || Rounds.SINGLE;
    this.players = players || [];
    this.activeClue = activeClue || null;
    this.playerAnswering = playerAnswering || null;
    this.playerInControl = playerInControl || null;
  }
}
