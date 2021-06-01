import { ActionTypes } from '../actions/action_creators';
import { DEFAULT_PLAYER_ID, EventTypes, GAME_ID_KEY, PLAYER_ID_KEY } from '../../constants.mjs';
import { GameSettings } from '../../models/game.mjs';
import { isDailyDouble } from '../../utils.mjs';

function newStoreData() {
  return {
    connected: false,
    hostPlayerID: DEFAULT_PLAYER_ID,
    playerID: null,
    board: null,
    game: null,
    gameSettings: new GameSettings(),
    players: {},
    answerDelayMillis: 0,
    activeClue: null,
    playerAnswering: null,
    playerInControl: null,
    playersMarkingClueInvalid: [],
    prevAnswer: null,
    currentWager: null,
    allowAnswers: false,
    revealAnswer: false,
    responseTimerElapsed: false,
  };
}

function handleError(storeData, event) {
  console.log(`Request to ${event.payload.eventType} failed: ${event.payload.error} (${event.payload.status})`);
  return storeData;  // TODO - should this set an error to display to the user?
}

function handleNewGame(storeData, newGame) {
  if (!newGame || newGame.gameID === storeData.game?.gameID) {
    return storeData;
  }
  const newBoard = newGame.rounds[newGame.currentRound];
  localStorage.setItem(GAME_ID_KEY, newGame.gameID);
  return {
    ...storeData,
    game: newGame,
    board: newBoard,
    players: newGame.players,
    activeClue: newGame.activeClue,
    playerAnswering: newGame.playerAnswering,
    playerInControl: newGame.playerInControl,
    prevAnswer: null,
  };
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
  let newPlayers = {...storeData.players, [player.playerID]: player};
  return {...storeData, players: newPlayers};
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
  const allowAnswers = (!correct && !dailyDouble && playerID !== storeData.player.playerID);
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

function handlePlayerActiveStatusChanged(status) {
  return function handleStatusChanged(storeData, event) {
    const { player } = event.payload;
    const playerID = player.playerID;
    if (storeData.players.hasOwnProperty(playerID)) {
      console.log(`${playerID} went ${status ? 'active' : 'inactive'}.`);
      const newPlayer = {...storeData.players[playerID], active: status};
      const newPlayers = {...storeData.players, [playerID]: newPlayer};
      return {...storeData, players: newPlayers};
    }
    if (status) {
      console.log(`${playerID} joined.`);
      const newPlayers = {...storeData.players, [playerID]: player};
      return {...storeData, players: newPlayers};
    }
    console.log(`Ignoring status change for unknown player ${playerID}.`);
    return storeData;
  };
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
  [EventTypes.GAME_STARTED]: handleGameStarted,
  [EventTypes.GAME_SETTINGS_CHANGED]: handleGameSettingsChanged,
  [EventTypes.PLAYER_CHANGED_NAME]: handlePlayerChangedName,
  [EventTypes.PLAYER_JOINED]: handlePlayerJoined,
  [EventTypes.PLAYER_SELECTED_CLUE]: handlePlayerSelectedClue,
  [EventTypes.PLAYER_BUZZED]: handlePlayerBuzzed,
  [EventTypes.PLAYER_ANSWERED]: handlePlayerAnswered,
  [EventTypes.PLAYER_WAGERED]: handlePlayerWagered,
  [EventTypes.PLAYER_WENT_ACTIVE]: handlePlayerActiveStatusChanged(true),
  [EventTypes.PLAYER_WENT_INACTIVE]: handlePlayerActiveStatusChanged(false),
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
      const newPlayers = {...storeData.players, [player.playerID]: player};
      localStorage.setItem(PLAYER_ID_KEY, player.playerID);
      return {...storeData, player: player, players: newPlayers};
    case ActionTypes.DISMISS_CLUE:
      return {...storeData, activeClue: null, playerAnswering: null, prevAnswer: null, allowAnswers: false, revealAnswer: false, responseTimerElapsed: false};
    case ActionTypes.MARK_CLUE_AS_INVALID:
      const { gameID, playerID, categoryID, clueID } = action.payload;
      if (storeData.game?.gameID === gameID && storeData.activeClue?.categoryID === categoryID &&
          storeData.activeClue?.clueID === clueID && Object.keys(storeData.game?.players).indexOf(playerID) !== -1) {
        return {...storeData, playersMarkingClueInvalid: storeData.playersMarkingClueInvalid.concat(playerID)};
      } else {
        return storeData;
      }
    case ActionTypes.SKIP_ACTIVE_CLUE:
      return {...storeData, allowAnswers: false, revealAnswer: true};
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
