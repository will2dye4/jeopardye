import config from './config.json' assert { type: 'json' };

export const ADMIN_PLAYER_IDS = new Set(config.admin.playerIDs);

const SERVER_HOST = config.server.host;
const SERVER_PORT = config.server.port;
export const APP_BASE = config.webapp.url;
export const API_BASE = `${config.server.protocol}://${SERVER_HOST}:${SERVER_PORT}/api`;
export const WS_BASE = `${config.server.websocketProtocol}://${SERVER_HOST}:${SERVER_PORT}/api/ws`;

export const JSERVICE_API_BASE = 'http://jservice.io/api';

export const CATEGORIES_PER_ROUND = 6;
export const CLUES_PER_CATEGORY = 5;

export const DAILY_DOUBLE_MINIMUM_WAGER = 5;
export const FINAL_ROUND_MINIMUM_WAGER = 0;

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

export const MAX_INVALID_COUNT = 5;

export const MIN_CATEGORY_SEARCH_TERM_LENGTH = 3;

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

export  const PLACEHOLDER_PLAYER_EMAIL = 'alex@jeopardye.com';

export const GAME_HISTORY_SCROLL_KEY = 'gameHistoryScroll';
export const GAME_HISTORY_SIDE_KEY = 'gameHistorySide';
export const GAME_HISTORY_SIZE_KEY = 'gameHistorySize';
export const PLAYER_ID_KEY = 'playerID';
export const SOUND_EFFECTS_ENABLED_KEY = 'soundEffectsEnabled';
export const SPEAK_CLUES_ENABLED_KEY = 'speakCluesEnabled';
export const SPEAK_ANSWERS_ENABLED_KEY = 'speakAnswersEnabled';

export const GameSettingModes = {
  BY_DATE: 'date',
  CATEGORY: 'category',
  RANDOM: 'random',
};

export const DEFAULT_GAME_SETTINGS_MODE = GameSettingModes.BY_DATE;

export const GameDateSelectionModes = {
  DATE_RANGE: 'date',
  SEASON: 'season',
};

export const PlayerEditorModes = {
  CREATE: 'create',
  EDIT: 'edit',
};

export const LeaderboardKeys = {
  OVERALL_SCORE: 'overallScore',
  HIGHEST_GAME_SCORE: 'highestGameScore',
  AVERAGE_SCORE: 'averageScore',
  CORRECT_PERCENTAGE: 'correctPercentage',
  DAILY_DOUBLE_PERCENTAGE: 'dailyDoublePercentage',
  FINAL_ROUND_PERCENTAGE: 'finalRoundPercentage',
  WINNING_PERCENTAGE: 'winningPercentage',
};

export const DailyDoubleSettings = {
  NONE: 'None',
  NORMAL: 'Normal',
  DOUBLE: 'Double',
  QUADRUPLE: 'Quadruple',
  FROM_EPISODE: 'From Episode',
}
export const DEFAULT_DAILY_DOUBLE_SETTING = 'NORMAL';

export const DAILY_DOUBLE_MULTIPLIERS = {
  [DailyDoubleSettings.NONE]: 0,
  [DailyDoubleSettings.NORMAL]: 1,
  [DailyDoubleSettings.DOUBLE]: 2,
  [DailyDoubleSettings.QUADRUPLE]: 4,
};

export const DEFAULT_FINAL_JEOPARDYE = true;

export const DEFAULT_ALLOW_UNREVEALED_CLUES = true;

export const MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH = 3;

export const MIN_PLAYER_NAME_LENGTH = 1;
export const MAX_PLAYER_NAME_LENGTH = 10;

export const MAX_EMAIL_LENGTH = 128;
export const MAX_ROOM_REQUEST_NAME_LENGTH = 64;

export const MIN_CLUE_READING_DELAY_SECONDS = 5;
export const MAX_CLUE_READING_DELAY_SECONDS = 15;

export const READING_SPEED_WORDS_PER_MINUTE = 130;
export const READING_SPEED_SECONDS_PER_WORD = 60 / READING_SPEED_WORDS_PER_MINUTE;

export const DEFAULT_COUNTDOWN_SECONDS = 10;
export const DAILY_DOUBLE_COUNTDOWN_SECONDS = 25;
export const WAGER_COUNTDOWN_SECONDS = 15;

export const FINAL_ROUND_COUNTDOWN_SECONDS = 30;

export const MAX_PASSWORD_LENGTH = 128;
export const PASSWORD_SALT_ROUNDS = 10;

export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTVWXYZ';

export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30;

export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;
export const SECONDS_PER_WEEK = SECONDS_PER_DAY * DAYS_PER_WEEK;
export const SECONDS_PER_MONTH = SECONDS_PER_DAY * DAYS_PER_MONTH;

