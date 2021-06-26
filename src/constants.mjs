export const DEFAULT_PLAYER_ID = 'd38064a4-7c20-4fb6-b076-76eada41d385';

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

export const MAX_PLAYERS_PER_GAME = 6;

export const DEFAULT_FONT_STYLE = 'Dancing Script';
export const ALL_FONT_STYLES = [
  DEFAULT_FONT_STYLE,
  'Shadows Into Light',
  'Caveat Brush',
  'Beth Ellen',
  'Homemade Apple',
  'Gloria Hallelujah',
  'Rock Salt',
  'Satisfy',
  'Sacramento',
  'Rancho',
  'Kaushan Script',
  'Rouge Script',
];

export const PLACEHOLDER_PLAYER_NAME = 'Alex';

export const GAME_HISTORY_SCROLL_KEY = 'gameHistoryScroll';
export const GAME_HISTORY_SIDE_KEY = 'gameHistorySide';
export const GAME_HISTORY_SIZE_KEY = 'gameHistorySize';
export const PLAYER_ID_KEY = 'playerID';
export const SOUND_EFFECTS_ENABLED_KEY = 'soundEffectsEnabled';
export const SPEAK_CLUES_ENABLED_KEY = 'speakCluesEnabled';
export const SPEAK_ANSWERS_ENABLED_KEY = 'speakAnswersEnabled';

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

export const MAX_PASSWORD_LENGTH = 128;
export const PASSWORD_SALT_ROUNDS = 10;

export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTVWXYZ';

export const EventTypes = {
  ERROR: 'error',
  /* game events */
  GAME_STARTING: 'game_starting',
  GAME_STARTED: 'game_started',
  GAME_SETTINGS_CHANGED: 'game_settings_changed',
  GAME_ENDED: 'game_ended',
  ROUND_STARTED: 'round_started',
  ROUND_ENDED: 'round_ended',
  /* room events */
  REASSIGN_ROOM_HOST: 'reassign_room_host',
  ROOM_HOST_REASSIGNED: 'room_host_reassigned',
  /* player events */
  PLAYER_CHANGED_NAME: 'player_changed_name',
  JOIN_ROOM: 'join_room',
  JOIN_ROOM_WITH_CODE: 'join_room_with_code',
  PLAYER_JOINED_ROOM: 'player_joined_room',
  PLAYER_LEFT_ROOM: 'player_left_room',
  JOIN_GAME: 'join_game',
  PLAYER_JOINED: 'player_joined',
  PLAYER_WENT_ACTIVE: 'player_went_active',
  PLAYER_WENT_INACTIVE: 'player_went_inactive',
  START_SPECTATING: 'start_spectating',
  PLAYER_STARTED_SPECTATING: 'player_started_spectating',
  STOP_SPECTATING: 'stop_spectating',
  PLAYER_STOPPED_SPECTATING: 'player_stopped_spectating',
  MARK_READY_FOR_NEXT_ROUND: 'mark_ready_for_next_round',
  PLAYER_MARKED_READY_FOR_NEXT_ROUND: 'player_marked_ready_for_next_round',
  /* gameplay events */
  SELECT_CLUE: 'select_clue',
  PLAYER_SELECTED_CLUE: 'player_selected_clue',
  BUZZ_IN: 'buzz_in',
  PLAYER_BUZZED: 'player_buzzed',
  SUBMIT_ANSWER: 'submit_answer',
  PLAYER_ANSWERED: 'player_answered',
  SUBMIT_WAGER: 'submit_wager',
  PLAYER_WAGERED: 'player_wagered',
  MARK_CLUE_AS_INVALID: 'mark_clue_as_invalid',
  PLAYER_MARKED_CLUE_AS_INVALID: 'player_marked_clue_as_invalid',
  VOTE_TO_SKIP_CLUE: 'vote_to_skip_clue',
  PLAYER_VOTED_TO_SKIP_CLUE: 'player_voted_to_skip_clue',
  OVERRIDE_SERVER_DECISION: 'override_server_decision',
  HOST_OVERRODE_SERVER_DECISION: 'host_overrode_server_decision',
  /* server timing events */
  BUZZING_PERIOD_ENDED: 'buzzing_period_ended',
  RESPONSE_PERIOD_ENDED: 'response_period_ended',
  WAITING_PERIOD_ENDED: 'waiting_period_ended',
  /* connection events */
  CLIENT_CONNECT: 'client_connect',
};

