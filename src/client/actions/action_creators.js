import { connect, disconnect, send } from '@giantmachines/redux-websocket';
import { API_BASE, EventTypes, PLAYER_ID_KEY, StatusCodes, WS_BASE } from '../../constants.mjs';
import {getISODateString, getUnplayedClues, WebsocketEvent} from '../../utils.mjs';

export const ActionTypes = {
  FETCH_ROOM: 'JEOPARDYE::FETCH_ROOM',
  FETCH_ROOM_LEADERBOARDS: 'JEOPARDYE::FETCH_ROOM_LEADERBOARDS',
  FETCH_ROOMS: 'JEOPARDYE::FETCH_ROOMS',
  CREATE_NEW_ROOM: 'JEOPARDYE::CREATE_NEW_ROOM',
  FETCH_CURRENT_GAME: 'JEOPARDYE::FETCH_CURRENT_GAME',
  FETCH_GAME: 'JEOPARDYE::FETCH_GAME',
  FETCH_NEW_GAME: 'JEOPARDYE::FETCH_NEW_GAME',
  FETCH_CURRENT_PLAYER: 'JEOPARDYE::FETCH_CURRENT_PLAYER',
  FETCH_PLAYER: 'JEOPARDYE::FETCH_PLAYER',
  FETCH_PLAYERS: 'JEOPARDYE::FETCH_PLAYERS',
  CREATE_NEW_PLAYER: 'JEOPARDYE::CREATE_NEW_PLAYER',
  CHANGE_PLAYER_NAME: 'JEOPARDYE::CHANGE_PLAYER_NAME',
  FETCH_ROOM_LINK_REQUESTS: 'JEOPARDYE::FETCH_ROOM_LINK_REQUESTS',
  REQUEST_NEW_ROOM_LINK: 'JEOPARDYE::REQUEST_NEW_ROOM_LINK',
  RESOLVE_ROOM_LINK_REQUEST: 'JEOPARDYE::RESOLVE_ROOM_LINK_REQUEST',
  DISMISS_CLUE: 'JEOPARDYE::DISMISS_CLUE',
  CLEAR_CURRENT_GAME: 'JEOPARDYE::CLEAR_CURRENT_GAME',
  CLEAR_ERROR: 'JEOPARDYE::CLEAR_ERROR',
  CLEAR_HOST_OVERRIDE: 'JEOPARDYE::CLEAR_HOST_OVERRIDE',
  CLEAR_PLAYER_IN_CONTROL_REASSIGNED: 'JEOPARDYE::CLEAR_PLAYER_IN_CONTROL_REASSIGNED',
  CLEAR_ROOM_LINK_REQUEST_SUCCEEDED: 'JEOPARDYE::CLEAR_ROOM_LINK_REQUEST_SUCCEEDED',
  FETCH_SEASON_SUMMARIES: 'JEOPARDYE::FETCH_SEASON_SUMMARIES',
  /* actions provided by the redux-websocket middleware */
  REDUX_WEBSOCKET_OPEN: 'REDUX_WEBSOCKET::OPEN',
  REDUX_WEBSOCKET_CLOSED: 'REDUX_WEBSOCKET::CLOSED',
  REDUX_WEBSOCKET_ERROR: 'REDUX_WEBSOCKET::ERROR',
  REDUX_WEBSOCKET_MESSAGE: 'REDUX_WEBSOCKET::MESSAGE',
};

const GAME_URL = `${API_BASE}/game`;
const PLAYER_URL = `${API_BASE}/player`;
const ROOM_URL = `${API_BASE}/room`;
const ROOM_REQUEST_URL = `${API_BASE}/request`;
const SEASON_URL = `${API_BASE}/season`;

function getJSON(response, errorMessage) {
  if (response.ok) {
    return response.json();
  }
  console.log(`${errorMessage}: ${response.status} ${response.statusText}`);
  return {error: errorMessage, status: response.status};
}

function handleError(error, errorMessage) {
  console.log(`${errorMessage}: ${error}`);
  return {error: errorMessage, status: StatusCodes.INTERNAL_SERVER_ERROR};
}

function getRooms(page = 1) {
  const url = new URL(ROOM_URL);
  const params = {};
  if (page > 1) {
    params.page = page;
  }
  url.search = new URLSearchParams(params).toString();
  return fetch(url.toString()).then(response =>
    getJSON(response, `Error occurred while fetching rooms.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching rooms.`)
  );
}

function getRoomByID(roomID) {
  return fetch(`${ROOM_URL}/${roomID}`).then(response =>
    getJSON(response, `Error occurred while fetching room ${roomID}.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching room ${roomID}.`)
  );
}

