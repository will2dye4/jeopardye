export class Contestant {
  constructor(contestantID, name, description) {
    this.contestantID = contestantID;
    if (description) {
      this.name = name;
      this.description = description;
    } else {
      this.rawText = name;
    }
  }
}

export class EpisodeMetadata {
  static fromEpisode(episode) {
    const metadata = episode.metadata || {};
    let contestants = [];
    if (metadata.hasOwnProperty('contestants')) {
      contestants = metadata.contestants.map(contestant => new Contestant(contestant.contestantID, contestant.name || contestant.rawText, contestant.description));
    }
    return new EpisodeMetadata(metadata.title, contestants, metadata.scores, metadata.comments);
  }

  constructor(title, contestants, scores, comments) {
    if (title) {
      this.title = title;
    }
    if (contestants) {
      this.contestants = contestants;
    }
    if (scores) {
      this.scores = scores;
    }
    if (comments) {
      this.comments = comments;
    }
  }
}

export class Episode {
  constructor(episodeID, episodeNumber, seasonNumber, airDate, metadata, rounds, hasUnrevealedClues, hasInvalidRounds) {
    this.episodeID = episodeID;
    this.episodeNumber = episodeNumber;
    this.seasonNumber = seasonNumber;
    this.airDate = airDate;
    this.metadata = metadata || new EpisodeMetadata();

    if (hasUnrevealedClues) {
      this.hasUnrevealedClues = true;
    }

    if (hasInvalidRounds) {
      this.hasInvalidRounds = true;
      Object.entries(rounds).forEach(([roundName, round]) => {
        if (!round || !round.categories || !Object.keys(round.categories).length) {
          delete rounds[roundName];
        }
      })
    }

    this.rounds = rounds;
  }
}
