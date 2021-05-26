import log from 'log';
import { EventTypes } from '../constants.mjs';
import { GamePlayer } from '../models/player.mjs';
import {
  isDailyDouble,
  checkSubmittedAnswer,
  getClueReadingDelayInMillis,
  getCountdownTimeInMillis,
  getWagerRange,
  WebsocketEvent,
} from '../utils.mjs';
import { addPlayerToGame, getGame, getPlayer, setActiveClue, setPlayerAnswering, updateGame } from './db.mjs';

const logger = log.get('ws');

export let connectedClients = {};

let timers = {};

export function broadcast(event, originatingPlayerID) {
  logger.debug(`Broadcasting ${event.eventType} event...`);
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
  logger.error(`Error handling ${event.eventType} event: ${message} (${status})`);
  ws.send(JSON.stringify(new WebsocketEvent(EventTypes.ERROR, {eventType: event.eventType, error: message, status: status})));
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

function setExpirationTimerForClue(gameID, clue, dailyDouble = false, delayMillis = 0) {
  if (!delayMillis) {
    delayMillis = getCountdownTimeInMillis(dailyDouble);
  }
  const timerID = setTimeout(function() {
    getGame(gameID).then(game => {
      if (game.activeClue?.categoryID === clue.categoryID && game.activeClue?.clueID === clue.clueID) {
        logger.info(`Time expired.`);
        updateGame(gameID, {activeClue: null, playerAnswering: null, currentWager: null}).then(() => {
          const payload = {gameID: gameID, categoryID: clue.categoryID, clueID: clue.clueID};
          broadcast(new WebsocketEvent(EventTypes.BUZZING_PERIOD_ENDED, payload));
          delete timers[gameID];
        });
      }
    });
  }, delayMillis);
  timers[gameID] = {
    categoryID: clue.categoryID,
    clueID: clue.clueID,
    timerID: timerID,
    delayMillis: delayMillis,
    started: Date.now(),
    running: true,
  };
}

function setTimerForActiveClue(game, clue) {
  if (isDailyDouble(game.rounds[game.currentRound], clue.clueID)) {
    setExpirationTimerForClue(game.gameID, clue, true);
  } else {
    setTimeout(function() {
      getGame(game.gameID).then(game => {
        if (game.activeClue?.categoryID === clue.categoryID && game.activeClue?.clueID === clue.clueID) {
          logger.info(`Now accepting answers.`);
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

  const { categoryID, clueID } = event.payload;
  const category = game.rounds[game.currentRound].categories[categoryID];
  const clues = category.clues;
  const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
  const clue = clues[clueIndex];
  if (clue.played) {
    handleError(ws, event, `invalid clue ${clueID} (category ${categoryID}) - already played`, 400);
    return;
  }
  /* TODO - ensure there isn't already an active clue? */

  setActiveClue(game, clue).then(() => {
    logger.info(`Playing ${category.name} for $${clue.value}.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_SELECTED_CLUE, event.payload));
    setTimerForActiveClue(game, clue);
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
    logger.info(`${playerID} buzzed in.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_BUZZED, event.payload));
    const timer = timers[gameID];
    if (timer.categoryID === categoryID && timer.clueID === clueID && timer.running) {
      clearTimeout(timer.timerID);
      const elapsedMillis = Date.now() - timer.started;
      timer.running = false;
      timer.started = 0;
      timer.delayMillis -= elapsedMillis;
    }
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
  if (correct) {
    newFields.activeClue = null;
    newFields.playerInControl = playerID;
  }
  updateGame(gameID, newFields).then(() => {
    logger.info(`${playerID} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
    const dailyDouble = isDailyDouble(game.rounds[game.currentRound], clue.clueID);
    const delayMillis = (dailyDouble || correct ? 0 : timers[gameID]?.delayMillis);
    const payload = {...event.payload, correct: correct, score: newScore, answerDelayMillis: delayMillis};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_ANSWERED, payload));
    if (!correct && !dailyDouble) {
      setExpirationTimerForClue(game.gameID, clue, false, delayMillis);
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
  });
}

const eventHandlers = {
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
}
