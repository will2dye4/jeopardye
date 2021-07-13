import { getPlayers, getRoom, removePlayerFromRoom as removePlayer } from './db.mjs';

export async function findNewHostPlayerID(room) {
  const playerIDs = room.playerIDs.filter(playerID => playerID !== room.hostPlayerID);
  const players = await getPlayers(playerIDs);
  let newHostPlayerID;
  if (players) {
    newHostPlayerID = players.find(player => player.active && player.currentRoomID === room.roomID && !player.spectating)?.playerID;
    if (!newHostPlayerID) {
      newHostPlayerID = players.find(player => player.active && player.currentRoomID === room.roomID)?.playerID;
      if (!newHostPlayerID && room.hostPlayerID !== room.ownerPlayerID) {
        newHostPlayerID = room.ownerPlayerID;
      }
    }
  } else {
    newHostPlayerID = room.ownerPlayerID;
  }
  return newHostPlayerID;
}

export async function findNewPlayerInControl(game) {
  const playerIDs = game.playerIDs.filter(playerID => playerID !== game.playerInControl);
  const players = await getPlayers(playerIDs);
  return players?.sort((player1, player2) =>
    game.scores[player1.playerID] - game.scores[player2.playerID]
  )?.find(player =>
    player.active && player.currentRoomID === game.roomID && !player.spectating
  )?.playerID;
}

export async function removePlayerFromRoom(player, roomID) {
  if (!roomID) {
    roomID = player.currentRoomID;
  }
  const room = await getRoom(roomID);
  let newHostPlayerID = null;
  if (room) {
    if (room.hostPlayerID === player.playerID) {
      newHostPlayerID = await findNewHostPlayerID(room);
    }
    await removePlayer(player.currentRoomID, player.playerID, newHostPlayerID);
  }
  return newHostPlayerID;
}
