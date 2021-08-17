import bcrypt from 'bcryptjs';
import log from 'log';
import WebSocket from 'ws';
import {
  DAILY_DOUBLE_COUNTDOWN_SECONDS,
  DAILY_DOUBLE_MINIMUM_WAGER,
  DEFAULT_COUNTDOWN_SECONDS,
  EventTypes,
  MAX_KICK_DURATION_SECONDS,
  MAX_PLAYERS_PER_GAME,
  StatusCodes,
  WAGER_COUNTDOWN_SECONDS,
} from '../constants.mjs';
import {
  CLUES_ANSWERED_STAT,
  CLUES_ANSWERED_CORRECTLY_STAT,
  DAILY_DOUBLES_ANSWERED_STAT,
  DAILY_DOUBLES_ANSWERED_CORRECTLY_STAT,
  GAMES_PLAYED_STAT,
  GAMES_WON_STAT,
  OVERALL_SCORE_STAT,
} from '../models/player.mjs';
import {
  checkSubmittedAnswer,
  EventContext,
  formatList,
  getClueReadingDelayInMillis,
  getCountdownTimeInMillis,
  getCurrentChampion,
  getNextRound,
  getPlaces,
  getUnplayedClues,
  getWagerRange,
  hasMoreRounds,
  isDailyDouble,
  randomChoice,
  WebsocketEvent,
} from '../utils.mjs';
import {
  addPlayerToGame,
  addPlayerToRoom,
  advanceToNextRound,
  getGame,
  getPlayer,
  getPlayers,
  getRoom,
  getRoomByCode,
  incrementPlayerStat,
  markActiveClueAsInvalid,
  markPlayerAsReadyForNextRound,
  removePlayerFromKickedPlayersInRoom,
  setActiveClue,
  setCurrentGameForRoom,
  setHighestGameScore,
  setPlayerAnswering,
  updateGame,
  updatePlayer,
  updateRoom,
  voteToSkipActiveClue,
} from './db.mjs';
import {
  findNewHostPlayerID,
  findNewPlayerInControl,
  removePlayerFromRoom as removePlayerHelper,
} from './utils.mjs';

const NO_ROOM_KEY = 'NO_ROOM';

const PING_INTERVAL_MILLIS = 30_000;

const REASSIGNMENT_CHECK_DELAY_MILLIS = 5_000;

const logger = log.get('ws');

export let playerNames = {};

let connectedClients = {};
let pingHandlers = {};

let buzzTimers = {};
let responseTimers = {};

class RoomLogger {
  constructor() {
    this.loggers = {};
  }

  getLogger(roomID) {
    if (!this.loggers.hasOwnProperty(roomID)) {
      getRoom(roomID).then(room => {
        const namespace = (room?.roomCode || roomID).toLowerCase().replaceAll('_', '-');
        this.loggers[roomID] = log.get(`ws:${namespace}`)
      });
    }
    return this.loggers[roomID] || logger;
  }

  debug(roomID, message) {
    this.getLogger(roomID).debug(message);
  }

  info(roomID, message) {
    this.getLogger(roomID).info(message);
  }

  error(roomID, message) {
    this.getLogger(roomID).error(message);
  }
}

const roomLogger = new RoomLogger();

function addClient(roomID, playerID, ws) {
  if (!connectedClients.hasOwnProperty(roomID)) {
    connectedClients[roomID] = {};
  }
  connectedClients[roomID][playerID] = ws;
  removeClient(NO_ROOM_KEY, playerID);
}

function removeClient(roomID, playerID) {
  if (connectedClients.hasOwnProperty(roomID)) {
    delete connectedClients[roomID][playerID];
    if (!Object.keys(connectedClients[roomID]).length) {
      delete connectedClients[roomID];
    }
  }
}

function getClients(roomID) {
  return connectedClients[roomID] || {};
}

function getClient(roomID, playerID) {
  const clients = connectedClients[roomID] || {};
  return clients[playerID] || null;
}

export function broadcast(event, originatingPlayerID) {
  const roomID = event.payload.context?.roomID || event.payload.roomID;
  if (!roomID) {
    logger.error(`Unknown room ID for ${event.eventType} event; skipping broadcast.`);
    return;
  }
  roomLogger.debug(roomID, `Broadcasting ${event.eventType} event...`);

  let jsonEvent;
  const clients = getClients(roomID);
  Object.entries(clients).forEach(([playerID, ws]) => {
    if (!originatingPlayerID || playerID !== originatingPlayerID) {
      if (!jsonEvent) {
        jsonEvent = JSON.stringify(event);
      }
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(jsonEvent);
        }
      } catch (e) {
        roomLogger.error(roomID, `Failed to send ${event.eventType} event to player ${playerID}: ${e}`);
      }
    }
  });
}

function handleError(ws, event, message, status) {
  logger.error(`Error handling ${event.eventType} event: ${message} (${status})`);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(new WebsocketEvent(EventTypes.ERROR, {eventType: event.eventType, error: message, status: status})));
  }
}

async function removePlayerFromRoom(player, roomID) {
  const newHostPlayerID = await removePlayerHelper(player, roomID);
  if (newHostPlayerID) {
    roomLogger.info(roomID || player.currentRoomID, `Reassigning host to ${getPlayerName(newHostPlayerID)}.`);
  }
  const payload = {roomID: player.currentRoomID, playerID: player.playerID, newHostPlayerID: newHostPlayerID};
  broadcast(new WebsocketEvent(EventTypes.PLAYER_LEFT_ROOM, payload));
}