export const MILLISECONDS_PER_SECOND = 1000;
export const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
export const MILLISECONDS_PER_HOUR = MINUTES_PER_HOUR * MILLISECONDS_PER_MINUTE;
export const MILLISECONDS_PER_DAY = HOURS_PER_DAY * MILLISECONDS_PER_HOUR;

export const MAX_KICK_DURATION_SECONDS = SECONDS_PER_MONTH;

export const MAX_GAME_HISTORY_LENGTH = 100;

export const EARLIEST_EPISODE_DATE = new Date(1984, 8, 10);  // September 10, 1984

export const DEFAULT_HIGHEST_SEASON_NUMBER = 39;

export const DAY_OF_WEEK_SATURDAY = 6;
export const DAY_OF_WEEK_SUNDAY = 0;

// Custom SVG icons.
const ICON_SIZE = 512;
const RETRO_TV_SVG_PATH_DATA = 'M322.031 96L377.063 40.969C386.438 31.594 386.438 16.406 377.063 7.031S352.5 -2.344 343.125 7.031L256.094 94.062L169.062 7.031C159.687 -2.344 144.5 -2.344 135.125 7.031S125.75 31.594 135.125 40.969L190.156 96H64C28.654 96 0 124.654 0 160V448C0 483.346 28.654 512 64 512H448C483.346 512 512 483.346 512 448V160C512 124.654 483.346 96 448 96H322.031ZM448.094 208C461.348 208 472.094 218.742 472.094 232C472.094 245.254 461.348 256 448.094 256S424.094 245.254 424.094 232C424.094 218.742 434.84 208 448.094 208ZM384.094 384C384.094 419.346 355.439 448 320.094 448H128.094C92.748 448 64.094 419.346 64.094 384V224C64.094 188.652 92.748 160 128.094 160H320.094C355.439 160 384.094 188.652 384.094 224V384ZM424.094 312C424.094 298.742 434.84 288 448.094 288S472.094 298.742 472.094 312C472.094 325.254 461.348 336 448.094 336S424.094 325.254 424.094 312Z';
export const RETRO_TV_ICON = {
  prefix: 'fas',
  iconName: 'tv-retro',
  icon: [
    ICON_SIZE,
    ICON_SIZE,
    [],  // aliases
    '',  // unicode
    RETRO_TV_SVG_PATH_DATA,
  ],
};

export const SELECTED_TAB_STYLES = {
  borderBottom: 'none',
  borderLeftColor: 'jeopardyeBlue.500',
  borderRightColor: 'jeopardyeBlue.500',
  borderTopColor: 'jeopardyeBlue.500',
};

export const EventTypes = {
  ERROR: 'error',
  /* game events */
  GAME_CREATION_FAILED: 'game_creation_failed',
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
  PLAYER_CHANGED_NAME_AND_EMAIL: 'player_changed_name_and_email',
  JOIN_ROOM: 'join_room',
  JOIN_ROOM_WITH_CODE: 'join_room_with_code',
  PLAYER_JOINED_ROOM: 'player_joined_room',
  LEAVE_ROOM: 'leave_room',
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
  PLAYER_IN_CONTROL_REASSIGNED: 'player_in_control_reassigned',
  FINAL_ROUND_ANSWER_REVEALED: 'final_round_answer_revealed',
  /* host-only gameplay events */
  ABANDON_GAME: 'abandon_game',
  HOST_ABANDONED_GAME: 'host_abandoned_game',
  KICK_PLAYER: 'kick_player',
  HOST_KICKED_PLAYER: 'host_kicked_player',
  OVERRIDE_SERVER_DECISION: 'override_server_decision',
  HOST_OVERRODE_SERVER_DECISION: 'host_overrode_server_decision',
  ADVANCE_TO_NEXT_ROUND: 'advance_to_next_round',
  HOST_FINALIZING_SCORES: 'host_finalizing_scores',
  FINALIZE_SCORES: 'finalize_scores',
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
  EventTypes.PLAYER_CHANGED_NAME_AND_EMAIL,
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
  LOCKED: '\uD83D\uDD12',
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
  'locked': Emoji.LOCKED,
  'microphone': Emoji.MICROPHONE,
  'money_with_wings': Emoji.MONEY_WITH_WINGS,
  'name_badge': Emoji.NAME_BADGE,
  'play_button': Emoji.PLAY_BUTTON,
  'question': Emoji.QUESTION_MARK,
  'skip_forward': Emoji.SKIP_FORWARD,
  'timer_clock': Emoji.TIMER_CLOCK,
  'wink': Emoji.WINK,
};

export const SORT_ARROW_ASCENDING = '\u25B4';
export const SORT_ARROW_DESCENDING = '\u25BE';

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
  SERVICE_UNAVAILABLE: 503,
};
