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

export async function createGame(game) {
  if (!game.gameID) {
    game.gameID = uuid.v4();
  }
  const result = await gamesCollection.insertOne(game);
  if (result.insertedCount !== 1) {
    throw new Error('Failed to create game!');
  }
}

export async function getGame(gameID) {
  return await gamesCollection.findOne({gameID: gameID});
}

async function updateGameFields(gameID, updates, arrayFilters) {
  let opts = {};
  if (arrayFilters) {
    opts.arrayFilters = arrayFilters;
  }
  await gamesCollection.updateOne({gameID: gameID}, updates, opts);
}

export async function updateGame(gameID, newFields) {
  await updateGameFields(gameID, {$set: newFields});
}

export async function addPlayerToGame(gameID, player) {
  await updateGameFields(gameID, {$set: {[`players.${player.playerID}`]: player}});
}

export async function setActiveClue(game, clue) {
  const cluePlayedKey = `rounds.${game.currentRound}.categories.${clue.categoryID}.clues.$[clue].played`;
  const updates = {
    $set: {
      activeClue: {...clue, played: true, playersAttempted: []},
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

export default db;
