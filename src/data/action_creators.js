export const DATA_TYPES = {
  BOARD: 'board',
};

export const ACTION_TYPES = {
  FETCH_BOARD: 'fetch_board',
};

const API_BASE = 'http://localhost:3333/api';
const CREATE_GAME_URL = `${API_BASE}/game`;

export function fetchBoard() {
  return {
    type: ACTION_TYPES.FETCH_BOARD,
    payload: fetch(CREATE_GAME_URL, {method: 'POST'}).then(response => response.json()),
  };
}
