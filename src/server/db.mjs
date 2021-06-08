import mongodb from 'mongodb';
const { MongoClient } = mongodb;

import uuid from 'uuid';

const MONGODB_HOST = 'localhost';
const MONGODB_PORT = 27017;
const DB_NAME = 'jeopardye';

const client = new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/`, {useUnifiedTopology: true});

await client.connect();

const db = client.db(DB_NAME);
const gamesCollection = db.collection('games');
const playersCollection = db.collection('players');

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
      activeClue: {...clue, played: true, playersAttempted: [], playersVotingToSkip: []},
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

export async function voteToSkipActiveClue(gameID, playerID) {
  await updateGameFields(gameID, {$addToSet: {'activeClue.playersVotingToSkip': playerID}});
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
  const players = cursor.toArray();
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

export default db;
