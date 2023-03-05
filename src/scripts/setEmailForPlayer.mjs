import yargs from 'yargs';
import { getPlayer, updatePlayer } from '../server/db.mjs';

function die(error) {
  console.error(error);
  process.exit(1);
}

const argv = await yargs(process.argv.slice(2)).argv;

const playerID = argv.playerID;
if (!playerID) {
  die('Player ID is not set!');
}

const email = argv.email;
if (!email) {
  die('Email is not set!');
}

const player = await getPlayer(playerID);
if (!player) {
  die(`Failed to find player (${playerID})!`);
}

if (player.email) {
  console.warn(`Overwriting previous email for ${player.name} (was: ${player.email}).`);
}

try {
  await updatePlayer(playerID, {email: email});
} catch (e) {
  die(`Failed to update email for ${player.name}: ${e}`);
}

console.log(`Email for ${player.name} successfully updated to ${email}.`);
process.exit(0);
