import uuid from 'uuid';
import { DEFAULT_FONT_STYLE, MAX_PLAYER_NAME_LENGTH, MIN_PLAYER_NAME_LENGTH } from '../constants.mjs';

export function validatePlayerName(name) {
  return (!!name && name?.length >= MIN_PLAYER_NAME_LENGTH && name?.length <= MAX_PLAYER_NAME_LENGTH);
}

export class Player {
  constructor(name, preferredFontStyle) {
    this.playerID = uuid.v4();
    this.name = name;
    this.preferredFontStyle = preferredFontStyle || DEFAULT_FONT_STYLE;
    this.overallScore = 0;
    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.highestGameScore = 0;
    this.createdTime = new Date();
    this.active = true;
  }
}

export class GamePlayer {
  constructor(playerID, name, preferredFontStyle, score, spectating) {
    this.playerID = playerID;
    this.name = name;
    this.preferredFontStyle = preferredFontStyle || DEFAULT_FONT_STYLE;
    this.score = score || 0;
    this.spectating = spectating || false;
    this.active = true;
  }
}
