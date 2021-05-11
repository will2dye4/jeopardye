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

export default db;
