import { ActionTypes } from '../actions/action_creators';
import { DEFAULT_PLAYER_ID, EventTypes, GAME_ID_KEY, PLAYER_ID_KEY } from '../../constants.mjs';
import { GameSettings } from '../../models/game.mjs';
import { isDailyDouble } from '../../utils.mjs';

function newStoreData() {
  return {
    connected: false,
    error: null,
    hostPlayerID: DEFAULT_PLAYER_ID,
    playerID: localStorage.getItem(PLAYER_ID_KEY) || null,
    board: null,
    game: null,
    gameSettings: new GameSettings(),
    gameStarting: false,
    players: {},
    answerDelayMillis: 0,
    activeClue: null,
    playerAnswering: null,
    playerInControl: null,
    playersMarkingClueInvalid: [],
    playersReadyForNextRound: [],
    playersVotingToSkipClue: [],
    prevAnswer: null,
    currentWager: null,
    allowAnswers: false,
    revealAnswer: false,
    responseTimerElapsed: false,
    roundSummary: null,
  };
}

function handleError(storeData, event) {
  const { eventType, error, status } = event.payload;
  console.log(`Request to ${eventType} failed: ${error} (${status})`);
  return {...storeData, error: `Failed to ${eventType.replaceAll('_', ' ')}.`};
}

function handleNewGame(storeData, newGame) {
  if (newGame?.error) {
    return {...storeData, error: newGame.error, gameStarting: false};
  }
  if (!newGame || newGame.gameID === storeData.game?.gameID) {
    return storeData;
  }
  const newBoard = newGame.rounds[newGame.currentRound];
  let newPlayers = {...storeData.players};
  Object.entries(newGame.scores).forEach(([playerID, score]) => {
    if (newPlayers.hasOwnProperty(playerID)) {
      newPlayers[playerID].score = score;
    } else {
      /* TODO - fetch player from API? */
      console.log(`Not updating score for unknown player ${playerID}.`);
    }
  });
  localStorage.setItem(GAME_ID_KEY, newGame.gameID);
  return {
    ...storeData,
    game: newGame,
    gameStarting: false,
    board: newBoard,
    players: newPlayers,
    activeClue: newGame.activeClue,
    playersMarkingClueInvalid: newGame.activeClue?.playersMarkingInvalid || [],
    playersVotingToSkipClue: newGame.activeClue?.playersVotingToSkip || [],
    playerAnswering: newGame.playerAnswering,
    playerInControl: newGame.playerInControl,
    prevAnswer: null,
  };
}

function handleGameStarting(storeData, _) {
  console.log(`New game starting...`);
  return {...storeData, gameStarting: true};
}

function handleGameStarted(storeData, event) {
  const { game } = event.payload;
  console.log(`New game started: ${game.gameID}`);
  return handleNewGame(storeData, game);
}

function handleGameSettingsChanged(storeData, event) {
  const { settings } = event.payload;
  console.log('Game settings changed.');
  return {...storeData, gameSettings: settings};
}

function handleRoundStarted(storeData, event) {
  const { round, playerInControl } = event.payload;
  const newGame = {...storeData.game, currentRound: round};
  return {
    ...storeData,
    board: storeData.game.rounds[round],
    game: newGame,
    playerInControl: playerInControl,
    playersReadyForNextRound: [],
    roundSummary: null,
  };
}

function handleRoundEnded(storeData, event) {
  const { round } = event.payload;
  console.log(`Reached the end of the ${round} round.`);
  return {...storeData, roundSummary: event.payload};
}

function handlePlayerChangedName(storeData, event) {
  const { playerID, name, preferredFontStyle } = event.payload;
  if (!storeData.players.hasOwnProperty(playerID)) {
    console.log(`Cannot change name of unknown player "${playerID}".`);
    return storeData;
  }
  console.log(`Player ${playerID} has changed name to "${name}" (font: ${preferredFontStyle}).`);
  const newPlayer = {...storeData.players[playerID], name: name, preferredFontStyle: preferredFontStyle};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  return {...storeData, players: newPlayers};
}

