import express from 'express';
import log from 'log';
import {
  MAX_ROOM_REQUEST_EMAIL_LENGTH,
  MAX_ROOM_REQUEST_NAME_LENGTH,
  StatusCodes,
} from '../../constants.mjs';
import { RoomLinkRequest, RoomLinkRequestResolution } from '../../models/roomLinkRequest.mjs';
import { validateEmail } from '../../utils.mjs';
import {
  createRoomLinkRequest,
  getCountOfRoomLinkRequests,
  getRoomLinkRequest,
  getRoomLinkRequests,
  getRoomLinkRequestByEmail,
  resolveRoomLinkRequest,
  PAGE_SIZE,
} from '../db.mjs';
import { sendNewRoomLinkRequestMessage, sendRoomLinkRequestApprovedMessage } from '../mail.mjs';

const logger = log.get('api:room-link-request');

async function handleGetRoomLinkRequests(req, res, next) {
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

  const resolutionParam = req.query.resolution;
  let resolution;
  if (resolutionParam) {
    resolution = resolutionParam.toLowerCase();
    if (!Object.values(RoomLinkRequestResolution).includes(resolution)) {
      handleError(`Invalid resolution "${resolutionParam}"`, StatusCodes.BAD_REQUEST);
      return;
    }
  }

  let count = 0;
  let hasMore = false;
  let roomLinkRequests = [];

  try {
    count = await getCountOfRoomLinkRequests(resolution);
  } catch (e) {
    handleError('Failed to get count of room link requests', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  if (page > 1 && count <= (page - 1) * PAGE_SIZE) {
    handleError(`Invalid page "${pageParam}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  if (count > 0) {
    try {
      roomLinkRequests = await getRoomLinkRequests(page, resolution);
    } catch (e) {
      handleError('Failed to get room link requests', StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }
    hasMore = (count > page * PAGE_SIZE);
  }

  res.json({
    more: hasMore,
    total: count,
    page: page,
    requests: roomLinkRequests,
  });
}

async function handleCreateRoomLinkRequest(req, res, next) {
  logger.debug('Creating a request for a new room link.');

  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  if (!req.body.hasOwnProperty('name')) {
    handleError('Name is required', StatusCodes.BAD_REQUEST);
    return;
  }
  const name = req.body.name?.toString().trim();
  if (!name || name.length > MAX_ROOM_REQUEST_NAME_LENGTH) {
    handleError(`Invalid name "${name}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  if (!req.body.hasOwnProperty('email')) {
    handleError('Email is required', StatusCodes.BAD_REQUEST);
    return;
  }
  const email = req.body.email?.toString().trim();
  if (!email || email.length > MAX_ROOM_REQUEST_EMAIL_LENGTH || !validateEmail(email)) {
    handleError(`Invalid email "${email}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  const previousRequest = await getRoomLinkRequestByEmail(email);
  if (previousRequest) {
    handleError(`Room link request already exists for email "${email}"`, StatusCodes.CONFLICT);
    return;
  }

  const roomLinkRequest = new RoomLinkRequest(name, email);
  try {
    await createRoomLinkRequest(roomLinkRequest);
  } catch (e) {
    handleError(`Failed to save room link request to database: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  res.json(roomLinkRequest);
  logger.info(`Created room link request ${roomLinkRequest.requestID} for ${name} (${email}).`);

  await sendNewRoomLinkRequestMessage(roomLinkRequest);
}

async function handleGetRoomLinkRequest(req, res, next) {
  const requestID = req.params.requestID;
  const roomLinkRequest = await getRoomLinkRequest(requestID);
  if (roomLinkRequest) {
    res.json(roomLinkRequest);
  } else {
    let err = new Error(`Room link request "${requestID}" not found`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  }
}

async function handleResolveRoomLinkRequest(req, res, next) {
  const handleError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    next(error);
  }

  const requestID = req.params.requestID;
  const roomLinkRequest = await getRoomLinkRequest(requestID);
  if (!roomLinkRequest) {
    handleError(`Room link request "${requestID}" not found`, StatusCodes.NOT_FOUND);
    return;
  }
  if (roomLinkRequest.resolution !== RoomLinkRequestResolution.UNRESOLVED) {
    handleError(`Room link request "${requestID}" is already resolved`, StatusCodes.BAD_REQUEST);
    return;
  }

  if (!req.body.hasOwnProperty('resolution')) {
    handleError('Resolution is required', StatusCodes.BAD_REQUEST);
    return;
  }
  const resolution = req.body.resolution?.toString().toLowerCase().trim();
  if (!resolution || !Object.values(RoomLinkRequestResolution).includes(resolution) || resolution === RoomLinkRequestResolution.UNRESOLVED) {
    handleError(`Invalid resolution "${resolution}"`, StatusCodes.BAD_REQUEST);
    return;
  }

  /* TODO - verify that an admin is making the request to resolve? */

  const resolvedTime = new Date();
  try {
    await resolveRoomLinkRequest(requestID, resolution, resolvedTime);
  } catch (e) {
    handleError(`Failed to resolve room link request: ${e}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }

  roomLinkRequest.resolution = resolution;
  roomLinkRequest.resolvedTime = resolvedTime;
  res.json(roomLinkRequest);
  logger.info(`Resolved room link request ${roomLinkRequest.requestID} (${resolution}).`);

  if (resolution === RoomLinkRequestResolution.APPROVED) {
    await sendRoomLinkRequestApprovedMessage(roomLinkRequest);
  }
}

const router = express.Router();
router.get('/', handleGetRoomLinkRequests);
router.post('/', handleCreateRoomLinkRequest);
router.get('/:requestID', handleGetRoomLinkRequest);
router.put('/:requestID', handleResolveRoomLinkRequest);

export default router;
