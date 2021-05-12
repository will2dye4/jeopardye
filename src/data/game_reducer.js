import { ActionTypes } from './action_creators';
import { EventTypes } from '../constants.mjs';

function newStoreData() {
  return {
    connected: false,
    board: null,
    game: null,
    players: {},
  };
}

function handleWebsocketAction(storeData, event) {
  if (event.hasOwnProperty('message')) {
    event = JSON.parse(event.message);
  }
  switch (event.eventType) {
    case EventTypes.JOIN_FAILED:
      console.log(`Failed to join game: ${event.payload.error} (${event.payload.status})`);
      return {...storeData, connected: false};
    case EventTypes.PLAYER_JOINED:
      const player = event.payload.player;
      console.log(`${player.name} has joined the game.`);
      let newPlayers = {...storeData.players, [player.playerID]: player};
      return {...storeData, players: newPlayers};
    default:
      console.log(`Unknown event type: ${event.eventType} (${JSON.stringify(event)})`);
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
      return {...storeData, game: newGame, board: newBoard, players: players};
    case ActionTypes.REDUX_WEBSOCKET_OPEN:
      return {...storeData, connected: true};
    case ActionTypes.REDUX_WEBSOCKET_CLOSED:
      return {...storeData, connected: false};
    case ActionTypes.REDUX_WEBSOCKET_MESSAGE:
      return handleWebsocketAction(storeData, action.payload);
    default:
      return storeData || newStoreData();
  }
}
