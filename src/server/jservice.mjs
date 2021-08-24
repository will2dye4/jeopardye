import log from 'log';
import fetch from 'node-fetch';
import { CLUES_PER_CATEGORY, JSERVICE_API_BASE } from '../constants.mjs';

const CATEGORY_URL = `${JSERVICE_API_BASE}/category`;
const INVALID_CLUE_URL =`${JSERVICE_API_BASE}/invalid`;
const RANDOM_CLUES_URL = `${JSERVICE_API_BASE}/random`;

const MIN_CLUES_TO_FETCH = 25;
const MAX_CLUES_TO_FETCH = 100;  /* Limit of 100 is enforced by the JService API */

const logger = log.get('jservice');

export async function fetchCategory(categoryID) {
  const response = await fetch(`${CATEGORY_URL}?id=${categoryID}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch category ${categoryID}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRandomClues(count) {
  logger.info(`Fetching ${count} random clues`);
  const response = await fetch(`${RANDOM_CLUES_URL}?count=${count}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch random clues: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

export async function fetchRandomCategories(count) {
  const cluesToFetch = Math.min(Math.max(MIN_CLUES_TO_FETCH, count), MAX_CLUES_TO_FETCH);
  let clues = await fetchRandomClues(cluesToFetch);
  let categories = [];
  let usedCategories = new Set();
  let i = 0;
  while (categories.length < count) {
    let clue = clues[i];
    if (clue.category && clue.category.title && !usedCategories.has(clue.category.title) &&
        clue.category.clues_count >= CLUES_PER_CATEGORY) {
      const category = await fetchCategory(clue.category_id);
      categories.push(category);
      usedCategories.add(clue.category.title);
    }
    i += 1;
    if (i >= clues.length) {
      clues = await fetchRandomClues(cluesToFetch);
      i = 0;
    }
  }
  return categories;
}

export async function markClueAsInvalid(clueID) {
  const response = await fetch(`${INVALID_CLUE_URL}?id=${clueID}`, {method: 'POST'});
  if (response.ok) {
    logger.info(`Marked clue ${clueID} as invalid.`);
  } else {
    throw new Error(`Failed to mark clue ${clueID} as invalid: ${response.status} ${response.statusText}`)
  }
}