function reassignPlayerInControlIfNecessary(gameID, playerID) {
  setTimeout(async function() {
    const game = await getGame(gameID);
    if (!playerID) {
      playerID = game.playerInControl;
    }
    if (game.playerInControl === playerID) {
      const player = await getPlayer(playerID);
      if (!player.active || player.currentRoomID !== game.roomID) {
        const newPlayerInControl = await findNewPlayerInControl(game);
        if (newPlayerInControl) {
          roomLogger.info(game.roomID, `Reassigning player in control to ${getPlayerName(newPlayerInControl)}.`);
          await updateGame(game.gameID, {playerInControl: newPlayerInControl});
          const payload = {roomID: game.roomID, newPlayerInControl: newPlayerInControl};
          broadcast(new WebsocketEvent(EventTypes.PLAYER_IN_CONTROL_REASSIGNED, payload), playerID);
        }
      }
    }
  }, REASSIGNMENT_CHECK_DELAY_MILLIS);
}

function reassignRoomHostIfNecessary(roomID, playerID) {
  setTimeout(async function() {
    const room = await getRoom(roomID);
    if (room.hostPlayerID === playerID) {
      const player = await getPlayer(playerID);
      if (player.currentRoomID && player.currentRoomID !== roomID) {
        await removePlayerFromRoom(player, roomID);
      } else if (!player.active || !player.currentRoomID) {
        const newHostPlayerID = await findNewHostPlayerID(room);
        if (newHostPlayerID) {
          roomLogger.info(roomID, `Reassigning host to ${getPlayerName(newHostPlayerID)}.`);
          await updateRoom(roomID, {hostPlayerID: newHostPlayerID});
          const payload = {roomID: roomID, newHostPlayerID: newHostPlayerID};
          broadcast(new WebsocketEvent(EventTypes.ROOM_HOST_REASSIGNED, payload), playerID);
        }
      }
    }
  }, REASSIGNMENT_CHECK_DELAY_MILLIS);
}

function getCurrentPlaces(game, players) {
  let scores = [];
  Object.entries(game.scores).forEach(([playerID, score]) => {
    const player = players.find(player => player.playerID === playerID);
    if (player && (!player.spectating || score !== 0)) {
      scores.push({...player, score: score});
    }
  });
  return getPlaces(scores);
}

export function getPlayerName(playerID) {
  return playerNames[playerID] || playerID;
}

function checkForLastClue(game) {
  const { currentRound, gameID } = game;
  const unplayedClues = getUnplayedClues(game.rounds[currentRound], 1);
  if (unplayedClues.length === 0) {
    getPlayers(game.playerIDs).then(players => {
      const gameOver = !hasMoreRounds(game);
      const places = getCurrentPlaces(game, players);
      const roundSummary = {round: currentRound, places: places, gameOver: gameOver};
      if (gameOver) {
        const winners = places[Object.keys(places)[0]];
        const winnerNames = winners.map(player => player.name);
        roomLogger.info(game.roomID, `Game ${gameID} ended. ${formatList(winnerNames)} ${winners.length === 1 ? 'won' : 'tied'}.`);
        updateGame(gameID, {finishedTime: new Date(), roundSummary: roundSummary}).then(() =>
          getRoom(game.roomID)
        ).then(room => {
          const currentChampion = getCurrentChampion(places);
          return setCurrentGameForRoom(room, null, currentChampion);
        }).then(() => {
          let playerUpdates = [];
          players.forEach(player => {
            const { playerID } = player;
            if (game.scores[playerID] > player.stats.highestGameScore) {
              playerUpdates.push(setHighestGameScore(playerID, game.scores[playerID]));
            }
            if (winners.find(player => player.playerID === playerID)) {
              playerUpdates.push(incrementPlayerStat(playerID, GAMES_WON_STAT));
            }
          });
          return Promise.all(playerUpdates);
        }).then(() => roomLogger.debug(game.roomID, `Marked game ${gameID} as finished and updated player stats.`));
      } else {
        updateGame(gameID, {roundSummary: roundSummary}).then(() => {
          roomLogger.info(game.roomID, `Reached the end of the ${currentRound} round for game ${gameID}.`);
        });
      }
      broadcast(new WebsocketEvent(EventTypes.ROUND_ENDED, {...roundSummary, gameID: gameID, roomID: game.roomID}));
    });
  }
}

async function handleClientConnect(ws, event) {
  let { playerID, roomID } = event.payload;
  if (!playerID) {
    handleError(ws, event, 'missing player ID', StatusCodes.BAD_REQUEST);
    return;
  }

  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }

  let room;
  if (roomID) {
    room = await getRoom(roomID);
    if (!room) {
      handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
      return;
    }
    if (room.kickedPlayerIDs.hasOwnProperty(playerID)) {
      const expiration = room.kickedPlayerIDs[playerID];
      if ((expiration === null || Date.now() < expiration) && playerID !== room.ownerPlayerID) {
        handleError(ws, event, 'player was kicked from room', StatusCodes.CONFLICT);
        return;
      }
      roomLogger.info(roomID, `Removing ${getPlayerName(playerID)} from kicked players.`);
      await removePlayerFromKickedPlayersInRoom(roomID, playerID);
    }
  } else {
    roomID = NO_ROOM_KEY;
  }

  let playerUpdates = {active: true, lastConnectionTime: new Date()};
  if (room && player.currentRoomID !== room.roomID) {
    playerUpdates.currentRoomID = room.roomID;
    if (player.currentRoomID) {
      await removePlayerFromRoom(player);
    }
  }
  await updatePlayer(playerID, playerUpdates);
  if (room && !room.playerIDs.includes(playerID)) {
    await addPlayerToRoom(room.roomID, playerID);
  }

  roomLogger.info(roomID, `${player.name} connected.`);
  addClient(roomID, playerID, ws);
  playerNames[playerID] = player.name;

  pingHandlers[ws] = setInterval(function() {
    logger.debug(`Pinging websocket for ${getPlayerName(playerID)}...`);
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping('jeopardye');
      }
    } catch (e) {
      logger.error(`Unexpected error while pinging websocket: ${e}`);
    }
  }, PING_INTERVAL_MILLIS);

  if (room) {
    const players = await getPlayers(room.playerIDs);
    let newPlayers = {};
    players.forEach(player => {
      if (player.currentRoomID === room.roomID) {
        newPlayers[player.playerID] = player;
      }
    });
    broadcast(new WebsocketEvent(EventTypes.PLAYER_WENT_ACTIVE, {roomID: room.roomID, playerID: playerID, players: newPlayers}));
    if (room.currentGameID) {
      reassignPlayerInControlIfNecessary(room.currentGameID);
    }
  }
}

