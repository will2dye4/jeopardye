import express from 'express';
import '@gouch/to-title-case';

import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  SINGLE_ROUND_VALUE_INCREMENT,
  DOUBLE_ROUND_VALUE_INCREMENT,
  Rounds,
} from '../constants.mjs';
import { createGame, getGame } from './db.mjs';
import { fetchRandomCategories } from './jservice.mjs';

const DAILY_DOUBLE_CLUES_TO_SKIP = 2;

function titleizeCategoryName(categoryName) {
  return categoryName.toTitleCase();
}

function transformCategory(category, round) {
  const valueIncrement = (round === Rounds.SINGLE ? SINGLE_ROUND_VALUE_INCREMENT : DOUBLE_ROUND_VALUE_INCREMENT);

  let i = 1;
  let clues = [];
  let usedClues = new Set();
  category.clues.forEach(clue => {
    if (clues.length < CLUES_PER_CATEGORY && !!clue.question && !!clue.answer && !usedClues.has(clue.question)) {
      clues.push({
        clueID: clue.id,
        answer: clue.answer,
        question: clue.question,
        value: valueIncrement * i,
      });
      usedClues.add(clue.question);
      i += 1;
    }
  });

  if (clues.length < CLUES_PER_CATEGORY) {
    return null;
  }
  return {
    categoryID: category.id,
    name: titleizeCategoryName(category.title),
    clues: clues,
  };
}

function chooseDailyDoubles(categories, round) {
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

async function createRound(round) {
  const numCategories = CATEGORIES_PER_ROUND * 3;
  let categories = await fetchRandomCategories(numCategories);
  let categoryNames = new Set();
  let roundCategories = {};
  let i = 0;

  while (Object.keys(roundCategories).length < CATEGORIES_PER_ROUND) {
    const category = categories[i];
    if (category) {
      const name = category.title;
      if (!categoryNames.has(name)) {
        let transformedCategory = transformCategory(category, round);
        if (transformedCategory) {
          categoryNames.add(name);
          roundCategories[category.id] = transformedCategory;
        }
      }
    }
    i += 1;
    if (i >= categories.length) {
      categories = await fetchRandomCategories(numCategories);
      i = 0;
    }
  }

  return {
    categories: roundCategories,
    dailyDoubles: chooseDailyDoubles(roundCategories, round),
  };
}

async function handleCreateGame(req, res, next) {
  const timerLabel = 'create game';
  console.time(timerLabel);

  const handleError = (message, e) => {
    next(new Error(`${message}: ${e}`));
    console.timeEnd(timerLabel);
  };

  let singleRound, doubleRound;
  try {
    singleRound = await createRound(Rounds.SINGLE);
    doubleRound = await createRound(Rounds.DOUBLE);
  } catch (e) {
    handleError('Failed to fetch categories from JService', e);
    return;
  }

  const game = {
    rounds: {
      [Rounds.SINGLE]: singleRound,
      [Rounds.DOUBLE]: doubleRound,
    },
    currentRound: Rounds.SINGLE,
    players: [],
  };

  try {
    await createGame(game);
  } catch (e) {
    handleError('Failed to save game to database', e);
    return;
  }

  res.json(game);
  console.log(`Created game ${game.gameID}`);
  console.timeEnd(timerLabel);
}

async function handleGetGame(req, res, next) {
  const gameID = req.params.gameID;
  const game = await getGame(gameID);
  if (game) {
    res.json(game);
  } else {
    let err = new Error(`Game "${gameID}" not found`);
    err.status = 404;
    next(err);
  }
}

const router = express.Router();
router.post('/', handleCreateGame);
router.get('/:gameID', handleGetGame);

export default router;
