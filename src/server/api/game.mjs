import express from 'express';
import log from 'log';
import {
  CATEGORIES_PER_ROUND,
  DailyDoubleSettings,
  DEFAULT_DAILY_DOUBLE_SETTING,
  DEFAULT_FINAL_JEOPARDYE,
  DEFAULT_NUM_ROUNDS,
  EventTypes,
  MAX_NUM_ROUNDS,
  MIN_NUM_ROUNDS,
  Rounds,
} from '../../constants.mjs';
import { Category, Game, Round } from '../../models/game.mjs';
import { GamePlayer } from '../../models/player.mjs';
import { range, WebsocketEvent } from '../../utils.mjs';
import { createGame, getGame, getPlayers } from '../db.mjs';
import { fetchRandomCategories } from '../jservice.mjs';
import { broadcast } from '../websockets.mjs';

const logger = log.get('api:game');

async function createRound(round, dailyDoubles = DailyDoubleSettings.NORMAL) {
  const numCategories = (round === Rounds.FINAL ? 1 : CATEGORIES_PER_ROUND);
  const numCategoriesToFetch = numCategories * 3;
  let categories = await fetchRandomCategories(numCategoriesToFetch);
  let categoryNames = new Set();
  let roundCategories = {};
  let i = 0;

  while (Object.keys(roundCategories).length < numCategories) {
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
      categories = await fetchRandomCategories(numCategoriesToFetch);
      i = 0;
    }
  }

  return new Round(roundCategories, round, dailyDoubles);
}

async function handleCreateGame(req, res, next) {
  logger.info('Creating a new game.');

  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  let numRounds = DEFAULT_NUM_ROUNDS;
  if (req.body.hasOwnProperty('numRounds')) {
    numRounds = parseInt(req.body.numRounds);
    if (isNaN(numRounds) || numRounds < MIN_NUM_ROUNDS || numRounds > MAX_NUM_ROUNDS) {
      handleError(`Invalid number of rounds "${req.body.numRounds}"`, 400);
      return;
    }
  }

  let dailyDoubles = DEFAULT_DAILY_DOUBLE_SETTING;
  if (req.body.hasOwnProperty('dailyDoubles')) {
    dailyDoubles = req.body.dailyDoubles;
    if (!DailyDoubleSettings.hasOwnProperty(dailyDoubles)) {
      handleError(`Invalid daily double setting "${dailyDoubles}"`, 400);
      return;
    }
    dailyDoubles = DailyDoubleSettings[dailyDoubles];
  }

  let finalJeopardye = DEFAULT_FINAL_JEOPARDYE;
  if (req.body.hasOwnProperty('finalJeopardye')) {
    finalJeopardye = req.body.finalJeopardye;
    if (typeof finalJeopardye !== 'boolean') {
      handleError(`Invalid final Jeopardye setting "${finalJeopardye}"`, 400);
      return;
    }
  }

  let gamePlayers = {};
  if (req.body.hasOwnProperty('playerIDs')) {
    try {
      const players = await getPlayers(req.body.playerIDs);
      players.forEach(player => {
        gamePlayers[player.playerID] = new GamePlayer(player.playerID, player.name);
      });
    } catch (e) {
      handleError(`Failed to get players: ${e}`, 404);
      return;
    }
  }
  let playerInControl = null;
  if (req.body.hasOwnProperty('playerInControl') && req.body.playerInControl !== null) {
    playerInControl = req.body.playerInControl;
    if (Object.keys(gamePlayers).indexOf(playerInControl) === -1) {
      handleError(`Invalid player in control "${playerInControl}"`, 400);
      return;
    }
  }

  let rounds = {};
  for (const i of range(numRounds)) {
    const round = Object.values(Rounds)[i];
    try {
      rounds[round] = await createRound(round, dailyDoubles);
    } catch (e) {
      handleError(`Failed to fetch ${round} round categories from JService: ${e}`, 500);
      return;
    }
  }

  if (finalJeopardye) {
    rounds[Rounds.FINAL] = await createRound(Rounds.FINAL);
  }

  const game = new Game(rounds, gamePlayers, playerInControl);
  try {
    await createGame(game);
  } catch (e) {
    handleError(`Failed to save game to database: ${e}`, 500);
    return;
  }

  res.json(game);
  broadcast(new WebsocketEvent(EventTypes.GAME_STARTED, {game}));
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