async function handleReassignRoomHost(ws, event) {
  const { roomID, newHostPlayerID } = event.payload;
  if (!roomID) {
    handleError(ws, event, 'missing room ID', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!newHostPlayerID) {
    handleError(ws, event, 'missing new host player ID', StatusCodes.BAD_REQUEST);
    return;
  }
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  const player = await getPlayer(newHostPlayerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (!room.playerIDs.includes(newHostPlayerID) || player.currentRoomID !== roomID) {
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  if (room.hostPlayerID !== newHostPlayerID) {
    await updateRoom(roomID, {hostPlayerID: newHostPlayerID});
    roomLogger.info(roomID, `Reassigning host to ${getPlayerName(newHostPlayerID)}.`);
    broadcast(new WebsocketEvent(EventTypes.ROOM_HOST_REASSIGNED, event.payload));
  }
}

async function joinRoom(player, room, ws, event) {
  if (room.kickedPlayerIDs.hasOwnProperty(player.playerID)) {
    const expiration = room.kickedPlayerIDs[player.playerID];
    if ((expiration === null || Date.now() < expiration) && player.playerID !== room.ownerPlayerID) {
      handleError(ws, event, 'player was kicked from room', StatusCodes.CONFLICT);
      return;
    }
    roomLogger.info(room.roomID, `Removing ${getPlayerName(player.playerID)} from kicked players.`);
    await removePlayerFromKickedPlayersInRoom(room.roomID, player.playerID);
  }
  if (player.currentRoomID !== room.roomID) {
    await updatePlayer(player.playerID, {currentRoomID: room.roomID});
    if (player.currentRoomID) {
      await removePlayerFromRoom(player);
    }
  }
  if (!room.playerIDs.includes(player.playerID)) {
    room.playerIDs.push(player.playerID);
    await addPlayerToRoom(room.roomID, player.playerID);
  }
  roomLogger.info(room.roomID, `${player.name} joined room.`);
  addClient(room.roomID, player.playerID, ws);
  if (player.currentRoomID && player.currentRoomID !== room.roomID) {
    removeClient(player.currentRoomID, player.playerID);
  }
  const players = await getPlayers(room.playerIDs);
  let newPlayers = {};
  players.forEach(player => {
    if (player.currentRoomID === room.roomID) {
      newPlayers[player.playerID] = player;
    }
  });
  broadcast(new WebsocketEvent(EventTypes.PLAYER_JOINED_ROOM, {roomID: room.roomID, playerID: player.playerID, players: newPlayers}));
}

async function handleJoinRoom(ws, event) {
  const { playerID, roomID } = event.payload;
  if (!playerID) {
    handleError(ws, event, 'missing player ID', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!roomID) {
    handleError(ws, event, 'missing room ID', StatusCodes.BAD_REQUEST);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (room.passwordHash && player.currentRoomID !== room.roomID) {
    /* require player to already be in the room's player list if the room is password-protected */
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  await joinRoom(player, room, ws, event);
}

async function handleJoinRoomWithCode(ws, event) {
  const { playerID, roomCode, password } = event.payload;
  if (!playerID) {
    handleError(ws, event, 'missing player ID', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!roomCode) {
    handleError(ws, event, 'missing room code', StatusCodes.BAD_REQUEST);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  const room = await getRoomByCode(roomCode);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (room.passwordHash && !bcrypt.compareSync(password || '', room.passwordHash)) {
    handleError(ws, event, 'invalid password', StatusCodes.UNAUTHORIZED);
    return;
  }
  await joinRoom(player, room, ws, event);
}

async function handleLeaveRoom(ws, event) {
  const { roomID, playerID } = event.payload;
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (!room.playerIDs.includes(playerID) || player.currentRoomID !== roomID) {
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  removePlayerFromRoom(player).then(() => updatePlayer(playerID, {currentRoomID: null})).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} left room.`);
    removeClient(roomID, playerID);
    addClient(NO_ROOM_KEY, playerID, ws);
    if (room.currentGameID) {
      reassignPlayerInControlIfNecessary(room.currentGameID, playerID);
    }
  });
}

async function handleGameSettingsChanged(ws, event) {
  roomLogger.info(event.payload.roomID, 'Game settings changed.');
  broadcast(event);
}

async function handleJoinGame(ws, event) {
  const { roomID, gameID, playerID } = event.payload.context;
  if (!roomID) {
    handleError(ws, event, 'missing room ID', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!gameID) {
    handleError(ws, event, 'missing game ID', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!playerID) {
    handleError(ws, event, 'missing player ID', StatusCodes.BAD_REQUEST);
    return;
  }
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, 'game not found', StatusCodes.NOT_FOUND);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (!room.playerIDs.includes(playerID) || player.currentRoomID !== roomID) {
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!player.spectating) {
    let players;
    try {
      players = await getPlayers(game.playerIDs);
    } catch (e) {
      handleError('failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }
    const numPlayers = players.filter(player => player.active && player.currentRoomID === roomID && !player.spectating).length;
    if (numPlayers >= MAX_PLAYERS_PER_GAME) {
      handleError(ws, event, 'max players exceeded', StatusCodes.BAD_REQUEST);
      return;
    }
  }
  addPlayerToGame(gameID, playerID).then(() => {
    roomLogger.info(roomID, `${player.name} joined game ${gameID}.`);
    addClient(roomID, playerID, ws);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_JOINED, {roomID: roomID, player: {...player, score: game.scores[playerID]}}));
    if (!game.playerIDs.includes(playerID)) {
      incrementPlayerStat(playerID, GAMES_PLAYED_STAT).then(() => roomLogger.debug(roomID, `Incremented games played for ${playerID}.`));
    }
  });
}

async function validateEventContext(ws, event, validateClue = true) {
  const errorResult = {game: null, room: null};
  const { roomID, gameID, playerID, categoryID, clueID } = event.payload.context;
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, `room ${roomID} not found`, StatusCodes.NOT_FOUND);
    return errorResult;
  }
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, `game ${gameID} not found`, StatusCodes.NOT_FOUND);
    return errorResult;
  }
  if (room.currentGameID !== gameID || game.roomID !== roomID) {
    handleError(ws, event, `game ${gameID} is not active in room ${roomID}`, StatusCodes.BAD_REQUEST);
    return errorResult;
  }
  if (!game.playerIDs.includes(playerID)) {
    handleError(ws, event, `player ${playerID} not in game ${gameID}`, StatusCodes.BAD_REQUEST);
    return errorResult;
  }
  if (validateClue) {
    const categories = game.rounds[game.currentRound].categories;
    if (!categories.hasOwnProperty(categoryID)) {
      handleError(ws, event, `invalid category ${categoryID}`, StatusCodes.BAD_REQUEST);
      return errorResult;
    }
    if (!categories[categoryID].clues.find(clue => clue.clueID === clueID)) {
      handleError(ws, event, `invalid clue ${clueID} (category ${categoryID})`, StatusCodes.BAD_REQUEST);
      return errorResult;
    }
  }
  return {game, room};
}

function setExpirationTimerForClue(gameID, clue, delayMillis = 0) {
  if (!delayMillis) {
    delayMillis = getCountdownTimeInMillis();
  }
  const timerID = setTimeout(function() {
    getGame(gameID).then(game => {
      if (game.activeClue?.categoryID === clue.categoryID && game.activeClue?.clueID === clue.clueID) {
        roomLogger.info(game.roomID, 'Time expired.');
        updateGame(gameID, {activeClue: null, playerAnswering: null, currentWager: null}).then(() => {
          const payload = {context: EventContext.fromGameAndClue(game, clue), skipped: false};
          broadcast(new WebsocketEvent(EventTypes.BUZZING_PERIOD_ENDED, payload));
          delete buzzTimers[gameID];
          checkForLastClue(game);
        });
      }
    });
  }, delayMillis);
  buzzTimers[gameID] = {
    categoryID: clue.categoryID,
    clueID: clue.clueID,
    timerID: timerID,
    delayMillis: delayMillis,
    started: Date.now(),
    running: true,
  };
}

function setResponseTimerForClue(game, clue, playerID, wagering = false) {
  const dailyDouble = isDailyDouble(game.rounds[game.currentRound], clue.clueID);
  const delayMillis = (wagering ? WAGER_COUNTDOWN_SECONDS : (dailyDouble ? DAILY_DOUBLE_COUNTDOWN_SECONDS : DEFAULT_COUNTDOWN_SECONDS)) * 1000;
  const timerID = setTimeout(function() {
    getGame(game.gameID).then(game => {
      const expectedPlayerID = (wagering ? game.playerInControl : game.playerAnswering);
      if (game.activeClue?.categoryID === clue.categoryID && game.activeClue?.clueID === clue.clueID && expectedPlayerID === playerID) {
        roomLogger.info(game.roomID, `${wagering ? 'Wagering' : 'Response'} time expired for ${getPlayerName(playerID)}.`);
        if (wagering) {
          submitWager(game, clue.categoryID, clue.clueID, playerID, DAILY_DOUBLE_MINIMUM_WAGER);
          return;
        }
        const value = game.currentWager || clue.value;
        const newScore = game.scores[playerID] - value;
        let newFields = {currentWager: null, playerAnswering: null, [`scores.${playerID}`]: newScore};
        if (dailyDouble) {
          newFields.activeClue = null;
        }
        updateGame(game.gameID, newFields).then(() => {
          const answerDelayMillis = (dailyDouble ? 0 : buzzTimers[game.gameID]?.delayMillis);
          const payload = {
            context: EventContext.fromGameAndClue(game, clue, playerID),
            score: newScore,
            answerDelayMillis: answerDelayMillis,
          };
          broadcast(new WebsocketEvent(EventTypes.RESPONSE_PERIOD_ENDED, payload));
          delete responseTimers[game.gameID];
          if (answerDelayMillis) {
            setExpirationTimerForClue(game.gameID, clue, answerDelayMillis);
          }
          if (dailyDouble) {
            game.scores[playerID] = newScore;
            checkForLastClue(game);
          }
        });
      }
    });
  }, delayMillis);
  responseTimers[game.gameID] = {
    playerID: playerID,
    categoryID: clue.categoryID,
    clueID: clue.clueID,
    timerID: timerID,
    wagering: wagering,
  };
}

function setTimerForActiveClue(game, clue, playerID) {
  if (isDailyDouble(game.rounds[game.currentRound], clue.clueID)) {
    setResponseTimerForClue(game, clue, playerID, true);
  } else {
    setTimeout(function() {
      getGame(game.gameID).then(game => {
        if (game.activeClue?.categoryID === clue.categoryID && game.activeClue?.clueID === clue.clueID) {
          roomLogger.info(game.roomID, 'Now accepting answers.');
          broadcast(new WebsocketEvent(EventTypes.WAITING_PERIOD_ENDED, {context: EventContext.fromGameAndClue(game, clue)}));
          setExpirationTimerForClue(game.gameID, clue);
        }
      });
    }, getClueReadingDelayInMillis(clue));
  }
}

async function handleSelectClue(ws, event) {
  const { game } = await validateEventContext(ws, event);
  if (!game) {
    return;
  }
  if (game.activeClue) {
    handleError(ws, event, 'invalid select clue attempt - there is already an active clue', StatusCodes.BAD_REQUEST);
    return;
  }

  const { categoryID, clueID, playerID, roomID } = event.payload.context;
  if (playerID !== game.playerInControl) {
    handleError(ws, event, 'invalid select clue attempt - not in control', StatusCodes.BAD_REQUEST);
    return;
  }

  const category = game.rounds[game.currentRound].categories[categoryID];
  const clues = category.clues;
  const clue = clues.find(clue => clue.clueID === clueID);
  if (clue.played) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID}) - already played`, StatusCodes.BAD_REQUEST);
    return;
  }

  setActiveClue(game, clue).then(() => {
    roomLogger.info(roomID, `Playing ${category.name} for $${clue.value}.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_SELECTED_CLUE, event.payload));
    setTimerForActiveClue(game, clue, playerID);
  });
}

async function handleBuzzIn(ws, event) {
  const { game } = await validateEventContext(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid buzz attempt - no active clue', StatusCodes.BAD_REQUEST);
    return;
  }
  const { roomID, gameID, playerID, categoryID, clueID } = event.payload.context;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid buzz attempt - clue ${clueID} (category ${categoryID}) is not currently active`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.activeClue.playersAttempted.includes(playerID)) {
    handleError(ws, event, `invalid buzz attempt - player ${playerID} has already buzzed in`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.playerAnswering) {
    handleError(ws, event, `invalid buzz attempt - another player is already answering`, StatusCodes.CONFLICT);
    return;
  }

  setPlayerAnswering(gameID, playerID).then(() => incrementPlayerStat(playerID, CLUES_ANSWERED_STAT)).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} buzzed in.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_BUZZED, event.payload));
    const timer = buzzTimers[gameID];
    if (timer && timer.categoryID === categoryID && timer.clueID === clueID && timer.running) {
      clearTimeout(timer.timerID);
      const elapsedMillis = Date.now() - timer.started;
      timer.running = false;
      timer.started = 0;
      timer.delayMillis -= elapsedMillis;
    }
    setResponseTimerForClue(game, game.activeClue, playerID);
  }).catch(e => roomLogger.error(roomID, `Failed to set player answering to ${playerID}: ${e}`));
}

async function handleSubmitAnswer(ws, event) {
  const { game } = await validateEventContext(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid answer attempt - no active clue', StatusCodes.BAD_REQUEST);
    return;
  }
  const { roomID, gameID, playerID, categoryID, clueID } = event.payload.context;
  const answer = event.payload.answer;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid answer attempt - clue ${clueID} (category ${categoryID}) is not currently active`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.playerAnswering.toString() !== playerID.toString()) {
    handleError(ws, event, `invalid answer attempt - player ${playerID} is not currently answering`, StatusCodes.BAD_REQUEST);
    return;
  }
  const clues = game.rounds[game.currentRound].categories[categoryID].clues;
  const clue = clues.find(clue => clue.clueID === clueID);
  const correct = checkSubmittedAnswer(clue.answer, answer);
  const value = game.currentWager || clue.value;
  const score = game.scores[playerID];
  const newScore = (correct ? score + value : score - value);
  let newFields = {playerAnswering: null, currentWager: null, [`scores.${playerID}`]: newScore};
  const dailyDouble = isDailyDouble(game.rounds[game.currentRound], clue.clueID);
  if (correct || dailyDouble) {
    newFields.activeClue = null;
    if (correct) {
      newFields.playerInControl = playerID;
    }
  }
  updateGame(gameID, newFields).then(() => incrementPlayerStat(playerID, OVERALL_SCORE_STAT, (correct ? value : -value))).then(() => {
    const name = getPlayerName(playerID);
    roomLogger.info(roomID, `${name} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
    const delayMillis = (dailyDouble || correct ? 0 : buzzTimers[gameID]?.delayMillis);
    const payload = {...event.payload, clue: clue, correct: correct, score: newScore, value: value, answerDelayMillis: delayMillis};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_ANSWERED, payload));
    if (delayMillis) {
      setExpirationTimerForClue(game.gameID, clue, delayMillis);
    }
    if (correct || dailyDouble) {
      game.scores[playerID] = newScore;
      checkForLastClue(game);
    }
    if (correct) {
      incrementPlayerStat(playerID, CLUES_ANSWERED_CORRECTLY_STAT).then(() => roomLogger.debug(roomID, `Incremented correct answer count for ${name}.`));
      if (dailyDouble) {
        incrementPlayerStat(playerID, DAILY_DOUBLES_ANSWERED_CORRECTLY_STAT).then(() => roomLogger.debug(roomID, `Incremented correct daily double count for ${name}.`));
      }
    }
  });
}

