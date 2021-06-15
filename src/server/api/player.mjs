import express from 'express';
import log from 'log';
import { createPlayer, getPlayer, updatePlayerName } from '../db.mjs';
import { broadcast, playerNames } from '../websockets.mjs';
import { ALL_FONT_STYLES, DEFAULT_FONT_STYLE, EventTypes, StatusCodes } from '../../constants.mjs';
import { Player, validatePlayerName } from '../../models/player.mjs';
import { WebsocketEvent } from '../../utils.mjs';

const logger = log.get('api:player');

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
    if (ALL_FONT_STYLES.indexOf(preferredFontStyle) === -1) {
      handleError(`Invalid font style "${preferredFontStyle}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  const player = new Player(name, preferredFontStyle);
  try {
    await createPlayer(player);
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
    if (ALL_FONT_STYLES.indexOf(preferredFontStyle) === -1) {
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
  broadcast(new WebsocketEvent(EventTypes.PLAYER_CHANGED_NAME, {playerID, name, preferredFontStyle, prevName: player.name}));
  res.status(StatusCodes.NO_CONTENT).end();
}

const router = express.Router();
router.post('/', handleCreatePlayer);
router.get('/:playerID', handleGetPlayer);
router.patch('/:playerID', handleUpdatePlayer);

export default router;
