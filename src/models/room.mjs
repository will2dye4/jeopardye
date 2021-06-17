import bcrypt from 'bcrypt';
import uuid from 'uuid';
import { PASSWORD_SALT_ROUNDS } from '../constants.mjs';

export class Room {
  constructor(roomCode, ownerPlayerID, password) {
    this.roomID = uuid.v4();
    this.roomCode = roomCode;
    this.passwordHash = (!!password ? bcrypt.hashSync(password, PASSWORD_SALT_ROUNDS) : null);
    this.ownerPlayerID = ownerPlayerID;
    this.hostPlayerID = ownerPlayerID;
    this.playerIDs = [ownerPlayerID];
    this.kickedPlayerIDs = [];
    this.currentGameID = null;
    this.currentChampion = null;
    this.currentWinningStreak = 0;
    this.previousGameIDs = [];
    this.createdTime = new Date();
  }
}