function submitWager(game, categoryID, clueID, playerID, wager) {
  updateGame(game.gameID, {playerAnswering: playerID, currentWager: wager}).then(() =>
    incrementPlayerStat(playerID, CLUES_ANSWERED_STAT)
  ).then(() =>
    incrementPlayerStat(playerID, DAILY_DOUBLES_ANSWERED_STAT)
  ).then(() => {
    roomLogger.info(game.roomID, `${getPlayerName(playerID)} wagered $${wager.toLocaleString()}.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_WAGERED, {roomID: game.roomID, playerID: playerID, wager: wager}));
    const timer = responseTimers[game.gameID];
    if (timer && timer.categoryID === categoryID && timer.clueID === clueID && timer.playerID === playerID && timer.wagering) {
      clearTimeout(timer.timerID);
    }
    setResponseTimerForClue(game, game.activeClue, playerID);
  });
}

async function handleSubmitWager(ws, event) {
  const { game } = await validateEventContext(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid wager attempt - no active clue', StatusCodes.BAD_REQUEST);
    return;
  }
  const { playerID, categoryID, clueID } = event.payload.context;
  const wager = event.payload.wager;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid wager attempt - clue ${clueID} (category ${categoryID}) is not currently active`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (!isDailyDouble(game.rounds[game.currentRound], clueID)) {
    handleError(ws, event, `invalid wager attempt - clue ${clueID} (category ${categoryID}) is not a daily double`, StatusCodes.BAD_REQUEST);
    return;
  }
  const [minWager, maxWager] = getWagerRange(game.currentRound, game.scores[playerID]);
  const playerWager = parseInt(wager);
  if (isNaN(playerWager) || playerWager < minWager || playerWager > maxWager) {
    handleError(ws, event, `invalid wager attempt - wager ${wager} is invalid (range is ${minWager} - ${maxWager})`, StatusCodes.BAD_REQUEST);
    return;
  }
  submitWager(game, categoryID, clueID, playerID, playerWager);
}

async function handleStartSpectating(ws, event) {
  const { roomID, playerID } = event.payload;
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (player.currentRoomID !== roomID) {
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  updatePlayer(playerID, {spectating: true}).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} started spectating.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_STARTED_SPECTATING, event.payload));
  });
}

