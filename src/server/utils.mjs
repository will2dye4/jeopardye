import { getPlayers, getRoom, removePlayerFromRoom } from './db.mjs';

export async function removePlayerFromCurrentRoom(player) {
  const room = await getRoom(player.currentRoomID);
  if (room) {
    let newHostPlayerID;
    if (room.hostPlayerID === player.playerID) {
      const playerIDs = room.playerIDs.filter(playerID => playerID !== player.playerID);
      const players = await getPlayers(playerIDs);
      if (players) {
        newHostPlayerID = players.find(player => player.active && !player.spectating)?.playerID;
        if (!newHostPlayerID) {
          newHostPlayerID = players.find(player => player.active)?.playerID || room.ownerPlayerID;
        }
      } else {
        newHostPlayerID = room.ownerPlayerID;
      }
    }
    await removePlayerFromRoom(player.currentRoomID, player.playerID, newHostPlayerID);
  }
}
