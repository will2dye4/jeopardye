export class Player {
  constructor(playerID, name) {
    this.playerID = playerID;
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
