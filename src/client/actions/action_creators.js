import { connect, disconnect, send } from '@giantmachines/redux-websocket';
import { EventTypes, GAME_ID_KEY, PLAYER_ID_KEY, StatusCodes } from '../../constants.mjs';
import { getUnplayedClues, WebsocketEvent } from '../../utils.mjs';

export const ActionTypes = {
  FETCH_CURRENT_GAME: 'JEOPARDYE::FETCH_CURRENT_GAME',
  FETCH_GAME: 'JEOPARDYE::FETCH_GAME',
  FETCH_NEW_GAME: 'JEOPARDYE::FETCH_NEW_GAME',
  FETCH_CURRENT_PLAYER: 'JEOPARDYE::FETCH_CURRENT_PLAYER',
  FETCH_PLAYER: 'JEOPARDYE::FETCH_PLAYER',
  CREATE_NEW_PLAYER: 'JEOPARDYE::CREATE_NEW_PLAYER',
  CHANGE_PLAYER_NAME: 'JEOPARDYE::CHANGE_PLAYER_NAME',
  DISMISS_CLUE: 'JEOPARDYE::DISMISS_CLUE',
  CLEAR_CURRENT_GAME: 'JEOPARDYE::CLEAR_CURRENT_GAME',
  CLEAR_ERROR: 'JEOPARDYE::CLEAR_ERROR',
  /* actions provided by the redux-websocket middleware */
  REDUX_WEBSOCKET_OPEN: 'REDUX_WEBSOCKET::OPEN',
  REDUX_WEBSOCKET_CLOSED: 'REDUX_WEBSOCKET::CLOSED',
  REDUX_WEBSOCKET_MESSAGE: 'REDUX_WEBSOCKET::MESSAGE',
};

// const API_BASE = 'http://192.168.1.246:3333/api';
// const WS_BASE = 'ws://192.168.1.246:3333/api/ws';
const API_BASE = 'http://localhost:3333/api';
const WS_BASE = 'ws://localhost:3333/api/ws';
const GAME_URL = `${API_BASE}/game`;
const PLAYER_URL = `${API_BASE}/player`;

function getJSON(response, errorMessage) {
  if (response.ok) {
    return response.json();
  }
  console.log(`${errorMessage}: ${response.status} ${response.statusText}`);
  return {error: errorMessage};
}

function handleError(error, errorMessage) {
  console.log(`${errorMessage}: ${error}`);
  return {error: errorMessage};
}

function getGameByID(gameID) {
  return fetch(`${GAME_URL}/${gameID}`).then(response =>
    getJSON(response, `Error occurred while fetching game ${gameID}.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching game ${gameID}.`)
  );
}

function createNewGame(gameSettings = null) {
  const opts = {
    body: JSON.stringify(gameSettings || {}),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }
 return fetch(GAME_URL, opts).then(response =>
   getJSON(response, 'Error occurred while creating game.')
 ).catch(e =>
   handleError(e, 'Unexpected error occurred while creating game.')
 );
}

function getPlayerByID(playerID) {
  return fetch(`${PLAYER_URL}/${playerID}`).then(response =>
    (response.status === StatusCodes.NOT_FOUND) ? null : getJSON(response, `Error occurred while fetching player ${playerID}.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching player ${playerID}.`)
  );
}

