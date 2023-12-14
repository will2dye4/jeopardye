export class StandupTriviaClue {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
    }
}

export class StandupTriviaCategory {
    constructor(name, clues, airDate) {
        this.name = name;
        this.clues = clues;
        this.airDate = airDate;
    }
}

export class StandupTriviaGame {
    constructor(categories) {
        this.categories = categories;
    }
}
