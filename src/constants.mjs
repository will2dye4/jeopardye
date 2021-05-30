export const DEFAULT_PLAYER_ID = '2ea15eb6-aa1e-4616-a836-cbf39f92f0bb';

export const JSERVICE_API_BASE = 'http://jservice.io/api';

export const CATEGORIES_PER_ROUND = 6;
export const CLUES_PER_CATEGORY = 5;

export const DAILY_DOUBLE_MINIMUM_WAGER = 5;

export const SINGLE_ROUND_NUM_DAILY_DOUBLES = 1;
export const SINGLE_ROUND_VALUE_INCREMENT = 200;

export const Rounds = {
  SINGLE: 'single',
  DOUBLE: 'double',
  QUADRUPLE: 'quadruple',
  FINAL: 'final',
};

export const ROUND_MULTIPLIERS = {
  [Rounds.SINGLE]: 1,
  [Rounds.DOUBLE]: 2,
  [Rounds.QUADRUPLE]: 4,
  [Rounds.FINAL]: 0,
};

export const VALUE_INCREMENTS = {
  [Rounds.SINGLE]: ROUND_MULTIPLIERS[Rounds.SINGLE] * SINGLE_ROUND_VALUE_INCREMENT,
  [Rounds.DOUBLE]: ROUND_MULTIPLIERS[Rounds.DOUBLE] * SINGLE_ROUND_VALUE_INCREMENT,
  [Rounds.QUADRUPLE]: ROUND_MULTIPLIERS[Rounds.QUADRUPLE] * SINGLE_ROUND_VALUE_INCREMENT,
  [Rounds.FINAL]: ROUND_MULTIPLIERS[Rounds.FINAL] * SINGLE_ROUND_VALUE_INCREMENT,
}

export const NUM_DAILY_DOUBLES = {
  [Rounds.SINGLE]: ROUND_MULTIPLIERS[Rounds.SINGLE] * SINGLE_ROUND_NUM_DAILY_DOUBLES,
  [Rounds.DOUBLE]: ROUND_MULTIPLIERS[Rounds.DOUBLE] * SINGLE_ROUND_NUM_DAILY_DOUBLES,
  [Rounds.QUADRUPLE]: ROUND_MULTIPLIERS[Rounds.QUADRUPLE] * SINGLE_ROUND_NUM_DAILY_DOUBLES,
  [Rounds.FINAL]: ROUND_MULTIPLIERS[Rounds.FINAL] * SINGLE_ROUND_NUM_DAILY_DOUBLES,
};

export const DAILY_DOUBLE_DEFAULT_MAXIMUM_WAGERS = {
  [Rounds.SINGLE]: VALUE_INCREMENTS[Rounds.SINGLE] * CLUES_PER_CATEGORY,
  [Rounds.DOUBLE]: VALUE_INCREMENTS[Rounds.DOUBLE] * CLUES_PER_CATEGORY,
  [Rounds.QUADRUPLE]: VALUE_INCREMENTS[Rounds.QUADRUPLE] * CLUES_PER_CATEGORY,
  [Rounds.FINAL]: VALUE_INCREMENTS[Rounds.FINAL] * CLUES_PER_CATEGORY,
};

export const DEFAULT_NUM_ROUNDS = 2;
export const MIN_NUM_ROUNDS = 1;
export const MAX_NUM_ROUNDS = Object.keys(Rounds).length - 1;

export const DEFAULT_FONT_STYLE = 'Dancing Script';

export const PLACEHOLDER_PLAYER_NAME = 'Alex';

export const GAME_ID_KEY = 'gameID';
export const PLAYER_ID_KEY = 'playerID';
export const PREFERRED_FONT_STYLE_KEY = 'preferredFontStyle';

export const PlayerEditorModes = {
  CREATE: 'create',
  EDIT: 'edit',
}

export const DailyDoubleSettings = {
  NONE: 'None',
  NORMAL: 'Normal',
  DOUBLE: 'Double',
  QUADRUPLE: 'Quadruple',
}
export const DEFAULT_DAILY_DOUBLE_SETTING = 'NORMAL';

export const DAILY_DOUBLE_MULTIPLIERS = {
  [DailyDoubleSettings.NONE]: 0,
  [DailyDoubleSettings.NORMAL]: 1,
  [DailyDoubleSettings.DOUBLE]: 2,
  [DailyDoubleSettings.QUADRUPLE]: 4,
};

export const DEFAULT_FINAL_JEOPARDYE = true;

export const MIN_PLAYER_NAME_LENGTH = 1;
export const MAX_PLAYER_NAME_LENGTH = 10;

export const MIN_CLUE_READING_DELAY_SECONDS = 5;
export const MAX_CLUE_READING_DELAY_SECONDS = 15;

export const READING_SPEED_WORDS_PER_MINUTE = 130;
export const READING_SPEED_SECONDS_PER_WORD = 60 / READING_SPEED_WORDS_PER_MINUTE;

export const DEFAULT_COUNTDOWN_SECONDS = 10;
export const DAILY_DOUBLE_COUNTDOWN_SECONDS = 25;
export const WAGER_COUNTDOWN_SECONDS = 15;

export const EventTypes = {
  ERROR: 'error',
  JOIN_GAME: 'join_game',
  PLAYER_CHANGED_NAME: 'player_changed_name',
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
  /* connection events */
  CLIENT_CONNECT: 'client_connect',
}
