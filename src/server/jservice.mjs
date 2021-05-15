import log from 'log';
import fetch from 'node-fetch';
import { CLUES_PER_CATEGORY } from '../constants.mjs';

const API_BASE = 'http://jservice.io/api';
const CATEGORY_URL = `${API_BASE}/category`;
const RANDOM_CLUES_URL = `${API_BASE}/random`;

const MIN_CLUES_TO_FETCH = 50;
const MAX_CLUES_TO_FETCH = 100;  /* Limit of 100 is enforced by the JService API */

const logger = log.get('jservice');

export async function fetchCategory(categoryID) {
  let response = await fetch(`${CATEGORY_URL}?id=${categoryID}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch category ${categoryID}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRandomClues(count) {
  logger.info(`Fetching ${count} random clues`);
  let response = await fetch(`${RANDOM_CLUES_URL}?count=${count}`);
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
    if (!usedCategories.has(clue.category.title) && clue.category.clues_count >= CLUES_PER_CATEGORY) {
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
