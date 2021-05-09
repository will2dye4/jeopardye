import { TEST_BOARD } from './test_board';

export const DATA_TYPES = {
  BOARD: 'board',
}

export const ACTION_TYPES = {
  FETCH_BOARD: 'fetch_board',
}

export function fetchBoard() {
  return {
    type: ACTION_TYPES.FETCH_BOARD,
    payload: TEST_BOARD,
  };
}
