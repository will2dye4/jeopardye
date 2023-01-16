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
import { Category, Game, isValidCategory, Round } from '../../models/game.mjs';
import { GAMES_PLAYED_STAT } from '../../models/player.mjs';
import { range, WebsocketEvent } from '../../utils.mjs';
import { createGame, getGame, getPlayers, getRoom, incrementPlayerStat, setCurrentGameForRoom } from '../db.mjs';
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
    if (isValidCategory(category, round)) {
      const name = category.title;
      if (!categoryNames.has(name)) {
        let transformedCategory = Category.fromJService(category, round);
        if (transformedCategory) {
          categoryNames.add(name);
          roundCategories[transformedCategory.categoryID] = transformedCategory;
        } else {
          logger.debug(`Skipping invalid category ${category.id}`)
        }
      } else {
        logger.debug(`Skipping duplicate category "${name}" (${category.id})`)
      }
    } else {
      logger.debug(`Skipping invalid category ${category?.id}`);
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

  const roomID = req.body.roomID?.toString().trim();
  const room = await getRoom(roomID);
  if (!room) {
    handleError(`Room "${roomID}" not found`, StatusCodes.NOT_FOUND);
    return;
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
  let players = [];
  if (req.body.hasOwnProperty('playerIDs')) {
    playerIDs = req.body.playerIDs;
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
    if (!playerIDs.includes(playerInControl) || players.find(player => player.playerID === playerInControl).spectating) {
      handleError(`Invalid player in control "${playerInControl}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }
  if (!playerInControl && room.currentChampion && playerIDs.includes(room.currentChampion) &&
      !players.find(player => player.playerID === room.currentChampion).spectating) {
    playerInControl = room.currentChampion;
  }

  broadcast(new WebsocketEvent(EventTypes.GAME_STARTING, {roomID}));

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
    const round = Rounds.FINAL;
    try {
      rounds[round] = await createRound(round);
    } catch (e) {
      handleError(`Failed to fetch ${round} round categories from JService: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }

  }

  const game = new Game(roomID, rounds, playerIDs, playerInControl);
  try {
    await createGame(game);
  } catch (e) {
    handleError(`Failed to save game to database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  setCurrentGameForRoom(room, game.gameID).then(() =>
    Promise.all(game.playerIDs.map(playerID => incrementPlayerStat(playerID, GAMES_PLAYED_STAT)))
  ).then(() => {
    res.json(game);
    broadcast(new WebsocketEvent(EventTypes.GAME_STARTED, {roomID, game}));
    logger.info(`Created game ${game.gameID}.`);
  }).catch(e => logger.error(`Failed to handle processing of new game ${game.gameID} for room ${roomID}: ${e}`));
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
