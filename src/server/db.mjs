import mongodb from 'mongodb';
const { MongoClient } = mongodb;

import uuid from 'uuid';
import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from '../constants.mjs';
import { RoomLinkRequestResolution } from '../models/roomLinkRequest.mjs';
import { randomChoice, range } from '../utils.mjs';

export const PAGE_SIZE = 10;

const DEFAULT_INSERT_OPTIONS = {
  writeConcern: {
    w: 'majority',
  },
};

const DEFAULT_TRANSACTION_OPTIONS = {
  readPreference: 'primary',
  readConcern: {
    level: 'local',
  },
  writeConcern: {
    w: 'majority',
  },
};

const MONGODB_HOST = 'localhost';
const MONGODB_PORT = 27017;
const DB_NAME = 'jeopardye';

const client = new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/`, {useUnifiedTopology: true});

await client.connect();

const db = client.db(DB_NAME);
const gamesCollection = db.collection('games');
const playersCollection = db.collection('players');
const roomsCollection = db.collection('rooms');
const roomLinkRequestsCollection = db.collection('roomLinkRequests');

const session = client.startSession();

export function markAllPlayersInactive(callback) {
  playersCollection.updateMany({}, {$set: {active: false}}).then(() => callback());
}

export async function generateUniqueRoomCode() {
  let code, room;
  while (!code || room) {
    code = range(ROOM_CODE_LENGTH).map(_ => randomChoice(ROOM_CODE_CHARACTERS)).join('');
    room = await getRoomByCode(code);
  }
  return code;
}

export async function createRoom(room) {
  if (!room.roomID) {
    room.roomID = uuid.v4();
  }
  if (!room.roomCode) {
    room.roomCode = await generateUniqueRoomCode();
  }
  room._id = room.roomID;
  const result = await roomsCollection.insertOne(room, DEFAULT_INSERT_OPTIONS);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create room!');
  }
}

export async function getCountOfRooms() {
  return await roomsCollection.find().count();
}

export async function getRooms(page) {
  let cursor = roomsCollection.find().sort({createdTime: -1}).limit(PAGE_SIZE);
  if (page > 1) {
    cursor = cursor.skip(PAGE_SIZE * (page - 1));
  }
  return await cursor.toArray();
}

export async function getRoom(roomID) {
  return await roomsCollection.findOne({_id: roomID});
}

export async function getRoomByCode(roomCode) {
  return await roomsCollection.findOne({roomCode: roomCode});
}

async function updateRoomFields(roomID, updates, arrayFilters) {
  let opts = {};
  if (arrayFilters) {
    opts.arrayFilters = arrayFilters;
  }
  await roomsCollection.updateOne({_id: roomID}, updates, opts);
}

export async function updateRoom(roomID, newFields) {
  await updateRoomFields(roomID, {$set: newFields});
}

export async function setCurrentGameForRoom(room, gameID, currentChampion) {
  if (room.currentGameID !== gameID) {
    let updates = {
      $set: {
        currentGameID: gameID,
      },
    };
    if (room.currentGameID) {
      updates.$addToSet = {
        previousGameIDs: room.currentGameID,
      };
    }
    if (currentChampion !== undefined) {
      if (currentChampion && currentChampion === room.currentChampion) {
        updates.$set.currentWinningStreak = room.currentWinningStreak + 1;
      } else {
        updates.$set.currentChampion = currentChampion;
        updates.$set.currentWinningStreak = (currentChampion ? 1 : 0);
      }
    }
    await updateRoomFields(room.roomID, updates);
  }
}

export async function addPlayerToRoom(roomID, playerID) {
  await updateRoomFields(roomID, {$addToSet: {playerIDs: playerID}});
}

export async function removePlayerFromRoom(roomID, playerID, newHostPlayerID) {
  let updates = {$pull: {playerIDs: playerID}};
  if (newHostPlayerID) {
    updates.$set = {hostPlayerID: newHostPlayerID};
  }
  await updateRoomFields(roomID, updates);
}

export async function removePlayerFromKickedPlayersInRoom(roomID, playerID) {
  await updateRoomFields(roomID, {$unset: {[`kickedPlayerIDs.${playerID}`]: ''}});
}

export async function createGame(game) {
  if (!game.gameID) {
    game.gameID = uuid.v4();
  }
  game._id = game.gameID;
  const result = await gamesCollection.insertOne(game, DEFAULT_INSERT_OPTIONS);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create game!');
  }
}

export async function getGame(gameID) {
  return await gamesCollection.findOne({_id: gameID});
}

async function updateGameFields(gameID, updates, arrayFilters) {
  let opts = {};
  if (arrayFilters) {
    opts.arrayFilters = arrayFilters;
  }
  await gamesCollection.updateOne({_id: gameID}, updates, opts);
}

export async function updateGame(gameID, newFields) {
  await updateGameFields(gameID, {$set: newFields});
}

export async function addPlayerToGame(gameID, playerID) {
  await updateGameFields(gameID, {
    $set: {[`scores.${playerID}`]: 0},
    $addToSet: {playerIDs: playerID},
  });
}

export async function setActiveClue(game, clue) {
  const cluePlayedKey = `rounds.${game.currentRound}.categories.${clue.categoryID}.clues.$[clue].played`;
  const updates = {
    $set: {
      activeClue: {...clue, played: true, playersAttempted: [], playersMarkingInvalid: [], playersVotingToSkip: []},
      currentWager: null,
      [cluePlayedKey]: true
    }
  };
  const arrayFilters = [
    {
      'clue.clueID': {$eq: clue.clueID},
    },
  ];
  await updateGameFields(game.gameID, updates, arrayFilters);
}

export async function setPlayerAnswering(gameID, playerID) {
  /* Re-fetch the game in a transaction to ensure that there isn't already a player answering.
   * This is to prevent a race condition where two players may both be recognized as having buzzed in. */
  await session.withTransaction(async () => {
    const game = await getGame(gameID);
    if (game.playerAnswering) {
      throw new Error('Another player is already answering!');
    }
    const updates = {
      $set: {
        playerAnswering: playerID,
      },
      $addToSet: {
        'activeClue.playersAttempted': playerID,
      }
    };
    await updateGameFields(gameID, updates);
  }, DEFAULT_TRANSACTION_OPTIONS);
}

export async function markActiveClueAsInvalid(gameID, playerID) {
  await updateGameFields(gameID, {$addToSet: {'activeClue.playersMarkingInvalid': playerID}});
}

export async function voteToSkipActiveClue(gameID, playerID) {
  await updateGameFields(gameID, {$addToSet: {'activeClue.playersVotingToSkip': playerID}});
}

export async function markPlayerAsReadyForNextRound(gameID, playerID) {
  await updateGameFields(gameID, {$addToSet: {playersReadyForNextRound: playerID}});
}

export async function advanceToNextRound(gameID, round, playerInControl) {
  await updateGame(gameID, {
    currentRound: round,
    playerInControl: playerInControl,
    playersReadyForNextRound: [],
    roundSummary: null,
  });
}

export async function createPlayer(player) {
  if (!player.playerID) {
    player.playerID = uuid.v4();
  }
  player._id = player.playerID;
  const result = await playersCollection.insertOne(player, DEFAULT_INSERT_OPTIONS);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create player!');
  }
}

export async function getCountOfPlayers(active = null) {
  let filters = {};
  if (active !== null) {
    filters.active = active;
  }
  return await playersCollection.find(filters).count();
}

export async function getPageOfPlayers(page, active = null) {
  let filters = {};
  if (active !== null) {
    filters.active = active;
  }
  let cursor = playersCollection.find(filters).sort({lastConnectionTime: -1}).limit(PAGE_SIZE);
  if (page > 1) {
    cursor = cursor.skip(PAGE_SIZE * (page - 1));
  }
  return await cursor.toArray();
}

export async function getPlayer(playerID) {
  return await playersCollection.findOne({_id: playerID});
}

export async function getPlayers(playerIDs) {
  const cursor = await playersCollection.find({_id: {$in: playerIDs}});
  const players = await cursor.toArray();
  if (players.length < playerIDs.length) {
    throw new Error('Failed to find all players!');
  }
  return players;
}

export async function updatePlayer(playerID, newFields) {
  await playersCollection.updateOne({_id: playerID}, {$set: newFields});
}

export async function updatePlayerName(playerID, name, preferredFontStyle) {
  await updatePlayer(playerID, {name: name, preferredFontStyle: preferredFontStyle});
}

export async function incrementPlayerStat(playerID, statName, value = 1) {
  const key = `stats.${statName}`;
  await playersCollection.updateOne({_id: playerID}, {$inc: {[key]: value}});
}

export async function setHighestGameScore(playerID, score) {
  await updatePlayer(playerID, {'stats.highestGameScore': score});
}

export async function createRoomLinkRequest(roomLinkRequest) {
  if (!roomLinkRequest.requestID) {
    roomLinkRequest.requestID = uuid.v4();
  }
  roomLinkRequest._id = roomLinkRequest.requestID;
  const result = await roomLinkRequestsCollection.insertOne(roomLinkRequest, DEFAULT_INSERT_OPTIONS);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create room link request!');
  }
}

export async function getCountOfRoomLinkRequests(resolution) {
  let filters = {};
  if (resolution) {
    filters.resolution = resolution;
  }
  return await roomLinkRequestsCollection.find(filters).count();
}

export async function getRoomLinkRequests(page, resolution) {
  let filters = {};
  if (resolution) {
    filters.resolution = resolution;
  }
  let cursor = roomLinkRequestsCollection.find(filters).sort({createdTime: -1}).limit(PAGE_SIZE);
  if (page > 1) {
    cursor = cursor.skip(PAGE_SIZE * (page - 1));
  }
  return await cursor.toArray();
}

export async function getRoomLinkRequest(requestID) {
  return await roomLinkRequestsCollection.findOne({_id: requestID});
}

export async function getRoomLinkRequestByEmail(email) {
  return await roomLinkRequestsCollection.findOne({email: email, resolution: RoomLinkRequestResolution.UNRESOLVED});
}

export async function resolveRoomLinkRequest(requestID, resolution, resolvedTime) {
  await roomLinkRequestsCollection.updateOne({_id: requestID}, {$set: {resolution: resolution, resolvedTime: resolvedTime}});
}

export async function setRoomForRoomLinkRequest(requestID, roomID, roomCode) {
  await roomLinkRequestsCollection.updateOne({_id: requestID}, {$set: {roomID: roomID, roomCode: roomCode}});
}

export default db;
