import { connect, disconnect, send } from '@giantmachines/redux-websocket';
import { WebsocketEvent } from '../../utils.mjs';
import { EventTypes } from '../../constants.mjs';

export const ActionTypes = {
  FETCH_GAME: 'JEOPARDYE::FETCH_GAME',
  DISMISS_CLUE: 'JEOPARDYE::DISMISS_CLUE',
  SET_PLAYER: 'JEOPARDYE::SET_PLAYER',
  /* actions provided by the redux-websocket middleware */
  REDUX_WEBSOCKET_OPEN: 'REDUX_WEBSOCKET::OPEN',
  REDUX_WEBSOCKET_CLOSED: 'REDUX_WEBSOCKET::CLOSED',
  REDUX_WEBSOCKET_MESSAGE: 'REDUX_WEBSOCKET::MESSAGE',
};

const API_BASE = 'http://localhost:3333/api';
const WS_BASE = 'ws://localhost:3333/api/ws';
const CREATE_GAME_URL = `${API_BASE}/game`;

export function fetchGame() {
  return {
    type: ActionTypes.FETCH_GAME,
    payload: fetch(CREATE_GAME_URL, {method: 'POST'}).then(response => response.json()),
  };
}

export function joinGame(gameID, player) {
  return send(new WebsocketEvent(EventTypes.JOIN_GAME, {gameID: gameID, playerID: player.playerID, playerName: player.name}));
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

export function dismissActiveClue() {
  return {
    type: ActionTypes.DISMISS_CLUE,
    payload: {},
  }
}

export function setPlayer(player) {
  return {
    type: ActionTypes.SET_PLAYER,
    payload: player,
  }
}

export function websocketConnect(url = WS_BASE) {
  return connect(url);
}

export function websocketDisconnect() {
  return disconnect();
}