function createPlayer(name, preferredFontStyle) {
  const opts = {
    body: JSON.stringify({
      name: name,
      preferredFontStyle: preferredFontStyle,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }
  return fetch(PLAYER_URL, opts).then(response =>
    getJSON(response, 'Error occurred while creating player.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while creating player.')
  );
}

function updatePlayerName(playerID, name, preferredFontStyle) {
  return fetch(`${PLAYER_URL}/${playerID}`, {
    body: JSON.stringify({
      name: name,
      preferredFontStyle: preferredFontStyle,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  }).catch(e => handleError(e, `Unexpected error occurred while updating name for player ${playerID}.`));
}

export function fetchCurrentGame() {
  const gameID = localStorage.getItem(GAME_ID_KEY);
  let payload = null;
  if (gameID) {
    payload = getGameByID(gameID).then(game => {
      if (game.error) {
        return game;
      }
      if (game.finishedTime !== null || (!game.roundSummary && !getUnplayedClues(game.rounds[game.currentRound]).length)) {
        return null;
      }
      return game;
    });
  }
  return {
    type: ActionTypes.FETCH_CURRENT_GAME,
    payload: payload,
  };
}

export function fetchNewGame(gameSettings) {
  return {
    type: ActionTypes.FETCH_NEW_GAME,
    payload: createNewGame(gameSettings),
  }
}

export function fetchGame() {
  const gameID = localStorage.getItem(GAME_ID_KEY);
  let promise;
  if (gameID) {
    promise = getGameByID(gameID).then(game => {
      if (game.error) {
        return game;
      }
      if (game.finishedTime !== null || !getUnplayedClues(game.rounds[game.currentRound]).length) {
        console.log(`Previous game ${gameID} finished. Creating a new game...`);
        return createNewGame();
      }
      console.log(`Using previous game ${gameID}...`);
      return game;
    });
  } else {
    console.log('No previous game found. Creating a new game...');
    promise = createNewGame();
  }
  return {
    type: ActionTypes.FETCH_GAME,
    payload: promise,
  };
}

export function fetchCurrentPlayer() {
  const playerID = localStorage.getItem(PLAYER_ID_KEY);
  let payload = null;
  if (playerID) {
    payload = getPlayerByID(playerID);
  }
  return {
    type: ActionTypes.FETCH_CURRENT_PLAYER,
    payload: payload,
  };
}

export function fetchPlayer(playerID) {
  return {
    type: ActionTypes.FETCH_PLAYER,
    payload: getPlayerByID(playerID),
  }
}

export function createNewPlayer(name, preferredFontStyle) {
  return {
    type: ActionTypes.CREATE_NEW_PLAYER,
    payload: createPlayer(name, preferredFontStyle),
  }
}

export function changePlayerName(playerID, name, preferredFontStyle) {
  return {
    type: ActionTypes.CHANGE_PLAYER_NAME,
    payload: updatePlayerName(playerID, name, preferredFontStyle),
  }
}

export function startSpectating(playerID) {
  return send(new WebsocketEvent(EventTypes.START_SPECTATING, {playerID}));
}

export function stopSpectating(playerID, gameID) {
  const payload = {playerID};
  if (gameID) {
    payload.gameID = gameID;
  }
  return send(new WebsocketEvent(EventTypes.STOP_SPECTATING, payload));
}

export function clearCurrentGame(gameID) {
  return {
    type: ActionTypes.CLEAR_CURRENT_GAME,
    payload: {gameID},
  }
}

export function markPlayerAsReadyForNextRound(context) {
  return send(new WebsocketEvent(EventTypes.MARK_READY_FOR_NEXT_ROUND, {context}));
}

export function joinGame(context) {
  return send(new WebsocketEvent(EventTypes.JOIN_GAME, {context}));
}

export function selectClue(context) {
  return send(new WebsocketEvent(EventTypes.SELECT_CLUE, {context}));
}

export function buzzIn(context) {
  return send(new WebsocketEvent(EventTypes.BUZZ_IN, {context}));
}

export function submitAnswer(context, answer) {
  return send(new WebsocketEvent(EventTypes.SUBMIT_ANSWER, {context, answer}));
}

export function submitWager(context, wager) {
  return send(new WebsocketEvent(EventTypes.SUBMIT_WAGER, {context, wager}));
}

export function markClueAsInvalid(context) {
  return send(new WebsocketEvent(EventTypes.MARK_CLUE_AS_INVALID, {context}));
}

export function voteToSkipClue(context) {
  return send(new WebsocketEvent(EventTypes.VOTE_TO_SKIP_CLUE, {context}));
}

export function clientConnect(playerID) {
  return send(new WebsocketEvent(EventTypes.CLIENT_CONNECT, {playerID}));
}

export function updateGameSettings(settings) {
  return send(new WebsocketEvent(EventTypes.GAME_SETTINGS_CHANGED, {settings}));
}

export function dismissActiveClue() {
  return {
    type: ActionTypes.DISMISS_CLUE,
    payload: {},
  }
}

export function clearError(error) {
  return {
    type: ActionTypes.CLEAR_ERROR,
    payload: {error},
  }
}

export function websocketConnect(url = WS_BASE) {
  return connect(url);
}

export function websocketDisconnect() {
  return disconnect();
}
