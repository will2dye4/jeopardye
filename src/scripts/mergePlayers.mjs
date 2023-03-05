import yargs from 'yargs';
import { LeaderboardKeys } from '../constants.mjs';
import db, { getPlayer, removePlayerFromRoom, updatePlayer } from '../server/db.mjs';
import { formatDate } from '../utils.mjs';

function die(error) {
  console.error(error);
  process.exit(1);
}

const argv = await yargs(process.argv.slice(2)).argv;

const sourcePlayerID = argv.sourcePlayerID;
if (!sourcePlayerID) {
  die('Source player ID is not set!');
}

const targetPlayerID = argv.targetPlayerID;
if (!targetPlayerID) {
  die('Target player ID is not set!');
}

const sourcePlayer = await getPlayer(sourcePlayerID);
if (!sourcePlayer) {
  die(`Failed to find source player (${sourcePlayerID})!`);
}
console.log(`Source player: ${sourcePlayer.name} (created ${formatDate(sourcePlayer.createdTime)}, last connected ${formatDate(sourcePlayer.lastConnectionTime)}, ID: ${sourcePlayer.playerID})`);

const targetPlayer = await getPlayer(targetPlayerID);
if (!targetPlayer) {
  die(`Failed to find target player (${targetPlayerID})!`);
}
console.log(`Target player: ${targetPlayer.name} (created ${formatDate(targetPlayer.createdTime)}, last connected ${formatDate(targetPlayer.lastConnectionTime)}, ID: ${targetPlayer.playerID})`);

/* NOTE: This will attempt to load all rooms in memory at once! Refactor when number of rooms becomes large. */
const roomsCursor = await db.collection('rooms').find();
const rooms = await roomsCursor.toArray();

rooms.forEach(room => {
  if (room.hostPlayerID === sourcePlayerID || room.ownerPlayerID === sourcePlayerID) {
    die(`Refusing to delete source player (${sourcePlayerID}) because they are the host/owner of room ${room.roomCode}!`);
  }
});

rooms.forEach(async room => {
  if (room.playerIDs.includes(sourcePlayerID)) {
    console.log(`Removing source player (${sourcePlayerID}) from room ${room.roomCode}.`);
    try {
      await removePlayerFromRoom(room.roomID, sourcePlayerID);
    } catch (e) {
      die(`Failed to remove source player (${sourcePlayerID}) from room ${room.roomCode}: ${e}`);
    }
  }
});

const gamesCollection = db.collection('games');
const gamesCursor = await gamesCollection.find({playerIDs: sourcePlayerID});
const games = await gamesCursor.toArray();

games.forEach(async game => {
  if (!game.finishedTime) {
    console.warn(`Not updating unfinished game ${game.gameID}.`);
    return;
  }
  let updates = {
    $addToSet: {playerIDs: targetPlayerID},
    $set: {},
  };
  if (game.playerInControl === sourcePlayerID) {
    updates.$set.playerInControl = targetPlayerID;
  }
  if (game.scores.hasOwnProperty(sourcePlayerID)) {
    updates.$set[`scores.${targetPlayerID}`] = game.scores[sourcePlayerID];
    updates.$unset = {[`scores.${sourcePlayerID}`]: ''};
  }
  if (game.roundSummary) {
    Object.entries(game.roundSummary).forEach(([place, players]) => {
      const index = players.findIndex(player => player.playerID === sourcePlayerID);
      if (index !== -1) {
        updates.$set[`roundSummary.places.${place}.${index}.playerID`] = targetPlayerID;
      }
    });
  }
  console.log(`Replacing source player (${sourcePlayerID}) in game ${game.gameID}.`);
  try {
    await gamesCollection.updateOne({gameID: game.gameID}, updates);
    await gamesCollection.updateOne({gameID: game.gameID}, {$pull: {playerIDs: sourcePlayerID}});
  } catch (e) {
    die(`Failed to replace source player (${sourcePlayerID}) in game ${game.gameID}: ${e}`);
  }
});

Object.entries(sourcePlayer.stats).forEach(([key, value]) => {
  if (key === LeaderboardKeys.HIGHEST_GAME_SCORE) {
    targetPlayer.stats[key] = Math.max(targetPlayer.stats[key], value);
  } else {
    targetPlayer.stats[key] += value;
  }
});

console.log('Merging player stats.');
try {
  await updatePlayer(targetPlayerID, {stats: targetPlayer.stats});
} catch (e) {
  die(`Failed to update stats for target player (${targetPlayerID}): ${e}`);
}

console.log(`Deleting source player (${sourcePlayerID}).`);
try {
  await db.collection('players').deleteOne({_id: sourcePlayerID});
} catch (e) {
  die(`Failed to delete source player (${sourcePlayerID}): ${e}`);
}

console.log(`Players merged successfully (${sourcePlayerID} --> ${targetPlayerID}).`);
process.exit(0);
