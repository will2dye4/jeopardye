import yargs from 'yargs';
import { LeaderboardKeys } from '../constants.mjs';
import db, { getPlayer, removePlayerFromRoom, updatePlayer } from '../server/db.mjs';

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

const targetPlayer = await getPlayer(targetPlayerID);
if (!targetPlayer) {
  die(`Failed to find target player (${targetPlayerID})!`);
}

/* NOTE: This will attempt to load all rooms in memory at once! Refactor when number of rooms becomes large. */
const cursor = await db.collection('rooms').find();
const rooms = await cursor.toArray();

rooms.forEach(room => {
  if (room.hostPlayerID === sourcePlayerID || room.ownerPlayerID === sourcePlayerID) {
    die(`Refusing to delete source player (${sourcePlayerID}) because they are the host/owner of room ${room.roomCode}!`);
  }
})

rooms.forEach(async room => {
  if (room.playerIDs.includes(sourcePlayerID)) {
    try {
      await removePlayerFromRoom(room.roomID, sourcePlayerID);
    } catch (e) {
      die(`Failed to remove source player (${sourcePlayerID}) from room ${room.roomCode}: ${e}`);
    }
  }
})

Object.entries(sourcePlayer.stats).forEach(([key, value]) => {
  if (key === LeaderboardKeys.HIGHEST_GAME_SCORE) {
    targetPlayer.stats[key] = Math.max(targetPlayer.stats[key], value);
  } else {
    targetPlayer.stats[key] += value;
  }
});

try {
  await updatePlayer(targetPlayerID, {stats: targetPlayer.stats});
} catch (e) {
  die(`Failed to update stats for target player (${targetPlayerID}): ${e}`);
}

try {
  await db.collection('players').deleteOne({_id: sourcePlayerID});
} catch (e) {
  die(`Failed to delete source player (${sourcePlayerID}): ${e}`);
}

console.log(`Players merged successfully (${sourcePlayerID} --> ${targetPlayerID}).`);
process.exit(0);
