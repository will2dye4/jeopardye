import yargs from 'yargs';
import { Rounds } from '../constants.mjs';
import { getGame, updateGame } from '../server/db.mjs';

function die(error) {
  console.error(error);
  process.exit(1);
}

const argv = await yargs(process.argv.slice(2)).argv;

const gameID = argv.gameID;
if (!gameID) {
  die('Game ID is not set!');
}

const game = await getGame(gameID);
if (!game) {
  die(`Game "${gameID}" not found!`);
} else if (game.finishedTime || game.currentRound === Rounds.FINAL) {
  die('Game is already finished or in the final round!');
} else if (game.numRounds < 1) {
  die('Game does not have enough rounds!');
}

const roundNames = Object.keys(game.rounds);
if (!roundNames.includes(Rounds.FINAL)) {
  die('Game does not have a final round!');
}

const roundName = roundNames[roundNames.length - 2];
let round = {...game.rounds[roundName]};
const categories = Object.values(round.categories);
categories.forEach((category, i) => {
  category.clues.forEach((clue, j) => {
    if (!(i === categories.length - 1 && j === category.clues.length - 1) && !clue.played) {
      clue.played = true;
    }
  });
});

let updates = {
  currentRound: roundName,
  [`rounds.${roundName}`]: round,
};

const score = (argv.score ? parseInt(argv.score) : null);
if (score && !isNaN(score)) {
  let scores = {...game.scores};
  Object.keys(scores).forEach(playerID => scores[playerID] = score);
  updates.scores = scores;
}

await updateGame(gameID, updates);
console.log('Game updated successfully.');
process.exit(0);
