import { ActionTypes } from '../actions/action_creators';
import { EventTypes } from '../../constants.mjs';
import { isDailyDouble } from '../../utils.mjs';

function newStoreData() {
  return {
    connected: false,
    playerID: null,
    board: null,
    game: null,
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
  };
}

function handleError(storeData, event) {
  console.log(`Request to ${event.payload.eventType} failed: ${event.payload.error} (${event.payload.status})`);
  return storeData;  // TODO - should this set an error to display to the user?
}

function handlePlayerJoined(storeData, event) {
  const player = event.payload.player;
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
  return {...storeData, board: newBoard, activeClue: clue, playersMarkingClueInvalid: [], prevAnswer: null, currentWager: null, revealAnswer: false};
}

function handlePlayerBuzzed(storeData, event) {
  console.log(`${event.payload.playerID} buzzed in.`);
  const activeClue = {...storeData.activeClue, playersAttempted: storeData.activeClue.playersAttempted.concat(event.payload.playerID)};
  return {...storeData, activeClue: activeClue, playerAnswering: event.payload.playerID, prevAnswer: null};
}

function handlePlayerAnswered(storeData, event) {
  const { answer, answerDelayMillis, clueID, correct, playerID, score } = event.payload;
  const dailyDouble = isDailyDouble(storeData.board, clueID);
  const allowAnswers = (!correct && !dailyDouble && playerID !== storeData.player.playerID);
  console.log(`${playerID} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
  const newPlayer = {...storeData.players[playerID], score: score};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  let newStoreData = {...storeData, players: newPlayers, playerAnswering: null, prevAnswer: event.payload, currentWager: null, allowAnswers: allowAnswers};
  if (correct) {
    newStoreData.activeClue = null;
    newStoreData.playerInControl = playerID;
    newStoreData.revealAnswer = false;
  } else {
    newStoreData.answerDelayMillis = answerDelayMillis;
  }
  return newStoreData;
}

function handlePlayerWagered(storeData, event) {
  const { playerID, wager } = event.payload;
  console.log(`${playerID} wagered $${wager}.`);
  return {...storeData, currentWager: wager, playerAnswering: playerID};
}

function handleBuzzingPeriodEnded(storeData, event) {
  const { categoryID, clueID } = event.payload;
  console.log(`Time expired for clue ${clueID} (category ${categoryID}).`);
  return {...storeData, playerAnswering: null, allowAnswers: false, revealAnswer: true};
}

function handleWaitingPeriodEnded(storeData, event) {
  const { categoryID, clueID } = event.payload;
  console.log(`Now accepting answers for clue ${clueID} (category ${categoryID}).`);
  return {...storeData, allowAnswers: true};
}

const eventHandlers = {
  [EventTypes.ERROR]: handleError,
  [EventTypes.PLAYER_JOINED]: handlePlayerJoined,
  [EventTypes.PLAYER_SELECTED_CLUE]: handlePlayerSelectedClue,
  [EventTypes.PLAYER_BUZZED]: handlePlayerBuzzed,
  [EventTypes.PLAYER_ANSWERED]: handlePlayerAnswered,
  [EventTypes.PLAYER_WAGERED]: handlePlayerWagered,
  [EventTypes.BUZZING_PERIOD_ENDED]: handleBuzzingPeriodEnded,
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
    case ActionTypes.FETCH_GAME:
      const newGame = action.payload;
      const newBoard = newGame.rounds[newGame.currentRound];
      localStorage.setItem('gameID', newGame.gameID);
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
    case ActionTypes.FETCH_PLAYER:
      return {...storeData, player: action.payload};
    case ActionTypes.DISMISS_CLUE:
      return {...storeData, activeClue: null, playerAnswering: null, prevAnswer: null, allowAnswers: false, revealAnswer: false};
    case ActionTypes.MARK_CLUE_AS_INVALID:
      const { gameID, playerID, categoryID, clueID } = action.payload;
      if (storeData.game?.gameID === gameID && storeData.activeClue?.categoryID === categoryID &&
          storeData.activeClue?.clueID === clueID && Object.keys(storeData.game?.players).indexOf(playerID) !== -1) {
        return {...storeData, playersMarkingClueInvalid: storeData.playersMarkingClueInvalid.concat(playerID)};
      } else {
        return storeData;
      }
    case ActionTypes.RESET_PLAYER_ANSWERING:
      return {...storeData, playerAnswering: null};
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
