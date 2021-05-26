import express from 'express';
import log from 'log';
import { CATEGORIES_PER_ROUND, Rounds } from '../../constants.mjs';
import { Category, Game, Round } from '../../models/game.mjs';
import { createGame, getGame } from '../db.mjs';
import { fetchRandomCategories } from '../jservice.mjs';

const logger = log.get('api:game');

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
        let transformedCategory = Category.fromJService(category, round);
        if (transformedCategory) {
          categoryNames.add(name);
          roundCategories[transformedCategory.categoryID] = transformedCategory;
        }
      }
    }
    i += 1;
    if (i >= categories.length) {
      categories = await fetchRandomCategories(numCategories);
      i = 0;
    }
  }

  return new Round(roundCategories, round);
}

async function handleCreateGame(req, res, next) {
  logger.info('Creating a new game.');

  const handleError = (message, e) => next(new Error(`${message}: ${e}`));

  let singleRound, doubleRound;
  try {
    singleRound = await createRound(Rounds.SINGLE);
    doubleRound = await createRound(Rounds.DOUBLE);
  } catch (e) {
    handleError('Failed to fetch categories from JService', e);
    return;
  }

  const game = new Game(singleRound, doubleRound);
  try {
    await createGame(game);
  } catch (e) {
    handleError('Failed to save game to database', e);
    return;
  }

  res.json(game);
  logger.info(`Created game ${game.gameID}.`);
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