function getRoomLeaderboards(roomID) {
  return fetch(`${ROOM_URL}/${roomID}/leaderboard`).then(response =>
    getJSON(response, `Error occurred while fetching leaderboards for room ${roomID}.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching leaderboards for room ${roomID}.`)
  );
}

function createRoom(playerID, roomCode, password, requestID) {
  const opts = {
    body: JSON.stringify({
      ownerPlayerID: playerID,
      roomCode: roomCode || null,
      password: password || null,
      requestID: requestID || null,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  };
  return fetch(ROOM_URL, opts).then(response =>
    getJSON(response, 'Error occurred while creating room.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while creating room.')
  );
}

function getGameByID(gameID) {
  return fetch(`${GAME_URL}/${gameID}`).then(response =>
    getJSON(response, `Error occurred while fetching game ${gameID}.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching game ${gameID}.`)
  );
}

function convertGameSettings(gameSettings) {
  if (gameSettings.hasOwnProperty('startDate')) {
    gameSettings.startDate = getISODateString(gameSettings.startDate);
  }
  if (gameSettings.hasOwnProperty('endDate')) {
    gameSettings.endDate = getISODateString(gameSettings.endDate);
  }
  return gameSettings;
}

function createNewGame(gameSettings = null) {
  const opts = {
    body: JSON.stringify(convertGameSettings(gameSettings || {})),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  };
  return fetch(GAME_URL, opts).then(response =>
    getJSON(response, 'Error occurred while creating game.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while creating game.')
  );
}

function getPlayers(activeFilter, page = 1) {
  const url = new URL(PLAYER_URL);
  const params = {};
  if (activeFilter !== undefined && activeFilter !== null) {
    params.active = activeFilter;
  }
  if (page > 1) {
    params.page = page;
  }
  url.search = new URLSearchParams(params).toString();
  return fetch(url.toString()).then(response =>
    getJSON(response, `Error occurred while fetching players.`)
  ).catch(e =>
    handleError(e, `Unexpected error occurred while fetching players.`)
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

function getRoomLinkRequests(resolution, page = 1) {
  const url = new URL(ROOM_REQUEST_URL);
  const params = {};
  if (page > 1) {
    params.page = page;
  }
  if (resolution) {
    params.resolution = resolution;
  }
  url.search = new URLSearchParams(params).toString();
  return fetch(url.toString()).then(response =>
    getJSON(response, 'Error occurred while fetching room link requests.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while fetching room link requests.')
  );
}

function submitNewRoomLinkRequest(name, email) {
  const opts = {
    body: JSON.stringify({
      name: name,
      email: email,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }
  return fetch(ROOM_REQUEST_URL, opts).then(response =>
    getJSON(response, 'Error occurred while requesting new room link.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while requesting new room link.')
  );
}

function submitRoomLinkRequestResolution(requestID, resolution) {
  const opts = {
    body: JSON.stringify({
      resolution: resolution,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  }
  return fetch(`${ROOM_REQUEST_URL}/${requestID}`, opts).then(response =>
    getJSON(response, 'Error occurred while resolving room link request.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while resolving room link request.')
  );
}

function getSeasonSummaries() {
  return fetch(SEASON_URL).then(response =>
    getJSON(response, 'Error occurred while fetching season summaries.')
  ).catch(e =>
    handleError(e, 'Unexpected error occurred while fetching season summaries.')
  );
}

export function fetchRooms(page = 1) {
  return {
    type: ActionTypes.FETCH_ROOMS,
    payload: getRooms(page),
  };
}

export function fetchRoom(roomID) {
  return {
    type: ActionTypes.FETCH_ROOM,
    payload: getRoomByID(roomID),
  };
}

export function fetchRoomLeaderboards(roomID) {
  return {
    type: ActionTypes.FETCH_ROOM_LEADERBOARDS,
    payload: getRoomLeaderboards(roomID),
  };
}

export function createNewRoom(playerID, roomCode = null, password = null, requestID = null) {
  return {
    type: ActionTypes.CREATE_NEW_ROOM,
    payload: createRoom(playerID, roomCode, password, requestID),
  };
}

export function fetchNewGame(gameSettings) {
  return {
    type: ActionTypes.FETCH_NEW_GAME,
    payload: createNewGame(gameSettings),
  };
}

export function fetchGame(gameID) {
  let promise;
  if (gameID) {
    promise = getGameByID(gameID).then(game => {
      if (game.error) {
        return game;
      }
      if (game.finishedTime !== null || !getUnplayedClues(game.rounds[game.currentRound]).length) {
        console.log(`Previous game ${gameID} finished. Not reusing game.`);
        return null;
      }
      return game;
    });
  } else {
    promise = null;
  }
  return {
    type: ActionTypes.FETCH_GAME,
    payload: promise,
  };
}

export function fetchPlayers(activeFilter, page = 1) {
  return {
    type: ActionTypes.FETCH_PLAYERS,
    payload: getPlayers(activeFilter, page),
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
  };
}

export function createNewPlayer(name, preferredFontStyle) {
  return {
    type: ActionTypes.CREATE_NEW_PLAYER,
    payload: createPlayer(name, preferredFontStyle),
  };
}

export function changePlayerName(playerID, name, preferredFontStyle) {
  return {
    type: ActionTypes.CHANGE_PLAYER_NAME,
    payload: updatePlayerName(playerID, name, preferredFontStyle),
  };
}

export function fetchRoomLinkRequests(resolution, page = 1) {
  return {
    type: ActionTypes.FETCH_ROOM_LINK_REQUESTS,
    payload: getRoomLinkRequests(resolution, page),
  };
}

export function requestNewRoomLink(name, email) {
  return {
    type: ActionTypes.REQUEST_NEW_ROOM_LINK,
    payload: submitNewRoomLinkRequest(name, email),
  };
}

export function resolveRoomLinkRequest(requestID, resolution) {
  return {
    type: ActionTypes.RESOLVE_ROOM_LINK_REQUEST,
    payload: submitRoomLinkRequestResolution(requestID, resolution),
  };
}

export function fetchSeasonSummaries() {
  return {
    type: ActionTypes.FETCH_SEASON_SUMMARIES,
    payload: getSeasonSummaries(),
  };
}

export function startSpectating(roomID, playerID) {
  return send(new WebsocketEvent(EventTypes.START_SPECTATING, {roomID, playerID}));
}

export function stopSpectating(roomID, playerID, gameID) {
  const payload = {roomID, playerID};
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

export function createNewGameFailed(roomID) {
  return send(new WebsocketEvent(EventTypes.GAME_CREATION_FAILED, {roomID}));
}

export function joinRoom(playerID, roomID) {
  return send(new WebsocketEvent(EventTypes.JOIN_ROOM, {playerID, roomID}));
}

export function joinRoomWithCode(playerID, roomCode, password) {
  let payload = {playerID, roomCode};
  if (password) {
    payload.password = password;
  }
  return send(new WebsocketEvent(EventTypes.JOIN_ROOM_WITH_CODE, payload));
}

export function leaveRoom(playerID, roomID) {
  return send(new WebsocketEvent(EventTypes.LEAVE_ROOM, {playerID, roomID}));
}

export function reassignRoomHost(roomID, newHostPlayerID) {
  return send(new WebsocketEvent(EventTypes.REASSIGN_ROOM_HOST, {roomID, newHostPlayerID}));
}

export function advanceToNextRound(context) {
  return send(new WebsocketEvent(EventTypes.ADVANCE_TO_NEXT_ROUND, {context}));
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

export function abandonGame(context) {
  return send(new WebsocketEvent(EventTypes.ABANDON_GAME, {context}));
}

export function kickPlayer(roomID, playerID, duration) {
  return send(new WebsocketEvent(EventTypes.KICK_PLAYER, {roomID, playerID, duration}));
}

export function overrideServerDecision(context, value) {
  return send(new WebsocketEvent(EventTypes.OVERRIDE_SERVER_DECISION, {context, value}));
}

export function clientConnect(playerID, roomID = null) {
  return send(new WebsocketEvent(EventTypes.CLIENT_CONNECT, {playerID, roomID}));
}

export function updateGameSettings(settings) {
  return send(new WebsocketEvent(EventTypes.GAME_SETTINGS_CHANGED, {roomID: settings.roomID, settings: convertGameSettings(settings)}));
}

export function dismissActiveClue() {
  return {
    type: ActionTypes.DISMISS_CLUE,
    payload: {},
  };
}

export function clearError(error) {
  return {
    type: ActionTypes.CLEAR_ERROR,
    payload: {error},
  };
}

export function clearHostOverride(override) {
  return {
    type: ActionTypes.CLEAR_HOST_OVERRIDE,
    payload: {override},
  };
}

export function clearPlayerInControlReassigned() {
  return {
    type: ActionTypes.CLEAR_PLAYER_IN_CONTROL_REASSIGNED,
    payload: {},
  };
}

export function clearRoomLinkRequestSucceeded() {
  return {
    type: ActionTypes.CLEAR_ROOM_LINK_REQUEST_SUCCEEDED,
    payload: {},
  };
}

export function websocketConnect(url = WS_BASE) {
  return connect(url);
}

export function websocketDisconnect() {
  return disconnect();
}
