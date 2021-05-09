const express = require('express');
const fetch = require('node-fetch');
const titleize = require('titleizejs');
const uuid = require('uuid');

const API_BASE = 'http://jservice.io/api';
const CATEGORY_URL = `${API_BASE}/category`;
const RANDOM_CLUES_URL = `${API_BASE}/random`;

const CLUES_TO_FETCH = 40;

const CATEGORIES_PER_ROUND = 6;
const CLUES_PER_CATEGORY = 5;

const SINGLE_ROUND_VALUE_INCREMENT = 200;
const DOUBLE_ROUND_VALUE_INCREMENT = 2 * SINGLE_ROUND_VALUE_INCREMENT;

const router = express.Router();

async function fetchCategory(categoryID) {
  let response = await fetch(`${CATEGORY_URL}?id=${categoryID}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch category ${categoryID}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchRandomCategories(count) {
  let response = await fetch(`${RANDOM_CLUES_URL}?count=${CLUES_TO_FETCH}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch random clues: ${response.status} ${response.statusText}`);
  }
  let categories = [];
  for (let clue of await response.json()) {
    if (categories.indexOf(clue.category_id) === -1) {
      const category = await fetchCategory(clue.category_id);
      if (category.clues.length >= CLUES_PER_CATEGORY) {
        categories.push(category);
        if (categories.length === count) {
          return categories;
        }
      }
    }
  }
  return fetchRandomCategories();  // just try again
}

function titleizeCategoryName(categoryName) {
  return titleize(categoryName, {ignoreSymbols: '"&?!'});
}

function transformCategory(category, valueIncrement) {
  return {
    categoryID: category.id,
    name: titleizeCategoryName(category.title),
    clues: category.clues.slice(0, CLUES_PER_CATEGORY).map((clue, i) => {
      return {
        clueID: clue.id,
        answer: clue.answer,
        question: clue.question,
        value: valueIncrement * (i + 1),
      };
    }),
  };
}

function chooseDailyDoubles(categories, count = 1) {
  let dailyDoubles = [];
  let usedCategories = [];
  let names = Object.keys(categories);
  let cluesToSkip = 2;
  let dailyDoubleRange = CLUES_PER_CATEGORY - cluesToSkip;
  while (dailyDoubles.length < count) {
    let categoryName = names[Math.floor(Math.random() * names.length)];
    let category = categories[categoryName];
    if (usedCategories.indexOf(category.categoryID) === -1) {
      let clueIndex = Math.floor(Math.random() * dailyDoubleRange) + cluesToSkip;
      if (category.clues.length >= clueIndex) {
        dailyDoubles.push(category.clues[clueIndex].clueID);
        usedCategories.push(category.categoryID);
      }
    }
  }
  return dailyDoubles;
}

async function createGame(req, res) {
  const numCategories = CATEGORIES_PER_ROUND * 2;
  const categories = await fetchRandomCategories(numCategories);

  let singleRoundCategories = {};
  for (let category of categories.slice(0, CATEGORIES_PER_ROUND)) {
    let name = titleizeCategoryName(category.title);
    singleRoundCategories[name] = transformCategory(category, SINGLE_ROUND_VALUE_INCREMENT);
  }

  let doubleRoundCategories = {};
  for (let category of categories.slice(CATEGORIES_PER_ROUND, numCategories)) {
    let name = titleizeCategoryName(category.title);
    doubleRoundCategories[name] = transformCategory(category, DOUBLE_ROUND_VALUE_INCREMENT);
  }

  res.json({
    gameID: uuid.v4(),
    singleRound: {
      categories: singleRoundCategories,
      dailyDoubles: chooseDailyDoubles(singleRoundCategories),
    },
    doubleRound: {
      categories: doubleRoundCategories,
      dailyDoubles: chooseDailyDoubles(doubleRoundCategories, 2),
    }
  });
}

router.post('/', createGame);

module.exports = router;
