import { EventTypes } from '../constants.mjs';
import { Player } from '../models/player.mjs';
import { checkSubmittedAnswer, WebsocketEvent } from '../utils.mjs';
import { addPlayerToGame, getGame, setActiveClue, setPlayerAnswering, updateGame } from './db.mjs';

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
  const name = playerName || `Player ${Object.keys(game.players).length + 1}`;
  const player = new Player(playerID, name);
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
    return null;
  }
  if (Object.keys(game.players).indexOf(playerID) === -1) {
    handleError(ws, event, `player ${playerID} not in game ${gameID}`, 400);
    return null;
  }
  const categories = game.rounds[game.currentRound].categories;
  if (!categories.hasOwnProperty(categoryID)) {
    handleError(ws, event, `invalid category ${categoryID}`, 400);
    return null;
  }
  if (categories[categoryID].clues.map(clue => clue.clueID).indexOf(clueID) === -1) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID})`, 400);
    return null;
  }
  return game;
}

async function handleSelectClue(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }

  const { categoryID, clueID } = event.payload;
  const clues = game.rounds[game.currentRound].categories[categoryID].clues;
  const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
  const clue = clues[clueIndex];
  if (clue.played) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID}) - already played`, 400);
    return;
  }
  /* TODO - ensure there isn't already an active clue? */

  setActiveClue(game, clue).then(() => {
    broadcast(new WebsocketEvent(EventTypes.PLAYER_SELECTED_CLUE, event.payload));
  });
}

async function handleBuzzIn(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid buzz attempt - no active clue', 400);
    return;
  }
  const { gameID, playerID, categoryID, clueID } = event.payload;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid buzz attempt - clue ${clueID} (category ${categoryID}) is not currently active`, 400);
    return;
  }
  if (game.activeClue.playersAttempted.indexOf(playerID) !== -1) {
    handleError(ws, event, `invalid buzz attempt - player ${playerID} has already buzzed in`, 400);
    return;
  }
  /* TODO - uncomment this once playerAnswering is being reset to null
  if (game.playerAnswering) {
    handleError(ws, event, `invalid buzz attempt - another player is already answering`, 400);
    return;
  }
  */
  setPlayerAnswering(gameID, playerID).then(() => {
    broadcast(new WebsocketEvent(EventTypes.PLAYER_BUZZED, event.payload));
  });
}

async function handleSubmitAnswer(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid answer attempt - no active clue', 400);
    return;
  }
  const { gameID, playerID, categoryID, clueID, answer } = event.payload;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid answer attempt - clue ${clueID} (category ${categoryID}) is not currently active`, 400);
    return;
  }
  if (game.playerAnswering.toString() !== playerID.toString()) {
    handleError(ws, event, `invalid answer attempt - player ${playerID} is not currently answering`, 400);
    return;
  }
  const clues = game.rounds[game.currentRound].categories[categoryID].clues;
  const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
  const clue = clues[clueIndex];
  const correct = checkSubmittedAnswer(clue.answer, answer);
  let score = game.players[playerID].score;
  let newScore = (correct ? score + clue.value : score - clue.value);
  let newFields = {playerAnswering: null, [`players.${playerID}.score`]: newScore};
  if (correct) {
    newFields.activeClue = null;
    newFields.playerInControl = playerID;
  }
  updateGame(gameID, newFields).then(() => {
    const payload = {...event.payload, correct: correct, score: newScore};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_ANSWERED, payload));
  });
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
