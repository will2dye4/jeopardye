import log from 'log';
import WebSocket from 'ws';
import {
  DAILY_DOUBLE_COUNTDOWN_SECONDS,
  DEFAULT_COUNTDOWN_SECONDS,
  EventTypes,
  WAGER_COUNTDOWN_SECONDS,
} from '../constants.mjs';
import { GamePlayer } from '../models/player.mjs';
import {
  isDailyDouble,
  checkSubmittedAnswer,
  getClueReadingDelayInMillis,
  getCountdownTimeInMillis,
  getWagerRange,
  WebsocketEvent,
} from '../utils.mjs';
import {
  addPlayerToGame,
  getGame,
  getPlayer,
  setActiveClue,
  setPlayerAnswering,
  updateGame,
  updatePlayer,
} from './db.mjs';

const PING_INTERVAL_MILLIS = 30_000;

const logger = log.get('ws');

export let connectedClients = {};
let pingHandlers = {};

let buzzTimers = {};
let responseTimers = {};

export function broadcast(event, originatingPlayerID) {
  logger.debug(`Broadcasting ${event.eventType} event...`);
  let jsonEvent;
  Object.entries(connectedClients).forEach(([playerID, ws]) => {
    if (!originatingPlayerID || playerID !== originatingPlayerID) {
      if (!jsonEvent) {
        jsonEvent = JSON.stringify(event);
      }
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(jsonEvent);
        }
      } catch (e) {
        logger.error(`Failed to send ${event.eventType} event to player ${playerID}: ${e}`);
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

async function handleClientConnect(ws, event) {
  const { playerID } = event.payload;
  if (!playerID) {
    handleError(ws, event, 'missing player ID', 400);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', 404);
    return;
  }
  updatePlayer(playerID, {active: true}).then(() => {
    logger.info(`${player.name} connected.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_WENT_ACTIVE, {player: new GamePlayer(playerID, player.name)}));
    connectedClients[playerID] = ws;
    pingHandlers[ws] = setInterval(function() {
      logger.debug(`Pinging websocket for ${playerID}...`);
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping('jeopardye');
        }
      } catch (e) {
        logger.error(`Unexpected error while pinging websocket: ${e}`);
      }
    }, PING_INTERVAL_MILLIS);
  });
}

async function handleJoinGame(ws, event) {
  const { gameID, playerID } = event.payload;
  if (!gameID) {
    handleError(ws, event, 'missing game ID', 400);
    return;
  }
  if (!playerID) {
    handleError(ws, event, 'missing player ID', 400);
    return;
  }
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, 'game not found', 404);
    return;
  }
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', 404);
    return;
  }
  const gamePlayer = new GamePlayer(playerID, player.name);
  addPlayerToGame(gameID, gamePlayer).then(() => {
    logger.info(`${player.name} joined game ${gameID}.`);
    connectedClients[playerID] = ws;
    broadcast(new WebsocketEvent(EventTypes.PLAYER_JOINED, {player: gamePlayer}));
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

function setExpirationTimerForClue(gameID, clue, delayMillis = 0) {
  if (!delayMillis) {
    delayMillis = getCountdownTimeInMillis();
  }
  const timerID = setTimeout(function() {
    getGame(gameID).then(game => {
      if (game.activeClue?.categoryID === clue.categoryID && game.activeClue?.clueID === clue.clueID) {
        logger.info('Time expired.');
        updateGame(gameID, {activeClue: null, playerAnswering: null, currentWager: null}).then(() => {
          const payload = {gameID: gameID, categoryID: clue.categoryID, clueID: clue.clueID};
          broadcast(new WebsocketEvent(EventTypes.BUZZING_PERIOD_ENDED, payload));
          delete buzzTimers[gameID];
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
        logger.info(`${wagering ? 'Wagering' : 'Response'} time expired for ${playerID}.`);
        let newScore = game.players[playerID].score;
        let newFields = {currentWager: null};
        if (!wagering) {
          const value = game.currentWager || clue.value;
          newScore -= value;
          newFields[`players.${playerID}.score`] = newScore;
          newFields.playerAnswering = null;
          if (dailyDouble) {
            newFields.activeClue = null;
            newFields.currentWager = null;
          }
        }
        updateGame(game.gameID, newFields).then(() => {
          const answerDelayMillis = (dailyDouble || wagering ? 0 : buzzTimers[game.gameID]?.delayMillis);
          const payload = {
            gameID: game.gameID,
            playerID: playerID,
            categoryID: clue.categoryID,
            clueID: clue.clueID,
            score: newScore,
            wagering: wagering,
            answerDelayMillis: answerDelayMillis,
          };
          broadcast(new WebsocketEvent(EventTypes.RESPONSE_PERIOD_ENDED, payload));
          delete responseTimers[game.gameID];
          if (answerDelayMillis) {
            setExpirationTimerForClue(game.gameID, clue, answerDelayMillis);
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
    running: true,
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
          logger.info('Now accepting answers.');
          const payload = {gameID: game.gameID, categoryID: clue.categoryID, clueID: clue.clueID};
          broadcast(new WebsocketEvent(EventTypes.WAITING_PERIOD_ENDED, payload));
          setExpirationTimerForClue(game.gameID, clue);
        }
      });
    }, getClueReadingDelayInMillis(clue));
  }
}

async function handleSelectClue(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }
  if (game.activeClue) {
    handleError(ws, event, 'invalid select clue attempt - there is already an active clue', 400);
    return;
  }

  const { categoryID, clueID, playerID } = event.payload;
  if (playerID !== game.playerInControl) {
    handleError(ws, event, 'invalid select clue attempt - not in control', 400);
    return;
  }

  const category = game.rounds[game.currentRound].categories[categoryID];
  const clues = category.clues;
  const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
  const clue = clues[clueIndex];
  if (clue.played) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID}) - already played`, 400);
    return;
  }

  setActiveClue(game, clue).then(() => {
    logger.info(`Playing ${category.name} for $${clue.value}.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_SELECTED_CLUE, event.payload));
    setTimerForActiveClue(game, clue, playerID);
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
  if (game.playerAnswering) {
    handleError(ws, event, `invalid buzz attempt - another player is already answering`, 400);
    return;
  }

  setPlayerAnswering(gameID, playerID).then(() => {
    logger.info(`${playerID} buzzed in.`);
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
  const value = game.currentWager || clue.value;
  let score = game.players[playerID].score;
  let newScore = (correct ? score + value : score - value);
  let newFields = {playerAnswering: null, currentWager: null, [`players.${playerID}.score`]: newScore};
  const dailyDouble = isDailyDouble(game.rounds[game.currentRound], clue.clueID);
  if (correct || dailyDouble) {
    newFields.activeClue = null;
    if (correct) {
      newFields.playerInControl = playerID;
    }
  }
  updateGame(gameID, newFields).then(() => {
    logger.info(`${playerID} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
    const delayMillis = (dailyDouble || correct ? 0 : buzzTimers[gameID]?.delayMillis);
    const payload = {...event.payload, correct: correct, score: newScore, answerDelayMillis: delayMillis};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_ANSWERED, payload));
    if (delayMillis) {
      setExpirationTimerForClue(game.gameID, clue, delayMillis);
    }
  });
}

async function handleSubmitWager(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid wager attempt - no active clue', 400);
    return;
  }
  const { gameID, playerID, categoryID, clueID, wager } = event.payload;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid wager attempt - clue ${clueID} (category ${categoryID}) is not currently active`, 400);
    return;
  }
  if (!isDailyDouble(game.rounds[game.currentRound], clueID)) {
    handleError(ws, event, `invalid wager attempt - clue ${clueID} (category ${categoryID}) is not a daily double`, 400);
    return;
  }
  const [minWager, maxWager] = getWagerRange(game.currentRound, game.players[playerID].score);
  const playerWager = parseInt(wager);
  if (isNaN(playerWager) || playerWager < minWager || playerWager > maxWager) {
    handleError(ws, event, `invalid wager attempt - wager ${wager} is invalid (range is ${minWager} - ${maxWager})`, 400);
    return;
  }
  updateGame(gameID, {playerAnswering: playerID, currentWager: playerWager}).then(() => {
    logger.info(`${playerID} wagered $${playerWager}.`);
    const payload = {playerID: playerID, wager: playerWager};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_WAGERED, payload));
    const timer = responseTimers[gameID];
    if (timer && timer.categoryID === categoryID && timer.clueID === clueID && timer.playerID === playerID && timer.wagering && timer.running) {
      clearTimeout(timer.timerID);
    }
    setResponseTimerForClue(game, game.activeClue, playerID);
  });
}

const eventHandlers = {
  [EventTypes.CLIENT_CONNECT]: handleClientConnect,
  [EventTypes.JOIN_GAME]: handleJoinGame,
  [EventTypes.SELECT_CLUE]: handleSelectClue,
  [EventTypes.BUZZ_IN]: handleBuzzIn,
  [EventTypes.SUBMIT_ANSWER]: handleSubmitAnswer,
  [EventTypes.SUBMIT_WAGER]: handleSubmitWager,
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
    logger.info(`Websocket closed: ${reason} (${code})`);
    if (pingHandlers.hasOwnProperty(ws)) {
      logger.info('Removing ping handler.');
      const interval = pingHandlers[ws];
      clearInterval(interval);
      delete pingHandlers[ws];
    } else {
      logger.info('Ping handler not found; skipping.');
    }
    Object.entries(connectedClients).forEach(([playerID, socket]) => {
      if (socket === ws) {
        updatePlayer(playerID, {active: false}).then(() => {
          logger.info(`${playerID} went inactive.`);
          broadcast(new WebsocketEvent(EventTypes.PLAYER_WENT_INACTIVE, {player: new GamePlayer(playerID, null)}));
          delete connectedClients[playerID];
        });
      }
    });
  });
}
