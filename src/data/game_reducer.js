import { ActionTypes } from './action_creators';

export function GameReducer(storeData, action) {
  switch (action.type) {
    case ActionTypes.FETCH_GAME:
      const newGame = action.payload;
      const newBoard = newGame.rounds[newGame.currentRound];
      return {...storeData, game: newGame, board: newBoard};
    default:
      return storeData || {};
  }
}