export const GAME_HISTORY_EVENT_TYPES = new Set([
  /* game events */
  EventTypes.GAME_STARTED,
  EventTypes.GAME_ENDED,
  EventTypes.ROUND_STARTED,
  EventTypes.ROUND_ENDED,
  /* room events */
  EventTypes.ROOM_HOST_REASSIGNED,
  /* player events */
  EventTypes.PLAYER_CHANGED_NAME,
  EventTypes.PLAYER_LEFT_ROOM,
  EventTypes.PLAYER_JOINED,
  EventTypes.PLAYER_STARTED_SPECTATING,
  EventTypes.PLAYER_STOPPED_SPECTATING,
  /* gameplay events */
  EventTypes.PLAYER_SELECTED_CLUE,
  EventTypes.PLAYER_BUZZED,
  EventTypes.PLAYER_ANSWERED,
  EventTypes.PLAYER_WAGERED,
  EventTypes.PLAYER_MARKED_CLUE_AS_INVALID,
  EventTypes.PLAYER_VOTED_TO_SKIP_CLUE,
  EventTypes.HOST_OVERRODE_SERVER_DECISION,
  /* server timing events */
  EventTypes.BUZZING_PERIOD_ENDED,
  EventTypes.RESPONSE_PERIOD_ENDED,
]);

export const Emoji = {
  BELL: '\uD83D\uDD14',
  BUST_IN_SILHOUETTE: '\uD83D\uDC64',
  CHECK_MARK: '\u2705',
  CHECKERED_FLAG: '\uD83C\uDFC1',
  CROSS_MARK: '\u274C',
  END_ARROW: '\uD83D\uDD1A',
  EXCLAMATION_MARK: '\u2757',
  EYE: '\uD83D\uDC41\uFE0F',
  HOURGLASS: '\u23F3',
  INTERROBANG: '\u2049\uFE0F',
  JUDGE: '\uD83E\uDDD1\u200D\u2696\uFE0F',
  MICROPHONE: '\uD83C\uDFA4',
  MONEY_WITH_WINGS: '\uD83D\uDCB8',
  NAME_BADGE: '\uD83D\uDCDB',
  PLAY_BUTTON: '\u25B6\uFE0F',
  QUESTION_MARK: '\u2753',
  SKIP_FORWARD: '\u23ED',
  TIMER_CLOCK: '\u23F2',
  WINK: '\uD83D\uDE09',
};

export const EMOJI_NAME_TO_EMOJI = {
  'bell': Emoji.BELL,
  'bust': Emoji.BUST_IN_SILHOUETTE,
  'check_mark': Emoji.CHECK_MARK,
  'checkered_flag': Emoji.CHECKERED_FLAG,
  'cross_mark': Emoji.CROSS_MARK,
  'end': Emoji.END_ARROW,
  'exclamation': Emoji.EXCLAMATION_MARK,
  'eye': Emoji.EYE,
  'hourglass': Emoji.HOURGLASS,
  'interrobang': Emoji.INTERROBANG,
  'judge': Emoji.JUDGE,
  'microphone': Emoji.MICROPHONE,
  'money_with_wings': Emoji.MONEY_WITH_WINGS,
  'name_badge': Emoji.NAME_BADGE,
  'play_button': Emoji.PLAY_BUTTON,
  'question': Emoji.QUESTION_MARK,
  'skip_forward': Emoji.SKIP_FORWARD,
  'timer_clock': Emoji.TIMER_CLOCK,
  'wink': Emoji.WINK,
};

export const StatusCodes = {
  /* success codes */
  NO_CONTENT: 204,
  /* client error codes */
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  /* server error codes */
  INTERNAL_SERVER_ERROR: 500,
};