async function handleStopSpectating(ws, event) {
  const { roomID, gameID, playerID } = event.payload;
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (player.currentRoomID !== roomID) {
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  if (gameID) {
    const game = await getGame(gameID);
    if (!game) {
      handleError(ws, event, 'game not found', StatusCodes.NOT_FOUND);
      return;
    }
    if (!game.playerIDs.includes(playerID)) {
      handleError(ws, event, 'player not in game', StatusCodes.BAD_REQUEST);
      return;
    }
    let players;
    try {
      players = await getPlayers(game.playerIDs);
    } catch (e) {
      handleError(ws, event, 'failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
      return;
    }
    const numPlayers = players.filter(player => player.active && player.currentRoomID === roomID && !player.spectating).length;
    if (numPlayers >= MAX_PLAYERS_PER_GAME) {
      handleError(ws, event, 'max players exceeded', StatusCodes.BAD_REQUEST);
      return;
    }
  }
  updatePlayer(playerID, {spectating: false}).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} stopped spectating.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_STOPPED_SPECTATING, {roomID, playerID}));
  });
}

async function handleMarkClueAsInvalid(ws, event) {
  const { game } = await validateEventContext(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid mark invalid attempt - no active clue', StatusCodes.BAD_REQUEST);
    return;
  }
  const { roomID, gameID, playerID, categoryID, clueID } = event.payload.context;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid mark invalid attempt - clue ${clueID} (category ${categoryID}) is not currently active`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.activeClue.playersMarkingInvalid.includes(playerID)) {
    handleError(ws, event, `invalid mark invalid attempt - player ${playerID} has already marked clue ${clueID}`, StatusCodes.BAD_REQUEST);
    return;
  }
  markActiveClueAsInvalid(gameID, playerID).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} marked clue ${clueID} (category ${categoryID}) as invalid.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_MARKED_CLUE_AS_INVALID, event.payload));
  });
}

async function handleVoteToSkipClue(ws, event) {
  const { game } = await validateEventContext(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid vote to skip attempt - no active clue', StatusCodes.BAD_REQUEST);
    return;
  }
  const { roomID, gameID, playerID, categoryID, clueID } = event.payload.context;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid vote to skip attempt - clue ${clueID} (category ${categoryID}) is not currently active`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.activeClue.playersVotingToSkip.includes(playerID)) {
    handleError(ws, event, `invalid vote to skip attempt - player ${playerID} has already voted to skip clue ${clueID}`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.playerAnswering) {
    handleError(ws, event, 'invalid vote to skip attempt - a player is answering', StatusCodes.BAD_REQUEST);
    return;
  }
  let players;
  try {
    players = await getPlayers(game.playerIDs);
  } catch (e) {
    handleError(ws, event, 'failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }
  voteToSkipActiveClue(gameID, playerID).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} voted to skip clue ${clueID} (category ${categoryID}).`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_VOTED_TO_SKIP_CLUE, event.payload));
    const numPlayers = players.filter(player => player.active && !player.spectating).length;
    if (game.activeClue.playersVotingToSkip.length === numPlayers - 1) {
      roomLogger.info(roomID, `Skipping clue ${clueID} (category ${categoryID}).`);
      updateGame(gameID, {activeClue: null, playerAnswering: null, currentWager: null}).then(() => {
        broadcast(new WebsocketEvent(EventTypes.BUZZING_PERIOD_ENDED, {context: event.payload.context, skipped: true}));
        clearTimeout(buzzTimers[gameID].timerID);
        delete buzzTimers[gameID];
        checkForLastClue(game);
      });
    }
  });
}

async function handleOverrideServerDecision(ws, event) {
  const { roomID, gameID, playerID, categoryID, clueID } = event.payload.context;
  const value = event.payload.value;
  const { game, room } = await validateEventContext(ws, event, false);
  if (!game) {
    return;
  }
  const hostWS = getClient(roomID, room.hostPlayerID);
  if (!hostWS || ws !== hostWS) {
    handleError(ws, event, 'only the host may override server decisions', StatusCodes.FORBIDDEN);
    return;
  }
  let clue, round;
  for (const roundName of Object.keys(game.rounds)) {
    round = game.rounds[roundName];
    const categories = round.categories;
    if (categories.hasOwnProperty(categoryID)) {
      clue = categories[categoryID].clues.find(clue => clue.clueID === clueID);
    }
    if (clue || roundName === game.currentRound) {
      break;
    }
  }
  if (!clue) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID})`, StatusCodes.BAD_REQUEST);
    return;
  }
  if (!clue.played) {
    handleError(ws, event, 'clue has not been played', StatusCodes.BAD_REQUEST);
    return;
  }
  const dailyDouble = isDailyDouble(round, clueID);
  if (!dailyDouble && value !== clue.value) {
    handleError(ws, event, 'invalid clue value', StatusCodes.BAD_REQUEST);
    return;
  }
  const increment = value * 2;  /* double the value that was subtracted from the player's score so they get money for being right */
  const score = game.scores[playerID] + increment;
  updateGame(gameID, {[`scores.${playerID}`]: score}).then(() => incrementPlayerStat(playerID, OVERALL_SCORE_STAT, increment)).then(() => {
    const name = getPlayerName(playerID);
    roomLogger.info(roomID, `Host overrode server's decision on ${name}'s previous answer (+$${increment.toLocaleString()}).`);
    broadcast(new WebsocketEvent(EventTypes.HOST_OVERRODE_SERVER_DECISION, {...event.payload, clue: clue, value: increment, score: score}));
    incrementPlayerStat(playerID, CLUES_ANSWERED_CORRECTLY_STAT).then(() => roomLogger.debug(roomID, `Incremented correct answer count for ${name}.`));
    if (dailyDouble) {
      incrementPlayerStat(playerID, DAILY_DOUBLES_ANSWERED_CORRECTLY_STAT).then(() => roomLogger.debug(roomID, `Incremented correct daily double count for ${name}.`));
    }
  });
}

