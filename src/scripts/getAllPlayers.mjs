import db from '../server/db.mjs';

const cursor = await db.collection('players').find();
const players = await cursor.toArray();
const playerNames = players.map(player => `${player.name} (${player.playerID})`).sort((a, b) => a.localeCompare(b));

console.log(playerNames);
process.exit(0);
