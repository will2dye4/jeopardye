import { EventTypes } from '../constants.mjs';
import { newEvent } from '../utils.mjs';
import { addPlayerToGame, getGame } from './db.mjs';

export let connectedClients = {};

export function broadcast(event, originatingPlayerID) {
  let jsonEvent;
  Object.entries(connectedClients).forEach(([playerID, ws]) => {
    if (!originatingPlayerID || playerID !== originatingPlayerID) {
      if (!jsonEvent) {
        jsonEvent = JSON.stringify(event);
      }
      ws.send(jsonEvent);
    }
  });
}

export function handleWebsocket(ws, req) {
  const handleError = (message, status) => {
    ws.send(JSON.stringify(newEvent(EventTypes.JOIN_FAILED, {error: message, status: status})));
  };

  ws.on('message', function(msg) {
    const { eventType, payload } = JSON.parse(msg);
    if (!eventType || eventType !== EventTypes.JOIN_GAME) {
      handleError('missing/invalid event type', 400);
      return;
    }
    const { gameID, playerID, playerName } = payload;
    if (!gameID) {
      handleError('missing game ID', 400);
      return;
    }
    if (!playerID) {
      handleError('missing player ID', 400);
      return;
    }
    const game = getGame(gameID);
    if (!game) {
      handleError('game not found', 404);
      return;
    }
    const name = playerName || `Player ${game.players.length + 1}`;
    const player = {
      playerID: playerID,
      name: name,
      score: 0,
    };
    addPlayerToGame(gameID, player).then(() => {
      connectedClients[playerID] = ws;
      broadcast(newEvent(EventTypes.PLAYER_JOINED, {player: player}));
    });
  });
}
