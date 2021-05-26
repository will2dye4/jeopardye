export const DEFAULT_PLAYER_ID = '2ea15eb6-aa1e-4616-a836-cbf39f92f0bb';

export const JSERVICE_API_BASE = 'http://jservice.io/api';

export const CATEGORIES_PER_ROUND = 6;
export const CLUES_PER_CATEGORY = 5;
export const ROUNDS_PER_GAME = 2;

export const SINGLE_ROUND_VALUE_INCREMENT = 200;
export const DOUBLE_ROUND_VALUE_INCREMENT = 2 * SINGLE_ROUND_VALUE_INCREMENT;

export const MIN_PLAYER_NAME_LENGTH = 1;
export const MAX_PLAYER_NAME_LENGTH = 10;

export const MIN_CLUE_READING_DELAY_SECONDS = 5;
export const MAX_CLUE_READING_DELAY_SECONDS = 15;

export const READING_SPEED_WORDS_PER_MINUTE = 130;
export const READING_SPEED_SECONDS_PER_WORD = 60 / READING_SPEED_WORDS_PER_MINUTE;

export const DEFAULT_COUNTDOWN_SECONDS = 10;
export const DAILY_DOUBLE_COUNTDOWN_SECONDS = 25;
export const WAGER_COUNTDOWN_SECONDS = 15;

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
  SUBMIT_WAGER: 'submit_wager',
  PLAYER_WAGERED: 'player_wagered',
  /* server timing events */
  BUZZING_PERIOD_ENDED: 'buzzing_period_ended',
  RESPONSE_PERIOD_ENDED: 'response_period_ended',
  WAITING_PERIOD_ENDED: 'waiting_period_ended',
}

export const DAILY_DOUBLE_MINIMUM_WAGER = 5;
export const DAILY_DOUBLE_DEFAULT_MAXIMUM_WAGERS = {
  [Rounds.SINGLE]: SINGLE_ROUND_VALUE_INCREMENT * CLUES_PER_CATEGORY,
  [Rounds.DOUBLE]: DOUBLE_ROUND_VALUE_INCREMENT * CLUES_PER_CATEGORY,
};

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