async function handleAbandonGame(ws, event) {
  const { roomID, gameID } = event.payload.context;
  const { room } = await validateEventContext(ws, event, false);
  if (!room) {
    return;
  }
  const hostWS = getClient(roomID, room.hostPlayerID);
  if (!hostWS || ws !== hostWS) {
    handleError(ws, event, 'only the host may abandon games', StatusCodes.FORBIDDEN);
    return;
  }
  setCurrentGameForRoom(room, null).then(() => {
    roomLogger.info(roomID, `Host abandoned game ${gameID}.`);
    broadcast(new WebsocketEvent(EventTypes.HOST_ABANDONED_GAME, event.payload));
  });
}

async function handleKickPlayer(ws, event) {
  const { roomID, playerID, duration } = event.payload;
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', StatusCodes.NOT_FOUND);
    return;
  }
  const hostWS = getClient(roomID, room.hostPlayerID);
  if (!hostWS || ws !== hostWS) {
    handleError(ws, event, 'only the host may kick players', StatusCodes.FORBIDDEN);
    return;
  }
  if (!room.playerIDs.includes(playerID) || player.currentRoomID !== roomID) {
    handleError(ws, event, 'player not in room', StatusCodes.BAD_REQUEST);
    return;
  }
  if (room.kickedPlayerIDs.hasOwnProperty(playerID)) {
    handleError(ws, event, 'player already kicked from room', StatusCodes.BAD_REQUEST);
    return;
  }
  let expiration = null;
  let durationInSeconds = parseInt(duration);
  if (isNaN(durationInSeconds) || durationInSeconds < 0 || durationInSeconds > MAX_KICK_DURATION_SECONDS) {
    handleError(ws, event, 'invalid duration', StatusCodes.BAD_REQUEST);
    return;
  }
  if (durationInSeconds > 0) {
    expiration = Date.now() + (durationInSeconds * 1000);
  }
  updateRoom(roomID, {[`kickedPlayerIDs.${playerID}`]: expiration}).then(() => updatePlayer(playerID, {currentRoomID: null})).then(() => {
    roomLogger.info(roomID, `Host kicked ${getPlayerName(playerID)} ${expiration === null ? 'indefinitely' : 'until ' + new Date(expiration).toLocaleString()}.`);
    /* NOTE: order matters here - need to broadcast before removing the player's websocket from the room */
    broadcast(new WebsocketEvent(EventTypes.HOST_KICKED_PLAYER, event.payload));
    removeClient(roomID, playerID);
    addClient(NO_ROOM_KEY, playerID, ws);
    if (room.currentGameID) {
      reassignPlayerInControlIfNecessary(room.currentGameID, playerID);
    }
  });
}

