import express from 'express';
import log from 'log';
import { createPlayer, getPlayer } from '../db.mjs';
import { Player, validatePlayerName } from '../../models/player.mjs';

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
    handleError(`Invalid name "${name}"`, 400);
    return;
  }

  const player = new Player(name);
  try {
    await createPlayer(player);
  } catch (e) {
    handleError(`Failed to save player to database: ${e}`, 500);
    return;
  }

  res.json(player);
  logger.info(`Created player ${player.playerID}.`);
}

async function handleGetPlayer(req, res, next) {
  const playerID = req.params.playerID;
  const player = await getPlayer(playerID);
  if (player) {
    res.json(player);
  } else {
    let err = new Error(`Player ${playerID} not found`);
    err.status = 404;
    next(err);
  }
}

const router = express.Router();
router.post('/', handleCreatePlayer);
router.get('/:playerID', handleGetPlayer);

export default router;
