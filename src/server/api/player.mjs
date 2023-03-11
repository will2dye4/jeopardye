import express from 'express';
import log from 'log';
import { MAX_EMAIL_LENGTH, StatusCodes, validateEmail, validatePlayerName, WebsocketEvent } from '@dyesoft/alea-core';
import {
  addPlayerToRoom,
  createPlayer,
  getCountOfPlayers,
  getPageOfPlayers,
  getPlayer,
  getPlayerByEmail,
  getRoom,
  PAGE_SIZE,
  updatePlayerNameAndEmail,
} from '../db.mjs';
import { broadcast, playerNames } from '../websockets.mjs';
import { ALL_FONT_STYLES, DEFAULT_FONT_STYLE, EventTypes } from '../../constants.mjs';
import { Player } from '../../models/player.mjs';
import { sendPlayerEmailUpdatedMessage, sendPlayerRegistrationMessage, sendPlayerRetrievalMessage } from '../mail.mjs';

const logger = log.get('api:player');

async function handleGetPlayers(req, res, next) {
  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  if (req.query.hasOwnProperty('email')) {
    const player = await getPlayerByEmail(req.query.email.trim());
    const found = !!player;
    let players = [];
    if (found) {
      players.push(player);
    }
    res.json({
      more: false,
      total: (found ? 1 : 0),
      page: 1,
      players: players,
    });
    return;
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

  let email = null;
  if (req.body.hasOwnProperty('email')) {
    email = req.body.email.toString().trim();
    if (email !== '') {
      if (email.length > MAX_EMAIL_LENGTH || !validateEmail(email)) {
        handleError(`Invalid email "${email}"`, StatusCodes.BAD_REQUEST);
        return;
      }
      const existingPlayer = await getPlayerByEmail(email);
      if (existingPlayer) {
        handleError(`Player with email "${email}" already exists`, StatusCodes.CONFLICT);
        return;
      }
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

  const player = new Player(name, preferredFontStyle, email);
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

  if (!!email && email !== '') {
    await sendPlayerRegistrationMessage(player);
  }
}

async function handleRetrievePlayer(req, res, next) {
  const handleError = (message, status) => {
    logger.error(`Error retrieving player by email: ${message} (${status})`);
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const email = req.body.email?.toString().trim();
  if (!validateEmail(email)) {
    handleError(`Invalid email "${email}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  const player = await getPlayerByEmail(email);
  if (!player) {
    handleError(`Player with email "${email}" not found`, StatusCodes.NOT_FOUND);
    return;
  }

  res.status(StatusCodes.NO_CONTENT).end();
  await sendPlayerRetrievalMessage(player);
  logger.info(`Sent player retrieval email to ${player.name} at ${email} (player ID: ${player.playerID}).`);
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

  let email = player.email;
  if (req.body.hasOwnProperty('email')) {
    email = req.body.email.toString().trim();
    if (email !== '') {
      if (email.length > MAX_EMAIL_LENGTH || !validateEmail(email)) {
        handleError(`Invalid email "${email}"`, StatusCodes.BAD_REQUEST);
        return;
      }
      if (email !== player.email) {
        const existingPlayer = await getPlayerByEmail(email);
        if (existingPlayer) {
          handleError(`Player with email "${email}" already exists`, StatusCodes.CONFLICT);
          return;
        }
      }
    }
  }

  try {
    await updatePlayerNameAndEmail(playerID, name, email, preferredFontStyle);
  } catch (e) {
    handleError(`Failed to update player name in database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  if (name !== player.name || (email || '') !== (player.email || '') || preferredFontStyle !== player.preferredFontStyle) {
    if (name !== player.name || preferredFontStyle !== player.preferredFontStyle) {
      logger.info(`Player ${playerID} changed name from "${player.name}" to "${name}" (font: ${preferredFontStyle}).`);
      playerNames[playerID] = name;
    }
    if ((email || '') !== (player.email || '')) {
      logger.info(`${name} changed email from "${player.email || ''}" to "${email || ''}".`);
    }
    broadcast(new WebsocketEvent(EventTypes.PLAYER_CHANGED_SETTINGS, {playerID, name, email, preferredFontStyle, prevName: player.name, roomID: player.currentRoomID}));
  }
  res.status(StatusCodes.NO_CONTENT).end();

  if ((email || '') !== (player.email || '') && (email || '') !== '' && (player.email || '') !== '') {
    await sendPlayerEmailUpdatedMessage(name, email, player.email);
  }
}

const router = express.Router();
router.get('/', handleGetPlayers);
router.post('/', handleCreatePlayer);
router.post('/retrieve', handleRetrievePlayer);
router.get('/:playerID', handleGetPlayer);
router.patch('/:playerID', handleUpdatePlayer);

export default router;
