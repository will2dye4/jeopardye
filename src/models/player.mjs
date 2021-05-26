import uuid from 'uuid';
import { MAX_PLAYER_NAME_LENGTH, MIN_PLAYER_NAME_LENGTH } from '../constants.mjs';

export function validatePlayerName(name) {
  return (!!name && name?.length >= MIN_PLAYER_NAME_LENGTH && name?.length <= MAX_PLAYER_NAME_LENGTH);
}

export class Player {
  constructor(name) {
    this.playerID = uuid.v4();
    this.name = name;
    this.overallScore = 0;
    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.highestGameScore = 0;
    this.createdTime = new Date();
  }
}

export class GamePlayer {
  constructor(playerID, name, score, spectating) {
    this.playerID = playerID;
    this.name = name;
    this.score = score || 0;
    this.spectating = spectating || false;
    this.active = true;
  }
}
