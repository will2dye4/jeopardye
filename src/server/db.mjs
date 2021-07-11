import mongodb from 'mongodb';
const { MongoClient } = mongodb;

import uuid from 'uuid';
import { randomChoice, range } from '../utils.mjs';
import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from '../constants.mjs';

const MONGODB_HOST = 'localhost';
const MONGODB_PORT = 27017;
const DB_NAME = 'jeopardye';

const client = new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/`, {useUnifiedTopology: true});

await client.connect();

const db = client.db(DB_NAME);
const gamesCollection = db.collection('games');
const playersCollection = db.collection('players');
const roomsCollection = db.collection('rooms');

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
  const result = await roomsCollection.insertOne(room);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create room!');
  }
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
  const result = await gamesCollection.insertOne(game);
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
  const updates = {
    $set: {
      playerAnswering: playerID,
    },
    $addToSet: {
      'activeClue.playersAttempted': playerID,
    }
  };
  await updateGameFields(gameID, updates);
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
  const result = await playersCollection.insertOne(player);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create player!');
  }
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

export default db;
