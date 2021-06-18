import express from 'express';
import log from 'log';
import { EventTypes, MAX_PASSWORD_LENGTH, ROOM_CODE_LENGTH, StatusCodes } from '../../constants.mjs';
import { Room, validateRoomCode } from '../../models/room.mjs';
import { WebsocketEvent } from '../../utils.mjs';
import {
  createRoom,
  generateUniqueRoomCode,
  getPlayer,
  getRoom, getRoomByCode,
  updatePlayer,
} from '../db.mjs';
import { removePlayerFromRoom } from '../utils.mjs';
import { broadcast, playerNames } from '../websockets.mjs';

const logger = log.get('api:room');

async function handleCreateRoom(req, res, next) {
  logger.info('Creating a new room.');

  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const ownerPlayerID = req.body.ownerPlayerID?.toString().trim();
  const player = await getPlayer(ownerPlayerID);
  if (!player) {
    handleError(`Invalid owner player ID "${ownerPlayerID}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  let password = null;
  if (req.body.hasOwnProperty('password')) {
    password = req.body.password;
    if (password !== null && (!password || password.length > MAX_PASSWORD_LENGTH)) {
      handleError('Invalid password', StatusCodes.BAD_REQUEST);
      return;
    }
  }

  let roomCode = req.body.roomCode?.toString().toUpperCase().trim();
  if (roomCode) {
    if (!validateRoomCode(roomCode)) {
      handleError(`Invalid room code "${roomCode}"`, StatusCodes.BAD_REQUEST);
      return;
    }
    const room = await getRoomByCode(roomCode);
    if (room) {
      handleError(`Room with code "${roomCode}" already exists`, StatusCodes.CONFLICT);
      return;
    }
  } else {
    roomCode = await generateUniqueRoomCode();
  }

  const room = new Room(roomCode, ownerPlayerID, password);
  try {
    await createRoom(room);
  } catch (e) {
    handleError(`Failed to save room to database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  await updatePlayer(ownerPlayerID, {currentRoomID: room.roomID});
  if (player.currentRoomID) {
    const newHostPlayerID = await removePlayerFromRoom(player);
    if (newHostPlayerID) {
      logger.info(`Reassigning host for room ${player.currentRoomID} to ${playerNames[newHostPlayerID] || newHostPlayerID}.`);
    }
    const payload = {roomID: player.currentRoomID, playerID: player.playerID, newHostPlayerID: newHostPlayerID};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_LEFT_ROOM, payload), player.playerID);
  }

  res.json(room);
  logger.info(`Created room ${room.roomID} (short code: ${room.roomCode}).`);
}

async function handleGetRoom(req, res, next) {
  const roomID = req.params.roomID;
  const room = await (roomID.length === ROOM_CODE_LENGTH ? getRoomByCode(roomID) : getRoom(roomID));
  if (room) {
    res.json(room);
  } else {
    let err = new Error(`Room "${roomID}" not found`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  }
}

const router = express.Router();
router.post('/', handleCreateRoom);
router.get('/:roomID', handleGetRoom);

export default router;
