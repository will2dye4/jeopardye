import db from '../server/db.mjs';
import { formatDate } from '../utils.mjs';

let cursor;
if (process.argv.length > 2) {
  cursor = await db.collection('players').find({name: {$regex: process.argv[2], $options: '$i'}});
} else {
  cursor = await db.collection('players').find();
}

const players = await cursor.toArray();
const playerNames = players.map(
  player => `${player.name} (created ${formatDate(player.createdTime)}, last connected ${formatDate(player.lastConnectionTime)}, ID: ${player.playerID})`
).sort((a, b) => a.localeCompare(b));

console.log();
playerNames.forEach(player => console.log(player));
process.exit(0);
