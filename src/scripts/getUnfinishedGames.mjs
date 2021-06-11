import db from '../server/db.mjs';
import { getUnplayedClues } from '../utils.mjs';

const cursor = await db.collection('games').find();
const games = await cursor.toArray();
const unfinishedGames = games.map(game => {
  let result = {gameID: game.gameID, unplayedClues: 0};
  const board = game.rounds[game.currentRound];
  if (!board || !board.categories) {
    return result;
  }
  const unplayedClues = getUnplayedClues(board);
  result.unplayedClues = unplayedClues.length;
  return result;
}).filter(game => game.unplayedClues > 0).sort((a, b) => a.unplayedClues - b.unplayedClues);

console.log(unfinishedGames.slice(0, 10));
process.exit(0);
