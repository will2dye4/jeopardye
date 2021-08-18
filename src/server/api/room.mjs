import express from 'express';
import log from 'log';
import {
  ADMIN_PLAYER_IDS,
  EventTypes,
  LeaderboardKeys,
  MAX_PASSWORD_LENGTH,
  ROOM_CODE_LENGTH,
  StatusCodes,
} from '../../constants.mjs';
import { Room, validateRoomCode } from '../../models/room.mjs';
import { RoomLinkRequestResolution } from '../../models/roomLinkRequest.mjs';
import { getAugmentedPlayerStats, getPlaces, WebsocketEvent } from '../../utils.mjs';
import {
  createRoom,
  generateUniqueRoomCode,
  getCountOfRooms,
  getPlayer,
  getPlayers,
  getRoom,
  getRoomByCode,
  getRoomLinkRequest,
  getRooms,
  PAGE_SIZE,
  updatePlayer,
} from '../db.mjs';
import { removePlayerFromRoom } from '../utils.mjs';
import { broadcast, playerNames } from '../websockets.mjs';

const logger = log.get('api:room');

async function handleGetRooms(req, res, next) {
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

  let count = 0;
  let hasMore = false;
  let rooms = [];

  try {
    count = await getCountOfRooms();
  } catch (e) {
    handleError('Failed to get count of rooms', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  if (page > 1 && count <= (page - 1) * PAGE_SIZE) {
    handleError(`Invalid page "${pageParam}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  if (count > 0) {
    try {
      rooms = await getRooms(page);
    } catch (e) {
      handleError('Failed to get rooms', StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }
    hasMore = (count > page * PAGE_SIZE);
  }

  let uniquePlayerIDs = new Set();
  rooms.forEach(room => uniquePlayerIDs.add(room.ownerPlayerID));

  let playerNames = {};
  try {
    const players = await getPlayers(new Array(...uniquePlayerIDs));
    players.forEach(player => playerNames[player.playerID] = player.name);
  } catch (e) {
    handleError('Failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  res.json({
    more: hasMore,
    total: count,
    page: page,
    rooms: rooms,
    playerNames: playerNames,
  });
}

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

  let requestID = req.body.requestID?.toString().trim();
  if (requestID) {
    const roomLinkRequest = await getRoomLinkRequest(requestID);
    if (!roomLinkRequest || roomLinkRequest.resolution !== RoomLinkRequestResolution.APPROVED) {
      handleError(`Invalid room link request ID "${requestID}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  } else if (!ADMIN_PLAYER_IDS.has(ownerPlayerID)) {
    handleError(`Missing room link request ID`, StatusCodes.BAD_REQUEST);
    return;
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

async function handleGetRoomLeaderboard(req, res, next) {
  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const roomID = req.params.roomID;
  const room = await (roomID.length === ROOM_CODE_LENGTH ? getRoomByCode(roomID) : getRoom(roomID));
  if (!room) {
    handleError(`Room "${roomID}" not found`, StatusCodes.NOT_FOUND);
    return;
  }

  const playerIDs = room.playerIDs;
  if (!playerIDs.includes(room.ownerPlayerID)) {
    playerIDs.push(room.ownerPlayerID);
  }

  let players = [];
  try {
    players = await getPlayers(playerIDs);
  } catch (e) {
    handleError('Failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  /* calculate percentages */
  players.forEach(player => player.stats = getAugmentedPlayerStats(player.stats));

  /* overall score */
  players.forEach(player => player.score = player.stats.overallScore);
  const overallScoreLeaders = getPlaces(players);

  /* single game score */
  players.forEach(player => player.score = player.stats.highestGameScore);
  const singleGameScoreLeaders = getPlaces(players);

  /* response accuracy */
  players.forEach(player => player.score = player.stats.correctPercentage);
  const responseAccuracyLeaders = getPlaces(players);

  /* daily double accuracy */
  players.forEach(player => player.score = player.stats.dailyDoublePercentage);
  const dailyDoubleAccuracyLeaders = getPlaces(players);

  /* winning percentage */
  players.forEach(player => player.score = player.stats.winningPercentage);
  const winLeaders = getPlaces(players);

  res.json({
    [LeaderboardKeys.OVERALL_SCORE]: overallScoreLeaders,
    [LeaderboardKeys.HIGHEST_GAME_SCORE]: singleGameScoreLeaders,
    [LeaderboardKeys.CORRECT_PERCENTAGE]: responseAccuracyLeaders,
    [LeaderboardKeys.DAILY_DOUBLE_PERCENTAGE]: dailyDoubleAccuracyLeaders,
    [LeaderboardKeys.WINNING_PERCENTAGE]: winLeaders,
  });
}

const router = express.Router();
router.get('/', handleGetRooms);
router.post('/', handleCreateRoom);
router.get('/:roomID', handleGetRoom);
router.get('/:roomID/leaderboard', handleGetRoomLeaderboard);

export default router;