function advanceRound(roomID, game, players) {
  const round = getNextRound(game);
  const places = getCurrentPlaces(game, players);
  const placeKeys = Object.keys(places);
  const lastPlacePlayers = places[placeKeys[placeKeys.length - 1]];
  const playerInControl = (lastPlacePlayers.length === 1 ? lastPlacePlayers[0] : randomChoice(lastPlacePlayers)).playerID;
  advanceToNextRound(game.gameID, round, playerInControl).then(() => {
    roomLogger.info(roomID, `Advanced to the ${round} round in game ${game.gameID}.`);
    const payload = {roomID: roomID, gameID: game.gameID, round: round, playerInControl: playerInControl};
    broadcast(new WebsocketEvent(EventTypes.ROUND_STARTED, payload));
  });
}

async function handleAdvanceToNextRound(ws, event) {
  const { game, room } = await validateEventContext(ws, event, false);
  if (!game) {
    return;
  }
  const hostWS = getClient(room.roomID, room.hostPlayerID);
  if (!hostWS || ws !== hostWS) {
    handleError(ws, event, 'only the host may advance rounds', StatusCodes.FORBIDDEN);
    return;
  }
  if (getUnplayedClues(game.rounds[game.currentRound], 1).length) {
    handleError(ws, event, 'current round is not over', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!hasMoreRounds(game)) {
    handleError(ws, event, 'game does not have more rounds', StatusCodes.BAD_REQUEST);
    return;
  }
  let players;
  try {
    players = await getPlayers(game.playerIDs);
  } catch (e) {
    handleError('failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }
  advanceRound(room.roomID, game, players);
}

async function handleMarkPlayerAsReadyForNextRound(ws, event) {
  const { roomID, gameID, playerID } = event.payload.context;
  const room = await getRoom(roomID);
  if (!room) {
    handleError(ws, event, 'room not found', StatusCodes.NOT_FOUND);
    return;
  }
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, 'game not found', StatusCodes.NOT_FOUND);
    return;
  }
  if (room.currentGameID !== gameID || game.roomID !== roomID) {
    handleError(ws, event, 'game not active in room', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!game.playerIDs.includes(playerID)) {
    handleError(ws, event, 'player not in game', StatusCodes.BAD_REQUEST);
    return;
  }
  if (game.playersReadyForNextRound.includes(playerID)) {
    handleError(ws, event, 'player already ready for next round', StatusCodes.BAD_REQUEST);
    return;
  }
  if (getUnplayedClues(game.rounds[game.currentRound], 1).length) {
    handleError(ws, event, 'current round is not over', StatusCodes.BAD_REQUEST);
    return;
  }
  if (!hasMoreRounds(game)) {
    handleError(ws, event, 'game does not have more rounds', StatusCodes.BAD_REQUEST);
    return;
  }
  let players;
  try {
    players = await getPlayers(game.playerIDs);
  } catch (e) {
    handleError('failed to get players', StatusCodes.INTERNAL_SERVER_ERROR);
    return;
  }
  markPlayerAsReadyForNextRound(gameID, playerID).then(() => {
    roomLogger.info(roomID, `${getPlayerName(playerID)} is ready for the next round in game ${gameID}.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_MARKED_READY_FOR_NEXT_ROUND, event.payload));
    const numPlayers = players.filter(player => player.active && !player.spectating).length;
    if (game.playersReadyForNextRound.length === numPlayers - 1) {
      advanceRound(roomID, game, players);
    }
  });
}

const eventHandlers = {
  [EventTypes.CLIENT_CONNECT]: handleClientConnect,
  [EventTypes.REASSIGN_ROOM_HOST]: handleReassignRoomHost,
  [EventTypes.JOIN_ROOM]: handleJoinRoom,
  [EventTypes.JOIN_ROOM_WITH_CODE]: handleJoinRoomWithCode,
  [EventTypes.LEAVE_ROOM]: handleLeaveRoom,
  [EventTypes.GAME_SETTINGS_CHANGED]: handleGameSettingsChanged,
  [EventTypes.JOIN_GAME]: handleJoinGame,
  [EventTypes.SELECT_CLUE]: handleSelectClue,
  [EventTypes.BUZZ_IN]: handleBuzzIn,
  [EventTypes.SUBMIT_ANSWER]: handleSubmitAnswer,
  [EventTypes.SUBMIT_WAGER]: handleSubmitWager,
  [EventTypes.START_SPECTATING]: handleStartSpectating,
  [EventTypes.STOP_SPECTATING]: handleStopSpectating,
  [EventTypes.MARK_CLUE_AS_INVALID]: handleMarkClueAsInvalid,
  [EventTypes.VOTE_TO_SKIP_CLUE]: handleVoteToSkipClue,
  [EventTypes.ABANDON_GAME]: handleAbandonGame,
  [EventTypes.KICK_PLAYER]: handleKickPlayer,
  [EventTypes.OVERRIDE_SERVER_DECISION]: handleOverrideServerDecision,
  [EventTypes.ADVANCE_TO_NEXT_ROUND]: handleAdvanceToNextRound,
  [EventTypes.MARK_READY_FOR_NEXT_ROUND]: handleMarkPlayerAsReadyForNextRound,
}

export function handleWebsocket(ws, req) {
  ws.on('message', async function(msg) {
    const event = JSON.parse(msg);
    const eventType = event.eventType;
    if (eventHandlers.hasOwnProperty(eventType)) {
      const handler = eventHandlers[eventType];
      try {
        await handler(ws, event);
      } catch (e) {
        logger.error(`Caught unexpected error while handling ${eventType} event: ${e}`);
        if (ws.readyState === WebSocket.OPEN) {
          const payload = {eventType: eventType, error: e.toString(), status: StatusCodes.INTERNAL_SERVER_ERROR};
          ws.send(JSON.stringify(new WebsocketEvent(EventTypes.ERROR, payload)));
        }
      }
    } else {
      logger.info(`Ignoring event with unknown type: ${eventType} (${msg})`);
    }
  });

  ws.on('ping', function(data) {
    logger.debug(`Received ping from client: ${data}`);
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.pong(data);
      }
    } catch (e) {
      logger.error(`Caught unexpected error while sending pong to client: ${e}`);
    }
  });

  ws.on('pong', function(data) {
    logger.debug(`Received pong from client: ${data}`);
  });

  ws.on('close', function(code, reason) {
    logger.debug(`Websocket closed: ${reason} (${code})`);
    if (pingHandlers.hasOwnProperty(ws)) {
      logger.debug('Removing ping handler.');
      const interval = pingHandlers[ws];
      clearInterval(interval);
      delete pingHandlers[ws];
    } else {
      logger.debug('Ping handler not found; skipping.');
    }
    Object.entries(connectedClients).forEach(([roomID, clients]) => {
      Object.entries(clients).forEach(([playerID, socket]) => {
        if (socket === ws) {
          updatePlayer(playerID, {active: false, currentRoomID: null}).then(() => {
            roomLogger.info(roomID, `${getPlayerName(playerID)} went inactive.`);
            const payload = {roomID: roomID, playerID: playerID};
            broadcast(new WebsocketEvent(EventTypes.PLAYER_WENT_INACTIVE, payload));
            removeClient(roomID, playerID);
            reassignRoomHostIfNecessary(roomID, playerID);
            getRoom(roomID).then(room => {
              if (room.currentGameID) {
                reassignPlayerInControlIfNecessary(room.currentGameID, playerID);
              }
            });
          });
        }
      });
    });
  });
}
