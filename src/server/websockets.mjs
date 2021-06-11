import log from 'log';
import WebSocket from 'ws';
import {
  DAILY_DOUBLE_COUNTDOWN_SECONDS,
  DEFAULT_COUNTDOWN_SECONDS,
  EventTypes,
  MAX_PLAYERS_PER_GAME,
  WAGER_COUNTDOWN_SECONDS,
} from '../constants.mjs';
import { GamePlayer } from '../models/player.mjs';
import {
  checkSubmittedAnswer,
  formatList,
  getClueReadingDelayInMillis,
  getCountdownTimeInMillis,
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
  advanceToNextRound,
  getGame,
  getPlayer,
  getPlayers,
  incrementPlayerStat,
  markActiveClueAsInvalid,
  markPlayerAsReadyForNextRound,
  setActiveClue,
  setHighestGameScore,
  setPlayerAnswering,
  updateGame,
  updatePlayer,
  voteToSkipActiveClue,
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

function getCurrentPlaces(game, players) {
  let scores = {};
  Object.entries(game.scores).forEach(([playerID, score]) => {
    const player = players.find(player => player.playerID === playerID);
    if (player && !player.spectating) {
      scores[playerID] = score;
    }
  });
  return getPlaces(scores);
}

function checkForLastClue(game) {
  const { currentRound, gameID } = game;
  const unplayedClues = getUnplayedClues(game.rounds[currentRound], 1);
  if (unplayedClues.length === 0) {
    getPlayers(game.playerIDs).then(players => {
      const gameOver = !hasMoreRounds(game);
      const places = getCurrentPlaces(game, players);
      if (gameOver) {
        const winners = places[Object.keys(places)[0]];
        logger.info(`Game ${gameID} ended. ${formatList(winners)} ${winners.length === 1 ? 'won' : 'tied'}.`);
        updateGame(gameID, {finishedTime: new Date()}).then(() => {
          let playerUpdates = [];
          players.forEach(player => {
            const { playerID } = player;
            if (game.scores[playerID] > player.stats.highestGameScore) {
              playerUpdates.push(setHighestGameScore(playerID, game.scores[playerID]));
            }
            if (winners.indexOf(playerID) !== -1) {
              playerUpdates.push(incrementPlayerStat(playerID, 'gamesWon'));
            }
          });
          return Promise.all(playerUpdates);
        }).then(() => logger.info(`Marked game ${gameID} as finished and updated player stats.`));
      } else {
        logger.info(`Reached the end of the ${currentRound} round for game ${gameID}.`);
      }
      broadcast(new WebsocketEvent(EventTypes.ROUND_ENDED, {gameID: gameID, round: currentRound, places: places, gameOver: gameOver}));
    });
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
  updatePlayer(playerID, {active: true, lastConnectionTime: new Date()}).then(() => {
    logger.info(`${player.name} connected.`);
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
    return getPlayers(Object.keys(connectedClients));
  }).then(players => {
    let newPlayers = {};
    players.forEach(player => newPlayers[player.playerID] = player);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_WENT_ACTIVE, {playerID: playerID, players: newPlayers}));
  });
}

async function handleGameSettingsChanged(ws, event) {
  logger.info('Game settings changed.');
  broadcast(event);
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
  if (!player.spectating) {
    let players;
    try {
      players = await getPlayers(game.playerIDs);
    } catch (e) {
      handleError('failed to get players', 500);
      return;
    }
    const numPlayers = players.filter(player => !player.spectating).length;
    if (numPlayers >= MAX_PLAYERS_PER_GAME) {
      handleError(ws, event, 'max players exceeded', 400);
      return;
    }
  }
  const gamePlayer = GamePlayer.fromPlayer(player, game.scores[playerID]);
  addPlayerToGame(gameID, playerID).then(() => {
    logger.info(`${player.name} joined game ${gameID}.`);
    connectedClients[playerID] = ws;
    broadcast(new WebsocketEvent(EventTypes.PLAYER_JOINED, {player: gamePlayer}));
    if (game.playerIDs.indexOf(playerID) === -1) {
      incrementPlayerStat(playerID, 'gamesPlayed').then(() => logger.debug(`Incremented games played for ${playerID}.`));
    }
  });
}

