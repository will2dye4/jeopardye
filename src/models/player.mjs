export class Player {
  constructor(playerID, name, score) {
    this.playerID = playerID;
    this.name = name;
    this.score = score || 0;
  }
}
