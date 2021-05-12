import { EventTypes } from '../constants.mjs';
import { WebsocketEvent } from '../utils.mjs';
import { addPlayerToGame, getGame } from './db.mjs';

export let connectedClients = {};

export function broadcast(event, originatingPlayerID) {
  console.log(`Broadcasting ${event.eventType} event...`);
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

function handleError(ws, event, message, status) {
  console.log(`Error handling ${event.eventType} event: ${message} (${status})`);
  ws.send(JSON.stringify(new WebsocketEvent(EventTypes.ERROR, {eventType: event.eventType, error: message, status: status})));
}

async function handleJoinGame(ws, event) {
  const { gameID, playerID, playerName } = event.payload;
  if (!gameID) {
    handleError(ws, event, 'missing game ID', 400);
    return;
  }
  if (!playerID) {
    handleError(ws, event, 'missing player ID', 400);
    return;
  }
  const game = getGame(gameID);
  if (!game) {
    handleError(ws, event, 'game not found', 404);
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
    broadcast(new WebsocketEvent(EventTypes.PLAYER_JOINED, {player: player}));
  });
}

async function validateGamePlayerAndClue(ws, event) {
  const { gameID, playerID, categoryID, clueID } = event.payload;
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, `game ${gameID} not found`, 404);
    return false;
  }
  if (game.players.map(player => player.playerID).indexOf(playerID) === -1) {
    handleError(ws, event, `player ${playerID} not in game ${gameID}`, 400);
    return false;
  }
  const categories = game.rounds[game.currentRound].categories;
  if (!categories.hasOwnProperty(categoryID)) {
    handleError(ws, event, `invalid category ${categoryID}`, 400);
    return false;
  }
  if (categories[categoryID].clues.map(clue => clue.clueID).indexOf(clueID) === -1) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID})`, 400);
    return false;
  }
  return true;
}

async function handleSelectClue(ws, event) {
  if (!await validateGamePlayerAndClue(ws, event)) {
    return;
  }
  /* TODO - check if clue was played already */
  /* TODO - update game to indicate that the clue is currently active */
  broadcast(new WebsocketEvent(EventTypes.PLAYER_SELECTED_CLUE, event.payload));
}

async function handleBuzzIn(ws, event) {
  if (!await validateGamePlayerAndClue(ws, event)) {
    return;
  }
  /* TODO - check if clue is currently active and no one else is currently answering */
  /* TODO - update game to indicate that the player is currently answering */
  broadcast(new WebsocketEvent(EventTypes.PLAYER_BUZZED, event.payload));
}

async function handleSubmitAnswer(ws, event) {
  broadcast(new WebsocketEvent(EventTypes.PLAYER_ANSWERED, {/*TODO*/}));
}

const eventHandlers = {
  [EventTypes.JOIN_GAME]: handleJoinGame,
  [EventTypes.SELECT_CLUE]: handleSelectClue,
  [EventTypes.BUZZ_IN]: handleBuzzIn,
  [EventTypes.SUBMIT_ANSWER]: handleSubmitAnswer,
}

export function handleWebsocket(ws, req) {
  ws.on('message', async function(msg) {
    const event = JSON.parse(msg);
    const eventType = event.eventType;
    if (eventHandlers.hasOwnProperty(eventType)) {
      const handler = eventHandlers[eventType];
      await handler(ws, event);
    } else {
      console.log(`Ignoring event with unknown type: ${eventType} (${msg})`);
    }
  });
}
