import { ACTION_TYPES } from './action_creators';

export function GameReducer(storeData, action) {
  switch (action.type) {
    case ACTION_TYPES.FETCH_BOARD:
      return {...storeData, board: action.payload};
    default:
      return storeData || {};
  }
}
