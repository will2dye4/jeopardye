import { LeaderboardKeys } from '../constants.mjs';
import db, { getPlayer, removePlayerFromRoom, updatePlayer } from '../server/db.mjs';

const SOURCE_PLAYER_ID = '';
const TARGET_PLAYER_ID = '';

function die(error) {
  console.error(error);
  process.exit(1);
}

if (!SOURCE_PLAYER_ID) {
  die('Source player ID is not set!');
}

if (!TARGET_PLAYER_ID) {
  die('Target player ID is not set!');
}

const sourcePlayer = await getPlayer(SOURCE_PLAYER_ID);
if (!sourcePlayer) {
  die(`Failed to find source player (${SOURCE_PLAYER_ID})!`);
}

const targetPlayer = await getPlayer(TARGET_PLAYER_ID);
if (!targetPlayer) {
  die(`Failed to find target player (${TARGET_PLAYER_ID})!`);
}

/* NOTE: This will attempt to load all rooms in memory at once! Refactor when number of rooms becomes large. */
const cursor = await db.collection('rooms').find();
const rooms = await cursor.toArray();

rooms.forEach(room => {
  if (room.hostPlayerID === SOURCE_PLAYER_ID || room.ownerPlayerID === SOURCE_PLAYER_ID) {
    die(`Refusing to delete source player (${SOURCE_PLAYER_ID}) because they are the host/owner of room ${room.roomCode}!`);
  }
})

rooms.forEach(async room => {
  if (room.playerIDs.includes(SOURCE_PLAYER_ID)) {
    try {
      await removePlayerFromRoom(room.roomID, SOURCE_PLAYER_ID);
    } catch (e) {
      die(`Failed to remove source player (${SOURCE_PLAYER_ID}) from room ${room.roomCode}: ${e}`);
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
  await updatePlayer(TARGET_PLAYER_ID, {stats: targetPlayer.stats});
} catch (e) {
  die(`Failed to update stats for target player (${TARGET_PLAYER_ID}): ${e}`);
}

try {
  await db.collection('players').deleteOne({_id: SOURCE_PLAYER_ID});
} catch (e) {
  die(`Failed to delete source player (${SOURCE_PLAYER_ID}): ${e}`);
}

console.log(`Players merged successfully (${SOURCE_PLAYER_ID} --> ${TARGET_PLAYER_ID}).`);
process.exit(0);
