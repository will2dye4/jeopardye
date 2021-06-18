import bcrypt from 'bcrypt';
import uuid from 'uuid';
import { ROOM_CODE_LENGTH, PASSWORD_SALT_ROUNDS, ROOM_CODE_CHARACTERS } from '../constants.mjs';
import { isSuperset } from '../utils.mjs';

export function validateRoomCode(roomCode) {
  return (!!roomCode && roomCode?.length === ROOM_CODE_LENGTH && isSuperset(new Set(ROOM_CODE_CHARACTERS), new Set(roomCode)));
}

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
