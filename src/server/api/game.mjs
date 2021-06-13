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
  MAX_PLAYERS_PER_GAME,
  Rounds,
  StatusCodes,
} from '../../constants.mjs';
import { Category, Game, Round } from '../../models/game.mjs';
import { GAMES_PLAYED_STAT } from '../../models/player.mjs';
import { range, WebsocketEvent } from '../../utils.mjs';
import { createGame, getGame, getPlayers, incrementPlayerStat } from '../db.mjs';
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
      handleError(`Invalid number of rounds "${req.body.numRounds}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  let dailyDoubles = DEFAULT_DAILY_DOUBLE_SETTING;
  if (req.body.hasOwnProperty('dailyDoubles')) {
    dailyDoubles = req.body.dailyDoubles;
    if (!DailyDoubleSettings.hasOwnProperty(dailyDoubles)) {
      handleError(`Invalid daily double setting "${dailyDoubles}"`, StatusCodes.BAD_REQUEST);
      return;
    }
    dailyDoubles = DailyDoubleSettings[dailyDoubles];
  }

  let finalJeopardye = DEFAULT_FINAL_JEOPARDYE;
  if (req.body.hasOwnProperty('finalJeopardye')) {
    finalJeopardye = req.body.finalJeopardye;
    if (typeof finalJeopardye !== 'boolean') {
      handleError(`Invalid final Jeopardye setting "${finalJeopardye}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  let playerIDs = [];
  if (req.body.hasOwnProperty('playerIDs')) {
    playerIDs = req.body.playerIDs;
    let players;
    try {
      players = await getPlayers(playerIDs);
    } catch (e) {
      handleError(`Failed to get players: ${e}`, StatusCodes.NOT_FOUND);
      return;
    }
    const numPlayers = players.filter(player => !player.spectating).length;
    if (numPlayers > MAX_PLAYERS_PER_GAME) {
      handleError(`Maximum number of players (${MAX_PLAYERS_PER_GAME}) exceeded`, StatusCodes.BAD_REQUEST);
      return;
    }
  }
  let playerInControl = null;
  if (req.body.hasOwnProperty('playerInControl') && req.body.playerInControl !== null) {
    playerInControl = req.body.playerInControl;
    if (playerIDs.indexOf(playerInControl) === -1) {
      handleError(`Invalid player in control "${playerInControl}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  broadcast(new WebsocketEvent(EventTypes.GAME_STARTING, {}));

  let rounds = {};
  for (const i of range(numRounds)) {
    const round = Object.values(Rounds)[i];
    try {
      rounds[round] = await createRound(round, dailyDoubles);
    } catch (e) {
      handleError(`Failed to fetch ${round} round categories from JService: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }
  }

  if (finalJeopardye) {
    rounds[Rounds.FINAL] = await createRound(Rounds.FINAL);
  }

  const game = new Game(rounds, playerIDs, playerInControl);
  try {
    await createGame(game);
  } catch (e) {
    handleError(`Failed to save game to database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  await Promise.all(game.playerIDs.map(playerID => incrementPlayerStat(playerID, GAMES_PLAYED_STAT)));

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
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  }
}

const router = express.Router();
router.post('/', handleCreateGame);
router.get('/:gameID', handleGetGame);

export default router;