async function validateGamePlayerAndClue(ws, event) {
  const { gameID, playerID, categoryID, clueID } = event.payload;
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, `game ${gameID} not found`, 404);
    return null;
  }
  if (game.playerIDs.indexOf(playerID) === -1) {
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
        logger.info(`${wagering ? 'Wagering' : 'Response'} time expired for ${playerID}.`);
        let newScore = game.scores[playerID];
        let newFields = {currentWager: null};
        if (!wagering) {
          const value = game.currentWager || clue.value;
          newScore -= value;
          newFields[`scores.${playerID}`] = newScore;
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

  setPlayerAnswering(gameID, playerID).then(() => incrementPlayerStat(playerID, 'cluesAnswered')).then(() => {
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
  let score = game.scores[playerID];
  let newScore = (correct ? score + value : score - value);
  let newFields = {playerAnswering: null, currentWager: null, [`scores.${playerID}`]: newScore};
  const dailyDouble = isDailyDouble(game.rounds[game.currentRound], clue.clueID);
  if (correct || dailyDouble) {
    newFields.activeClue = null;
    if (correct) {
      newFields.playerInControl = playerID;
    }
  }
  updateGame(gameID, newFields).then(() => incrementPlayerStat(playerID, 'overallScore', (correct ? value : -value))).then(() => {
    logger.info(`${playerID} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
    const delayMillis = (dailyDouble || correct ? 0 : buzzTimers[gameID]?.delayMillis);
    const payload = {...event.payload, clue: clue, correct: correct, score: newScore, value: value, answerDelayMillis: delayMillis};
    broadcast(new WebsocketEvent(EventTypes.PLAYER_ANSWERED, payload));
    if (delayMillis) {
      setExpirationTimerForClue(game.gameID, clue, delayMillis);
    }
    if (correct || dailyDouble) {
      checkForLastClue(game);
    }
    if (correct) {
      incrementPlayerStat(playerID, 'cluesAnsweredCorrectly').then(() => logger.debug(`Incremented correct answer count for ${playerID}.`));
      if (dailyDouble) {
        incrementPlayerStat(playerID, 'dailyDoublesAnsweredCorrectly').then(() => logger.debug(`Incremented correct daily double count for ${playerID}.`));
      }
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
  const [minWager, maxWager] = getWagerRange(game.currentRound, game.scores[playerID]);
  const playerWager = parseInt(wager);
  if (isNaN(playerWager) || playerWager < minWager || playerWager > maxWager) {
    handleError(ws, event, `invalid wager attempt - wager ${wager} is invalid (range is ${minWager} - ${maxWager})`, 400);
    return;
  }
  updateGame(gameID, {playerAnswering: playerID, currentWager: playerWager}).then(() =>
    incrementPlayerStat(playerID, 'cluesAnswered')
  ).then(() =>
    incrementPlayerStat(playerID, 'dailyDoublesAnswered')
  ).then(() => {
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

async function handleStartSpectating(ws, event) {
  const { playerID } = event.payload;
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', 404);
    return;
  }
  updatePlayer(playerID, {spectating: true}).then(() => {
    logger.info(`${playerID} started spectating.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_STARTED_SPECTATING, event.payload));
  });
}

async function handleStopSpectating(ws, event) {
  const { gameID, playerID } = event.payload;
  const player = await getPlayer(playerID);
  if (!player) {
    handleError(ws, event, 'player not found', 404);
    return;
  }
  if (gameID) {
    const game = await getGame(gameID);
    if (!game) {
      handleError(ws, event, 'game not found', 404);
      return;
    }
    if (game.playerIDs.indexOf(playerID) === -1) {
      handleError(ws, event, 'player not in game', 400);
      return;
    }
    let players;
    try {
      players = await getPlayers(game.playerIDs);
    } catch (e) {
      handleError(ws, event, 'failed to get players', 500);
      return;
    }
    const numPlayers = players.filter(player => !player.spectating).length;
    if (numPlayers >= MAX_PLAYERS_PER_GAME) {
      handleError(ws, event, 'max players exceeded', 400);
      return;
    }
  }
  updatePlayer(playerID, {spectating: false}).then(() => {
    logger.info(`${playerID} stopped spectating.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_STOPPED_SPECTATING, {playerID}));
  });
}

async function handleMarkClueAsInvalid(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid mark invalid attempt - no active clue', 400);
    return;
  }
  const { gameID, playerID, categoryID, clueID } = event.payload;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid mark invalid attempt - clue ${clueID} (category ${categoryID}) is not currently active`, 400);
    return;
  }
  if (game.activeClue.playersMarkingInvalid.indexOf(playerID) !== -1) {
    handleError(ws, event, `invalid mark invalid attempt - player ${playerID} has already marked clue ${clueID}`, 400);
    return;
  }
  markActiveClueAsInvalid(gameID, playerID).then(() => {
    logger.info(`${playerID} marked clue ${clueID} (category ${categoryID}) as invalid.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_MARKED_CLUE_AS_INVALID, event.payload));
  });
}

async function handleVoteToSkipClue(ws, event) {
  const game = await validateGamePlayerAndClue(ws, event);
  if (!game) {
    return;
  }
  if (!game.activeClue) {
    handleError(ws, event, 'invalid vote to skip attempt - no active clue', 400);
    return;
  }
  const { gameID, playerID, categoryID, clueID } = event.payload;
  if (game.activeClue.clueID.toString() !== clueID.toString() || game.activeClue.categoryID.toString() !== categoryID.toString()) {
    handleError(ws, event, `invalid vote to skip attempt - clue ${clueID} (category ${categoryID}) is not currently active`, 400);
    return;
  }
  if (game.activeClue.playersVotingToSkip.indexOf(playerID) !== -1) {
    handleError(ws, event, `invalid vote to skip attempt - player ${playerID} has already voted to skip clue ${clueID}`, 400);
    return;
  }
  if (game.playerAnswering) {
    handleError(ws, event, 'invalid vote to skip attempt - a player is answering', 400);
    return;
  }
  let players;
  try {
    players = await getPlayers(game.playerIDs);
  } catch (e) {
    handleError(ws, event, 'failed to get players', 500);
    return;
  }
  voteToSkipActiveClue(gameID, playerID).then(() => {
    logger.info(`${playerID} voted to skip clue ${clueID} (category ${categoryID}).`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_VOTED_TO_SKIP_CLUE, event.payload));
    const numPlayers = players.filter(player => !player.spectating).length;
    if (game.activeClue.playersVotingToSkip.length === numPlayers - 1) {
      logger.info(`Skipping clue ${clueID} (category ${categoryID}).`);
      updateGame(gameID, {activeClue: null, playerAnswering: null, currentWager: null}).then(() => {
        broadcast(new WebsocketEvent(EventTypes.BUZZING_PERIOD_ENDED, {gameID, categoryID, clueID}));
        clearTimeout(buzzTimers[gameID].timerID);
        delete buzzTimers[gameID];
      });
    }
  });
}

async function handleMarkPlayerAsReadyForNextRound(ws, event) {
  const { gameID, playerID } = event.payload;
  const game = await getGame(gameID);
  if (!game) {
    handleError(ws, event, 'game not found', 404);
    return;
  }
  if (game.playerIDs.indexOf(playerID) === -1) {
    handleError(ws, event, 'player not in game', 400);
    return;
  }
  if (game.playersReadyForNextRound.indexOf(playerID) !== -1) {
    handleError(ws, event, 'player already ready for next round', 400);
    return;
  }
  if (getUnplayedClues(game.rounds[game.currentRound], 1).length) {
    handleError(ws, event, 'current round is not over', 400);
    return;
  }
  if (!hasMoreRounds(game)) {
    handleError(ws, event, 'game does not have more rounds', 400);
    return;
  }
  let players;
  try {
    players = await getPlayers(game.playerIDs);
  } catch (e) {
    handleError('failed to get players', 500);
    return;
  }
  markPlayerAsReadyForNextRound(gameID, playerID).then(() => {
    logger.info(`${playerID} is ready for the next round in game ${gameID}.`);
    broadcast(new WebsocketEvent(EventTypes.PLAYER_MARKED_READY_FOR_NEXT_ROUND, event.payload));
    const numPlayers = players.filter(player => !player.spectating).length;
    if (game.playersReadyForNextRound.length === numPlayers - 1) {
      const round = getNextRound(game);
      const places = getCurrentPlaces(game, players);
      const placeKeys = Object.keys(places);
      const lastPlacePlayers = places[placeKeys[placeKeys.length - 1]];
      const playerInControl = (lastPlacePlayers.length === 1 ? lastPlacePlayers[0] : randomChoice(lastPlacePlayers));
      advanceToNextRound(gameID, round, playerInControl).then(() => {
        logger.info(`Advanced to the ${round} round in game ${gameID}.`);
        broadcast(new WebsocketEvent(EventTypes.ROUND_STARTED, {gameID, round, playerInControl}));
      });
    }
  });
}

const eventHandlers = {
  [EventTypes.CLIENT_CONNECT]: handleClientConnect,
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
