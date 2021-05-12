import { ActionTypes } from './action_creators';
import { EventTypes } from '../constants.mjs';

function newStoreData() {
  return {
    connected: false,
    board: null,
    game: null,
    players: {},
    activeClue: null,
    playerAnswering: null,
    playerInControl: null,
  };
}

function handleWebsocketEvent(storeData, event) {
  if (event.hasOwnProperty('message')) {
    event = JSON.parse(event.message);
  }
  switch (event.eventType) {
    case EventTypes.ERROR:
      console.log(`Request to ${event.payload.eventType} failed: ${event.payload.error} (${event.payload.status})`);
      return storeData;  // TODO - should this set an error to display to the user?
    case EventTypes.PLAYER_JOINED:
      const player = event.payload.player;
      console.log(`${player.name} has joined the game.`);
      let newPlayers = {...storeData.players, [player.playerID]: player};
      return {...storeData, players: newPlayers};
    case EventTypes.PLAYER_SELECTED_CLUE:
      const { categoryID, clueID } = event.payload;
      const category = storeData.board.categories[categoryID];
      const clues = category.clues;
      const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
      if (clueIndex === -1) {
        console.log(`Player selected invalid clue: ${clueID} (category ${categoryID})`);
        return storeData;
      }
      const clue = {...clues[clueIndex], category: category.name, categoryID: categoryID};
      console.log(`Playing ${category.name} for $${clue.value}.`);
      return {...storeData, activeClue: clue};
    case EventTypes.PLAYER_BUZZED:
      console.log(`${event.payload.playerID} buzzed in.`);
      return {...storeData, playerAnswering: event.payload.playerID};
    case EventTypes.PLAYER_ANSWERED:
      // TODO
      break;
    default:
      console.log(`Ignoring event with unknown type: ${event.eventType} (${JSON.stringify(event)})`);
      return storeData || newStoreData();
  }
}

export function GameReducer(storeData, action) {
  switch (action.type) {
    case ActionTypes.FETCH_GAME:
      const newGame = action.payload;
      const newBoard = newGame.rounds[newGame.currentRound];
      const players = {};
      newGame.players.forEach(player => players[player.playerID] = player);
      return {...storeData, game: newGame, board: newBoard, players: players, activeClue: null, playerAnswering: null, playerInControl: null};
    case ActionTypes.DISMISS_CLUE:
      return {...storeData, activeClue: null, playerAnswering: null};
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
