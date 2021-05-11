export const DataTypes = {
  GAME: 'game',
};

export const ActionTypes = {
  FETCH_GAME: 'fetch_game',
};

const API_BASE = 'http://localhost:3333/api';
const CREATE_GAME_URL = `${API_BASE}/game`;

export function fetchBoard() {
  return {
    type: ActionTypes.FETCH_GAME,
    payload: fetch(CREATE_GAME_URL, {method: 'POST'}).then(response => response.json()),
  };
}