function handlePlayerJoined(storeData, event) {
  const { player } = event.payload;
  console.log(`${player.name} has joined the game.`);
  let newPlayers = {...storeData.players, [player.playerID]: {...player, score: player.score || storeData.players[player.playerID]?.score}};
  let newStoreData = {...storeData, players: newPlayers};
  if (storeData.game && storeData.game.playerIDs.indexOf(player.playerID) === -1) {
    newStoreData.game = {...storeData.game, playerIDs: storeData.game.playerIDs.concat(player.playerID)};
  }
  return newStoreData;
}

function handlePlayerSelectedClue(storeData, event) {
  const { categoryID, clueID } = event.payload;
  const category = storeData.board.categories[categoryID];
  const clues = category.clues;
  const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
  if (clueIndex === -1) {
    console.log(`Player selected invalid clue: ${clueID} (category ${categoryID})`);
    return storeData;
  }
  const clue = {...clues[clueIndex], category: category.name, played: true, playersAttempted: []};
  const newBoard = {...storeData.board};
  newBoard.categories[categoryID].clues[clueIndex] = clue;
  console.log(`Playing ${category.name} for $${clue.value}.`);
  return {
    ...storeData,
    activeClue: clue,
    board: newBoard,
    currentWager: null,
    playersMarkingClueInvalid: [],
    playersVotingToSkipClue: [],
    prevAnswer: null,
    revealAnswer: false,
  };
}

function handlePlayerBuzzed(storeData, event) {
  console.log(`${event.payload.playerID} buzzed in.`);
  const activeClue = {...storeData.activeClue, playersAttempted: storeData.activeClue.playersAttempted.concat(event.payload.playerID)};
  return {...storeData, activeClue: activeClue, playerAnswering: event.payload.playerID, prevAnswer: null, responseTimerElapsed: false};
}

