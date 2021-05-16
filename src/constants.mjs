export const DEFAULT_PLAYER_ID = 'William';

export const CATEGORIES_PER_ROUND = 6;
export const CLUES_PER_CATEGORY = 5;
export const ROUNDS_PER_GAME = 2;

export const SINGLE_ROUND_VALUE_INCREMENT = 200;
export const DOUBLE_ROUND_VALUE_INCREMENT = 2 * SINGLE_ROUND_VALUE_INCREMENT;

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

export const PLAYER_PLACEHOLDER = '{{PLAYER}}';

export const CORRECT_RESPONSES_TAKE_CONTROL = [
  `That is correct, ${PLAYER_PLACEHOLDER}. You are now in control of the board.`,
  `Right! You select the next clue.`,
  `Well done, ${PLAYER_PLACEHOLDER}! You've taken control.`,
];

export const CORRECT_RESPONSES_KEEP_CONTROL = [
  `That's right, ${PLAYER_PLACEHOLDER}. You're still in control.`,
  `Exactly. Select again, ${PLAYER_PLACEHOLDER}.`,
  `Correct! Please pick again.`,
];

export const INCORRECT_RESPONSES = [
  `Sorry, no.`,
  `No, ${PLAYER_PLACEHOLDER}, that's not it.`,
  `I'm afraid we can't accept that.`,
  `That's incorrect, ${PLAYER_PLACEHOLDER}.`,
  `That is not what we were looking for.`,
];
