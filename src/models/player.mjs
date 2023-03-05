import uuid from 'uuid';
import { DEFAULT_FONT_STYLE, MAX_PLAYER_NAME_LENGTH, MIN_PLAYER_NAME_LENGTH } from '../constants.mjs';

export const CLUES_ANSWERED_STAT = 'cluesAnswered';
export const CLUES_ANSWERED_CORRECTLY_STAT = 'cluesAnsweredCorrectly';
export const DAILY_DOUBLES_ANSWERED_STAT = 'dailyDoublesAnswered';
export const DAILY_DOUBLES_ANSWERED_CORRECTLY_STAT = 'dailyDoublesAnsweredCorrectly';

export const FINAL_CLUES_ANSWERED_STAT = 'finalCluesAnswered';

export const FINAL_CLUES_ANSWERED_CORRECTLY_STAT = 'finalCluesAnsweredCorrectly';

export const GAMES_PLAYED_STAT = 'gamesPlayed';
export const GAMES_WON_STAT = 'gamesWon';
export const OVERALL_SCORE_STAT = 'overallScore';

export function validatePlayerName(name) {
  return (!!name && name?.length >= MIN_PLAYER_NAME_LENGTH && name?.length <= MAX_PLAYER_NAME_LENGTH);
}

export class PlayerStatistics {
  constructor() {
    this.overallScore = 0;
    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.highestGameScore = 0;
    this.cluesAnswered = 0;
    this.cluesAnsweredCorrectly = 0;
    this.dailyDoublesAnswered = 0;
    this.dailyDoublesAnsweredCorrectly = 0;
    this.finalCluesAnswered = 0;
    this.finalCluesAnsweredCorrectly = 0;
  }
}

export class Player {
  constructor(name, preferredFontStyle, email, spectating) {
    this.playerID = uuid.v4();
    this.currentRoomID = null;
    this.name = name;
    this.preferredFontStyle = preferredFontStyle || DEFAULT_FONT_STYLE;
    this.email = email || null;
    this.spectating = spectating ?? false;
    this.active = true;
    this.createdTime = new Date();
    this.lastConnectionTime = new Date();
    this.stats = new PlayerStatistics();
  }
}
