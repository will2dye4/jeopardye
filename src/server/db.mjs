import mongodb from 'mongodb';
const { MongoClient } = mongodb;

import uuid from 'uuid';
import config from '../config.json' assert { type: 'json' };
import {
  DEFAULT_ALLOW_UNREVEALED_CLUES,
  DEFAULT_HIGHEST_SEASON_NUMBER,
  MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH,
  ROOM_CODE_CHARACTERS,
  ROOM_CODE_LENGTH,
} from '../constants.mjs';
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

const MONGODB_HOST = config.db.host;
const MONGODB_PORT = config.db.port;
const DB_NAME = 'jeopardye';

const client = new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/`, {useUnifiedTopology: true});

await client.connect();

const db = client.db(DB_NAME);
const categoriesCollection = db.collection('categories');
const cluesCollection = db.collection('clues');
const contestantsCollection = db.collection('contestants');
const episodesCollection = db.collection('episodes');
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

export async function getRoomHistory(roomID) {
  return await getRoomHistoryByCriteria({roomID: roomID});
}

export async function getRoomHistoryByCode(roomCode) {
  return await getRoomHistoryByCriteria({roomCode: roomCode});
}

async function getRoomHistoryByCriteria(criteria) {
  const cursor = await roomsCollection.aggregate([
    {$match: criteria},
    {$lookup: {
      from: 'games',
      localField: 'previousGameIDs',
      foreignField: 'gameID',
      as: 'previousGames',
    }},
    {$lookup: {
      from: 'players',
      localField: 'previousGames.playerIDs',
      foreignField: 'playerID',
      as: 'players',
    }},
    {$project: {
      _id: 0,
      kickedPlayerIDs: 0,
      passwordHash: 0,
      playerIDs: 0,
      players: {
        _id: 0,
        active: 0,
        currentRoomID: 0,
        preferredFontStyle: 0,
        spectating: 0,
        stats: 0,
      },
      previousGameIDs: 0,
      previousGames: {
        _id: 0,
        activeClue: 0,
        currentWager: 0,
        episodeMetadata: {
          contestants: 0,
          scores: 0,
        },
        playerAnswering: 0,
        playerInControl: 0,
        playersReadyForNextRound: 0,
        roomID: 0,
        rounds: 0,
      },
    }},
  ]);
  const results = await cursor.toArray();
  if (!results.length) {
    return null;
  }
  return results.pop();
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

export async function updateGame(gameID, newFields, arrayFilters = null) {
  await updateGameFields(gameID, {$set: newFields}, arrayFilters);
}

export async function addPlayerToGame(gameID, playerID) {
  await updateGameFields(gameID, {
    $set: {[`scores.${playerID}`]: 0},
    $addToSet: {playerIDs: playerID},
  });
}

export async function setActiveClue(game, clue, played = true) {
  let arrayFilters = null;
  let newFields = {
    activeClue: {...clue, played: played, playersAttempted: [], playersMarkingInvalid: [], playersVotingToSkip: []},
    currentWager: null,
  };
  if (played) {
    const cluePlayedKey = `rounds.${game.currentRound}.categories.${clue.categoryID}.clues.$[clue].played`;
    newFields[cluePlayedKey] = true;
    arrayFilters = [
      {
        'clue.clueID': {$eq: clue.clueID},
      },
    ];
  }
  await updateGameFields(game.gameID, {$set: newFields}, arrayFilters);
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

export async function getEpisodeCount() {
  return await episodesCollection.countDocuments();
}

export async function getEpisodeByEpisodeID(episodeID) {
  return await getEpisodeByFilter({episodeID: episodeID});
}

export async function getEpisodeByEpisodeNumber(episodeNumber) {
  return await getEpisodeByFilter({episodeNumber: episodeNumber});
}

export async function getEpisodeByAirDate(airDate) {
  return await getEpisodeByFilter({airDate: airDate});
}

export async function getLatestEpisodeAirDate() {
  const cursor = await episodesCollection.aggregate([
    {$group: {_id: null, maxAirDate: {$max: '$airDate'}}},
  ]);
  const results = await cursor.toArray();
  if (!results.length) {
    return DEFAULT_HIGHEST_SEASON_NUMBER;
  }
  return results[0].maxAirDate;
}

export async function getRandomEpisodeFromDateRange(startDate, endDate) {
  const cursor = episodesCollection.aggregate([
    {$match: {airDate: {$gte: startDate, $lte: endDate}}},
    {$project: {_id: 0, episodeID: 1}},
    {$sample: {size: 1}},
  ]);
  const episodeIDs = await cursor.toArray();
  if (!episodeIDs.length) {
    return null;
  }
  return await getEpisodeByEpisodeID(episodeIDs[0].episodeID);
}

export async function getRandomEpisodeFromSeason(seasonNumber) {
  const cursor = episodesCollection.aggregate([
    {$match: {seasonNumber: seasonNumber}},
    {$project: {_id: 0, episodeID: 1}},
    {$sample: {size: 1}},
  ]);
  const episodeIDs = await cursor.toArray();
  if (!episodeIDs.length) {
    return null;
  }
  return await getEpisodeByEpisodeID(episodeIDs[0].episodeID);
}

export async function getEpisodeByFilter(filter) {
  let cursor = await episodesCollection.aggregate([
    {$match: filter},
    {
      $lookup: {
        from: 'contestants',
        localField: 'metadata.contestantIDs',
        foreignField: 'contestantID',
        as: 'metadata.contestants',
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'rounds.single.categoryIDs',
        foreignField: 'categoryID',
        as: 'rounds.single.categories',
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'rounds.double.categoryIDs',
        foreignField: 'categoryID',
        as: 'rounds.double.categories',
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'rounds.final.categoryIDs',
        foreignField: 'categoryID',
        as: 'rounds.final.categories',
      }
    },
  ]);
  let episodes = await cursor.toArray();
  if (!episodes.length) {
    return null;
  }
  return episodes.pop();
}

export async function getEpisodeSummariesBySeasonNumber(seasonNumber) {
  const cursor = await episodesCollection.aggregate([
    {$match: {seasonNumber: seasonNumber}},
    {$lookup: {from: 'contestants', localField: 'metadata.contestantIDs', foreignField: 'contestantID', as: 'metadata.contestants'}},
    {$sort: {episodeNumber: 1}},
    {$project: {_id: 0, rounds: 0, metadata: {contestantIDs: 0, contestants: {_id: 0, episodeIDs: 0}}}},
  ]);
  return await cursor.toArray();
}

export async function getEpisodeCategoriesByEpisodeID(episodeID) {
  const cursor = episodesCollection.aggregate([
    {$match: {episodeID: episodeID}},
    {$lookup: {
      from: 'categories',
      localField: 'rounds.single.categoryIDs',
      foreignField: 'categoryID',
      as: 'rounds.single.categories',
    }},
    {$lookup: {
      from: 'categories',
      localField: 'rounds.double.categoryIDs',
      foreignField: 'categoryID',
      as: 'rounds.double.categories',
    }},
    {$lookup: {
      from: 'categories',
      localField: 'rounds.final.categoryIDs',
      foreignField: 'categoryID',
      as: 'rounds.final.categories',
    }},
    {$project: {
      _id: 0,
      episodeID: 1,
      rounds: {
        single: {
          categoryIDs: 1,
          categories: {categoryID: 1, name: 1, comments: 1},
        },
        double: {
          categoryIDs: 1,
          categories: {categoryID: 1, name: 1, comments: 1},
        },
        final: {
          categoryIDs: 1,
          categories: {categoryID: 1, name: 1, comments: 1},
        },
      },
    }},
  ]);
  let categories = await cursor.toArray();
  if (!categories.length) {
    return null;
  }
  return categories.pop();
}

export async function getCategoryCluesByEpisodeID(episodeID) {
  let categoriesCursor = await cluesCollection.aggregate([
    {$match: {episodeID: episodeID}},
    {$group: {_id: '$categoryID', clues: {$push: '$$ROOT'}}},
    {$sort: {index: 1}},
  ]);
  let allCategories = await categoriesCursor.toArray();
  let categoryClues = {};
  for (let category of allCategories) {
    categoryClues[category._id] = category.clues;
  }
  return categoryClues;
}

export async function getEpisodeCluesByCategoryID(categoryID, includeEpisodeInfo = false) {
  let pipeline = [
    {$match: {categoryID: categoryID}},
    {$group: {_id: '$episodeID', clues: {$push: '$$ROOT'}}},
  ];
  if (includeEpisodeInfo) {
    pipeline.push(
      {$lookup: {from: 'episodes', localField: '_id', foreignField: 'episodeID', as: 'episode'}},
      {$project: {clues: 1, episode: {episodeID: 1, episodeNumber: 1, airDate: 1}}},
    );
  }
  pipeline.push({$sort: {index: 1}});

  let episodesCursor = await cluesCollection.aggregate(pipeline);
  let episodes = await episodesCursor.toArray();
  if (includeEpisodeInfo) {
    return episodes;
  }

  let episodeClues = {};
  for (let episode of episodes) {
    episodeClues[episode._id] = episode.clues;
  }
  return episodeClues;
}

export async function getCategoryCount() {
  const cursor = await categoriesCollection.aggregate([
    {$addFields: {clueCount: {$size: '$clueIDs'}}},
    {$addFields: {revealedClueCount: {$subtract: ['$clueCount', '$unrevealedClueCount']}}},
    {$match: {revealedClueCount: {$gte: MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH}}},
    {$count: 'count'},
  ]);
  const results = await cursor.toArray();
  if (!results.length) {
    return await categoriesCollection.countDocuments();
  }
  return results[0].count;
}

export async function getCategorySummaries() {
  return await getCategorySummariesForSearchTerm(null);
}

export async function getCategorySummariesForSearchTerm(searchTerm) {
  let match = {revealedClueCount: {$gte: MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH}};
  if (searchTerm) {
    searchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');  // Escape regex characters
    match.name = {$regex: searchTerm, $options: 'i'};
  }
  try {
    const cursor = await categoriesCollection.aggregate([
      {$addFields: {clueCount: {$size: '$clueIDs'}, episodeCount: {$size: '$episodeIDs'}}},
      {$addFields: {revealedClueCount: {$subtract: ['$clueCount', '$unrevealedClueCount']}}},
      {$match: match},
      {$sort: {name: 1}},
      {$project: {_id: 0, categoryID: 1, name: 1, episodeCount: 1, revealedClueCount: 1}},
    ]);
    return await cursor.toArray();
  } catch (e) {
    return [];
  }
}

export async function getRandomCategoryIDs(count, allowUnrevealedClues = DEFAULT_ALLOW_UNREVEALED_CLUES) {
  let pipeline;
  if (allowUnrevealedClues) {
    pipeline = [
      {$addFields: {clueCount: {$size: '$clueIDs'}, episodeCount: {$size: '$episodeIDs'}}},
      {$addFields: {revealedClueCount: {$subtract: ['$clueCount', '$unrevealedClueCount']}}},
      {$match: {revealedClueCount: {$gte: MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH}}},
    ];
  } else {
    pipeline = [
      {$match: {unrevealedClueCount: 0}},
    ];
  }
  pipeline.push(
    {$sample: {size: count}},
    {$project: {_id: 0, categoryID: 1}},
  );
  const cursor = await categoriesCollection.aggregate(pipeline);
  const results = await cursor.toArray();
  return results.map(result => result.categoryID);
}

export async function getCategoryByID(categoryID) {
  return await categoriesCollection.findOne({categoryID: categoryID});
}

export async function getContestantByID(contestantID) {
  return await contestantsCollection.findOne({contestantID: contestantID});
}

export async function getHighestSeasonNumber() {
  const cursor = await episodesCollection.aggregate([
    {$group: {_id: null, maxSeasonNumber: {$max: '$seasonNumber'}}},
  ]);
  const results = await cursor.toArray();
  if (!results.length) {
    return DEFAULT_HIGHEST_SEASON_NUMBER;
  }
  return results[0].maxSeasonNumber;
}

export async function getSeasonSummaries() {
  const cursor = await episodesCollection.aggregate([
    {$group: {
      _id: '$seasonNumber',
      episodeCount: {$sum: 1},
      seasonStartDate: {$min: '$airDate'},
      seasonEndDate: {$max: '$airDate'},
    }},
    {$addFields: {seasonNumber: '$_id'}},
    {$sort: {_id: 1}},
    {$project: {_id: 0}},
  ]);
  return await cursor.toArray();
}

export async function getRandomFinalRoundClue() {
  const cursor = await cluesCollection.aggregate([
    {$match: {isFinalJeopardy: true}},
    {$lookup: {from: 'categories', localField: 'categoryID', foreignField: 'categoryID', as: 'categories'}},
    {$lookup: {from: 'episodes', localField: 'episodeID', foreignField: 'episodeID', as: 'episodes'}},
    {$project: {
      _id: 0,
      clueID: 1,
      categoryID: 1,
      episodeID: 1,
      answer: 1,
      clue: 1,
      rawAnswer: 1,
      rawClue: 1,
      categories: {categoryID: 1, name: 1, comments: 1},
      episodes: {airDate: 1},
    }},
    {$sample: {size: 1}},
  ]);
  const clues = await cursor.toArray();
  if (!clues.length) {
    return null;
  }
  return clues.pop();
}

export default db;
