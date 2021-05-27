import { connect, disconnect, send } from '@giantmachines/redux-websocket';
import { WebsocketEvent } from '../../utils.mjs';
import { EventTypes } from '../../constants.mjs';
import { getUnplayedClues } from '../utils';

export const ActionTypes = {
  FETCH_CURRENT_GAME: 'JEOPARDYE::FETCH_CURRENT_GAME',
  FETCH_GAME: 'JEOPARDYE::FETCH_GAME',
  FETCH_NEW_GAME: 'JEOPARDYE::FETCH_NEW_GAME',
  FETCH_PLAYER: 'JEOPARDYE::FETCH_PLAYER',
  DISMISS_CLUE: 'JEOPARDYE::DISMISS_CLUE',
  MARK_CLUE_AS_INVALID: 'JEOPARDYE::MARK_CLUE_AS_INVALID',
  SKIP_ACTIVE_CLUE: 'JEOPARDYE::SKIP_ACTIVE_CLUE',
  /* actions provided by the redux-websocket middleware */
  REDUX_WEBSOCKET_OPEN: 'REDUX_WEBSOCKET::OPEN',
  REDUX_WEBSOCKET_CLOSED: 'REDUX_WEBSOCKET::CLOSED',
  REDUX_WEBSOCKET_MESSAGE: 'REDUX_WEBSOCKET::MESSAGE',
};

const API_BASE = 'http://localhost:3333/api';
const WS_BASE = 'ws://localhost:3333/api/ws';
const GAME_URL = `${API_BASE}/game`;
const PLAYER_URL = `${API_BASE}/player`;

function getGameByID(gameID) {
  return fetch(`${GAME_URL}/${gameID}`).then(response => response.json());
}

function createNewGame(gameSettings = null) {
  const opts = {
    body: JSON.stringify(gameSettings || {}),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }
 return fetch(GAME_URL, opts).then(response => response.json());
}

function getPlayerByID(playerID) {
  return fetch(`${PLAYER_URL}/${playerID}`).then(response => response.json());
}

export function fetchCurrentGame() {
  const gameID = localStorage.getItem('gameID');
  let payload = null;
  if (gameID) {
    payload = getGameByID(gameID).then(game => {
      return (game.finishedTime !== null || !getUnplayedClues(game.rounds[game.currentRound]).length ? null : game);
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
  const gameID = localStorage.getItem('gameID');
  let promise;
  if (gameID) {
    promise = getGameByID(gameID).then(game => {
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

export function fetchPlayer(playerID) {
  return {
    type: ActionTypes.FETCH_PLAYER,
    payload: getPlayerByID(playerID),
  }
}

export function joinGame(gameID, player) {
  return send(new WebsocketEvent(EventTypes.JOIN_GAME, {gameID: gameID, playerID: player.playerID}));
}

export function selectClue(gameID, playerID, categoryID, clueID) {
  return send(new WebsocketEvent(EventTypes.SELECT_CLUE, {gameID, playerID, categoryID, clueID}));
}

export function buzzIn(gameID, playerID, categoryID, clueID) {
  return send(new WebsocketEvent(EventTypes.BUZZ_IN, {gameID, playerID, categoryID, clueID}));
}

export function submitAnswer(gameID, playerID, categoryID, clueID, answer) {
  return send(new WebsocketEvent(EventTypes.SUBMIT_ANSWER, {gameID, playerID, categoryID, clueID, answer}));
}

export function submitWager(gameID, playerID, categoryID, clueID, wager) {
  return send(new WebsocketEvent(EventTypes.SUBMIT_WAGER, {gameID, playerID, categoryID, clueID, wager}));
}

export function dismissActiveClue() {
  return {
    type: ActionTypes.DISMISS_CLUE,
    payload: {},
  }
}

export function markClueAsInvalid(gameID, playerID, categoryID, clueID) {
  /* TODO - convert this to a websocket event so other players are notified (show a badge next to the icon) */
  return {
    type: ActionTypes.MARK_CLUE_AS_INVALID,
    payload: {gameID, playerID, categoryID, clueID},
  }
}

export function skipActiveClue() {
  return {
    type: ActionTypes.SKIP_ACTIVE_CLUE,
    payload: {},
  }
}

export function websocketConnect(url = WS_BASE) {
  return connect(url);
}

export function websocketDisconnect() {
  return disconnect();
}
