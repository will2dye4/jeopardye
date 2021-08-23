import express from 'express';
import log from 'log';
import {
  addPlayerToRoom,
  createPlayer,
  getCountOfPlayers,
  getPageOfPlayers,
  getPlayer,
  getRoom,
  PAGE_SIZE,
  updatePlayerName,
} from '../db.mjs';
import { broadcast, playerNames } from '../websockets.mjs';
import { ALL_FONT_STYLES, DEFAULT_FONT_STYLE, EventTypes, StatusCodes } from '../../constants.mjs';
import { Player, validatePlayerName } from '../../models/player.mjs';
import { WebsocketEvent } from '../../utils.mjs';

const logger = log.get('api:player');

async function handleGetPlayers(req, res, next) {
  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const pageParam = req.query.page || 1;
  const page = parseInt(pageParam);
  if (isNaN(page) || page < 1) {
    handleError(`Invalid page "${pageParam}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  const activeParam = req.query.active;
  let active = null;
  if (activeParam) {
    active = activeParam.toLowerCase();
    if (active !== 'true' && active !== 'false') {
      handleError(`Invalid active filter "${activeParam}"`, StatusCodes.BAD_REQUEST);
      return;
    }
    active = (active === 'true');
  }

  let count = 0;
  let hasMore = false;
  let players = [];

  try {
    count = await getCountOfPlayers(active);
  } catch (e) {
    handleError('Failed to get count of players', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  if (page > 1 && count <= (page - 1) * PAGE_SIZE) {
    handleError(`Invalid page "${pageParam}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  if (count > 0) {
    try {
      players = await getPageOfPlayers(page, active);
    } catch (e) {
      handleError('Failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }
    hasMore = (count > page * PAGE_SIZE);
  }

  res.json({
    more: hasMore,
    total: count,
    page: page,
    players: players,
  });
}

async function handleCreatePlayer(req, res, next) {
  const handleError = (message, status) => {
    logger.error(`Error creating player: ${message} (${status})`);
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const name = req.body.name?.toString().trim();
  if (!validatePlayerName(name)) {
    handleError(`Invalid name "${name}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  let preferredFontStyle = DEFAULT_FONT_STYLE;
  if (req.body.hasOwnProperty('preferredFontStyle')) {
    preferredFontStyle = req.body.preferredFontStyle;
    if (!ALL_FONT_STYLES.includes(preferredFontStyle)) {
      handleError(`Invalid font style "${preferredFontStyle}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  const roomID = req.body.roomID?.toString().trim();
  if (roomID) {
    const room = await getRoom(roomID);
    if (!room) {
      handleError(`Room "${roomID}" not found`, StatusCodes.NOT_FOUND);
      return;
    }
  }

  const player = new Player(name, preferredFontStyle);
  try {
    await createPlayer(player);
    if (roomID) {
      await addPlayerToRoom(roomID, player.playerID);
    }
  } catch (e) {
    handleError(`Failed to save player to database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  res.json(player);
  broadcast(new WebsocketEvent(EventTypes.PLAYER_JOINED, {player}));
  logger.info(`Created player ${player.playerID}.`);
}

async function handleGetPlayer(req, res, next) {
  const playerID = req.params.playerID;
  const player = await getPlayer(playerID);
  if (player) {
    res.json(player);
  } else {
    let err = new Error(`Player ${playerID} not found`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  }
}

async function handleUpdatePlayer(req, res, next) {
  const handleError = (message, status) => {
    logger.error(`Error updating player: ${message} (${status})`);
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const playerID = req.params.playerID;
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(`Player ${playerID} not found`, StatusCodes.NOT_FOUND);
    return;
  }

  let name = player.name;
  if (req.body.hasOwnProperty('name')) {
    name = req.body.name.toString().trim();
    if (!validatePlayerName(name)) {
      handleError(`Invalid name "${name}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  let preferredFontStyle = player.preferredFontStyle;
  if (req.body.hasOwnProperty('preferredFontStyle')) {
    preferredFontStyle = req.body.preferredFontStyle;
    if (!ALL_FONT_STYLES.includes(preferredFontStyle)) {
      handleError(`Invalid font style "${preferredFontStyle}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  try {
    await updatePlayerName(playerID, name, preferredFontStyle);
  } catch (e) {
    handleError(`Failed to update player name in database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  logger.info(`Player ${playerID} changed name from "${player.name}" to "${name}" (font: ${preferredFontStyle}).`);
  playerNames[playerID] = name;
  broadcast(new WebsocketEvent(EventTypes.PLAYER_CHANGED_NAME, {playerID, name, preferredFontStyle, prevName: player.name, roomID: player.currentRoomID}));
  res.status(StatusCodes.NO_CONTENT).end();
}

const router = express.Router();
router.get('/', handleGetPlayers);
router.post('/', handleCreatePlayer);
router.get('/:playerID', handleGetPlayer);
router.patch('/:playerID', handleUpdatePlayer);

export default router;