function handlePlayerAnswered(storeData, event) {
  const { answer, answerDelayMillis, clueID, correct, playerID, score } = event.payload;
  const dailyDouble = isDailyDouble(storeData.board, clueID);
  const allowAnswers = (!correct && !dailyDouble && playerID !== storeData.playerID);
  console.log(`${playerID} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
  const newPlayer = {...storeData.players[playerID], score: score};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  let newStoreData = {
    ...storeData,
    players: newPlayers,
    playerAnswering: null,
    prevAnswer: event.payload,
    currentWager: null,
    allowAnswers: allowAnswers,
    answerDelayMillis: answerDelayMillis,
  };
  if (correct) {
    newStoreData.activeClue = null;
    newStoreData.playerInControl = playerID;
    newStoreData.revealAnswer = false;
  } else {
    if (dailyDouble) {
      newStoreData.revealAnswer = true;
    }
  }
  return newStoreData;
}

function handlePlayerWagered(storeData, event) {
  const { playerID, wager } = event.payload;
  console.log(`${playerID} wagered $${wager}.`);
  return {...storeData, currentWager: wager, playerAnswering: playerID, responseTimerElapsed: false};
}

function handlePlayerMarkedClueAsInvalid(storeData, event) {
  const { playerID, categoryID, clueID } = event.payload;
  if (storeData.activeClue.categoryID !== categoryID || storeData.activeClue.clueID !== clueID) {
    console.log(`Ignoring player marking non-active clue ${clueID} (category ${categoryID}) as invalid.`);
    return storeData;
  }
  if (storeData.playersMarkingClueInvalid.indexOf(playerID) !== -1) {
    console.log(`Ignoring player marking active clue as invalid because ${playerID} already marked this clue.`);
    return storeData;
  }
  console.log(`${playerID} marked clue ${clueID} (category ${categoryID}) as invalid.`);
  return {...storeData, playersMarkingClueInvalid: storeData.playersMarkingClueInvalid.concat(playerID)};
}

function handlePlayerVotedToSkipClue(storeData, event) {
  const { playerID, categoryID, clueID } = event.payload;
  if (storeData.activeClue.categoryID !== categoryID || storeData.activeClue.clueID !== clueID) {
    console.log(`Ignoring vote to skip non-active clue ${clueID} (category ${categoryID}).`);
    return storeData;
  }
  if (storeData.playersVotingToSkipClue.indexOf(playerID) !== -1) {
    console.log(`Ignoring vote to skip active clue because ${playerID} already voted for this clue.`);
    return storeData;
  }
  console.log(`${playerID} voted to skip clue ${clueID} (category ${categoryID}).`);
  return {...storeData, playersVotingToSkipClue: storeData.playersVotingToSkipClue.concat(playerID)};
}

function handlePlayerWentActive(storeData, event) {
  const { playerID, players } = event.payload;
  console.log(`${playerID} went active.`);
  Object.keys(players).forEach(playerID => {
    if (storeData.players.hasOwnProperty(playerID)) {
      players[playerID].score = storeData.players[playerID].score;
    }
  });
  return {...storeData, players: players};
}

function handlePlayerWentInactive(storeData, event) {
  const { player } = event.payload;
  const playerID = player.playerID;
  if (storeData.players.hasOwnProperty(playerID)) {
    console.log(`${playerID} went inactive.`);
    const newPlayer = {...storeData.players[playerID], active: false};
    const newPlayers = {...storeData.players, [playerID]: newPlayer};
    return {...storeData, players: newPlayers};
  }
  console.log(`Ignoring status change for unknown player ${playerID}.`);
  return storeData;
}

function handlePlayerSpectatingStatusChanged(status) {
  return function handleStatusChanged(storeData, event) {
    const { playerID } = event.payload;
    if (storeData.players.hasOwnProperty(playerID)) {
      console.log(`${playerID} ${status ? 'started' : 'stopped'} spectating.`);
      const newPlayer = {...storeData.players[playerID], spectating: status};
      const newPlayers = {...storeData.players, [playerID]: newPlayer};
      return {...storeData, players: newPlayers};
    }
    console.log(`Ignoring spectating status change for unknown player ${playerID}.`);
    console.log(Object.keys(storeData.players));
    return storeData;
  };
}

function handlePlayerMarkedReadyForNextRound(storeData, event) {
  const { playerID } = event.payload;
  if (storeData.playersReadyForNextRound.indexOf(playerID) !== -1) {
    return storeData;
  }
  return {...storeData, playersReadyForNextRound: storeData.playersReadyForNextRound.concat(playerID)};
}

function handleBuzzingPeriodEnded(storeData, event) {
  const { categoryID, clueID } = event.payload;
  if (storeData.activeClue?.clueID === clueID) {
    console.log(`Time expired for clue ${clueID} (category ${categoryID}).`);
    return {...storeData, playerAnswering: null, allowAnswers: false, revealAnswer: true};
  }
  return storeData;
}

function handleResponsePeriodEnded(storeData, event) {
  const { answerDelayMillis, clueID, playerID, score, wagering } = event.payload;
  const dailyDouble = isDailyDouble(storeData.board, clueID);
  const revealAnswer = (dailyDouble && !wagering);
  console.log(`${wagering ? 'Wagering' : 'Response'} time expired for ${playerID}.`);
  let newStoreData = {...storeData, responseTimerElapsed: true, revealAnswer: revealAnswer, answerDelayMillis: answerDelayMillis};
  if (!wagering) {
    const newPlayer = {...storeData.players[playerID], score: score};
    newStoreData.players = {...storeData.players, [playerID]: newPlayer};
    newStoreData.playerAnswering = null;
  }
  return newStoreData;
}

function handleWaitingPeriodEnded(storeData, event) {
  const { categoryID, clueID } = event.payload;
  console.log(`Now accepting answers for clue ${clueID} (category ${categoryID}).`);
  return {...storeData, allowAnswers: true};
}

const eventHandlers = {
  [EventTypes.ERROR]: handleError,
  [EventTypes.GAME_STARTING]: handleGameStarting,
  [EventTypes.GAME_STARTED]: handleGameStarted,
  [EventTypes.GAME_SETTINGS_CHANGED]: handleGameSettingsChanged,
  [EventTypes.ROUND_STARTED]: handleRoundStarted,
  [EventTypes.ROUND_ENDED]: handleRoundEnded,
  [EventTypes.PLAYER_CHANGED_NAME]: handlePlayerChangedName,
  [EventTypes.PLAYER_JOINED]: handlePlayerJoined,
  [EventTypes.PLAYER_SELECTED_CLUE]: handlePlayerSelectedClue,
  [EventTypes.PLAYER_BUZZED]: handlePlayerBuzzed,
  [EventTypes.PLAYER_ANSWERED]: handlePlayerAnswered,
  [EventTypes.PLAYER_WAGERED]: handlePlayerWagered,
  [EventTypes.PLAYER_MARKED_CLUE_AS_INVALID]: handlePlayerMarkedClueAsInvalid,
  [EventTypes.PLAYER_VOTED_TO_SKIP_CLUE]: handlePlayerVotedToSkipClue,
  [EventTypes.PLAYER_STARTED_SPECTATING]: handlePlayerSpectatingStatusChanged(true),
  [EventTypes.PLAYER_STOPPED_SPECTATING]: handlePlayerSpectatingStatusChanged(false),
  [EventTypes.PLAYER_MARKED_READY_FOR_NEXT_ROUND]: handlePlayerMarkedReadyForNextRound,
  [EventTypes.PLAYER_WENT_ACTIVE]: handlePlayerWentActive,
  [EventTypes.PLAYER_WENT_INACTIVE]: handlePlayerWentInactive,
  [EventTypes.BUZZING_PERIOD_ENDED]: handleBuzzingPeriodEnded,
  [EventTypes.RESPONSE_PERIOD_ENDED]: handleResponsePeriodEnded,
  [EventTypes.WAITING_PERIOD_ENDED]: handleWaitingPeriodEnded,
}

function handleWebsocketEvent(storeData, event) {
  if (event.hasOwnProperty('message')) {
    event = JSON.parse(event.message);
  }
  const eventType = event.eventType;
  if (eventHandlers.hasOwnProperty(eventType)) {
    const handler = eventHandlers[eventType];
    return handler(storeData, event);
  } else {
    console.log(`Ignoring event with unknown type: ${eventType} (${JSON.stringify(event)})`);
    return storeData || newStoreData();
  }
}

export function GameReducer(storeData, action) {
  switch (action.type) {
    case ActionTypes.FETCH_CURRENT_GAME:
    case ActionTypes.FETCH_GAME:
    case ActionTypes.FETCH_NEW_GAME:
      const newGame = action.payload;
      return handleNewGame(storeData, newGame);
    case ActionTypes.CREATE_NEW_PLAYER:
    case ActionTypes.FETCH_PLAYER:
      const player = action.payload;
      if (!player) {
        console.log(`Failed to ${action.type === ActionTypes.CREATE_NEW_PLAYER ? 'create' : 'fetch'} player.`);
        localStorage.removeItem(PLAYER_ID_KEY);
        return {...storeData, playerID: null};
      }
      if (player.error) {
        return {...storeData, error: player.error};
      }
      const newPlayers = {...storeData.players, [player.playerID]: {...player, score: player.score || storeData.players[player.playerID]?.score}};
      if (action.type === ActionTypes.CREATE_NEW_PLAYER) {
        localStorage.setItem(PLAYER_ID_KEY, player.playerID);
      }
      return {...storeData, playerID: player.playerID, players: newPlayers};
    case ActionTypes.DISMISS_CLUE:
      return {...storeData, activeClue: null, playerAnswering: null, prevAnswer: null, allowAnswers: false, revealAnswer: false, responseTimerElapsed: false};
    case ActionTypes.CLEAR_CURRENT_GAME:
      const { gameID } = action.payload;
      if (storeData.game?.gameID === gameID) {
        localStorage.removeItem(GAME_ID_KEY);
        return {...storeData, game: null, board: null};
      }
      return storeData;
    case ActionTypes.CLEAR_ERROR:
      const { error } = action.payload;
      if (storeData.error === error) {
        return {...storeData, error: null};
      }
      return storeData;
    case ActionTypes.REDUX_WEBSOCKET_OPEN:
      return {...storeData, connected: true};
    case ActionTypes.REDUX_WEBSOCKET_CLOSED:
      return {...storeData, connected: false};
    case ActionTypes.REDUX_WEBSOCKET_MESSAGE:
      return handleWebsocketEvent(storeData, action.payload);
    default:
      return storeData || newStoreData();
  }
}
