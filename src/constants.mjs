export const DEFAULT_PLAYER_ID = 'William';

export const CATEGORIES_PER_ROUND = 6;
export const CLUES_PER_CATEGORY = 5;
export const ROUNDS_PER_GAME = 2;

export const SINGLE_ROUND_VALUE_INCREMENT = 200;
export const DOUBLE_ROUND_VALUE_INCREMENT = 2 * SINGLE_ROUND_VALUE_INCREMENT;

export const ENTER_KEY_CODE = 13;

export const Rounds = {
  SINGLE: 'single',
  DOUBLE: 'double',
  FINAL: 'final',
};

export const EventTypes = {
  ERROR: 'error',
  JOIN_GAME: 'join_game',
  PLAYER_JOINED: 'player_joined',
  SELECT_CLUE: 'select_clue',
  PLAYER_SELECTED_CLUE: 'player_selected_clue',
  BUZZ_IN: 'buzz_in',
  PLAYER_BUZZED: 'player_buzzed',
  SUBMIT_ANSWER: 'submit_answer',
  PLAYER_ANSWERED: 'player_answered',
}
