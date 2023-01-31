import langEn from '@nlpjs/lang-en';
import similarity from '@nlpjs/similarity';
import '@gouch/to-title-case';
import {
  DAILY_DOUBLE_COUNTDOWN_SECONDS,
  DAILY_DOUBLE_DEFAULT_MAXIMUM_WAGERS,
  DAILY_DOUBLE_MINIMUM_WAGER,
  DEFAULT_COUNTDOWN_SECONDS,
  MAX_CLUE_READING_DELAY_SECONDS,
  MIN_CLUE_READING_DELAY_SECONDS,
  READING_SPEED_SECONDS_PER_WORD,
} from './constants.mjs';

const { StemmerEn, StopwordsEn } = langEn;
const { leven } = similarity;

const DEFAULT_LOCALE = 'en';

/* anything@anything.anything */
const EMAIL_REGEX = /\S+@\S+\.\S+/;

const MIN_ANSWER_SIMILARITY_RATIO = 0.8;

const NUMERALS_TO_WORDS = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
};

const PLACE_NAMES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', 'Honorable Mention'];
const MAX_PLACE_INDEX = PLACE_NAMES.length - 1;

const stemmer = new StemmerEn();
stemmer.stopwords = new StopwordsEn();

export class WebsocketEvent {
  constructor(eventType, payload) {
    this.eventType = eventType;
    this.payload = payload;
  }
}

export class EventContext {
  static fromGameAndClue(game, clue, playerID = null) {
    return new EventContext(game.roomID, game.gameID, playerID, clue.categoryID, clue.clueID);
  }

  static fromProps(props) {
    const roomID = props.gameState?.roomID || props.roomID;
    const gameID = props.gameState?.gameID || props.game?.gameID || props.gameID;
    const playerID = props.gameState?.playerID || props.player?.playerID || props.playerID;
    return new EventContext(roomID, gameID, playerID, props.activeClue?.categoryID, props.activeClue?.clueID);
  }

  constructor(roomID, gameID, playerID, categoryID, clueID) {
    this.roomID = roomID;
    this.gameID = gameID;
    if (playerID) {
      this.playerID = playerID;
    }
    if (categoryID) {
      this.categoryID = categoryID;
    }
    if (clueID) {
      this.clueID = clueID;
    }
  }
}

export function range(n) {
  return [...Array(n).keys()];
}

export function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

export function isSuperset(set, subset) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false;
    }
  }
  return true;
}

export function comparePlayerNames(player1, player2) {
  return player1.name.toLowerCase().localeCompare(player2.name.toLowerCase());
}

export function comparePlayerEntries([id1, player1], [id2, player2]) {
  return comparePlayerNames(player1, player2);
}

export function formatDate(date, fullMonthName = false) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const monthOption = (fullMonthName ? 'long' : 'short');
  const month = new Intl.DateTimeFormat(DEFAULT_LOCALE, {month: monthOption, timeZone: 'GMT'}).format(date);
  const day = new Intl.DateTimeFormat(DEFAULT_LOCALE, {day: 'numeric', timeZone: 'GMT'}).format(date);
  const year = new Intl.DateTimeFormat(DEFAULT_LOCALE, {year: 'numeric', timeZone: 'GMT'}).format(date);
  return `${month} ${day}, ${year}`;
}

export function formatWeekday(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {weekday: 'long', timeZone: 'GMT'}).format(date);
}

export function formatScore(score) {
  score = score || 0;
  const scoreString = score.toLocaleString();
  if (score < 0) {
    return '-$' + scoreString.substring(1);
  }
  return '$' + scoreString;
}

export function formatList(items) {
  let result = '';
  items.forEach((item, i) => {
    result += item;
    if (i < items.length - 2) {
      result += ', ';
    } else if (i === items.length - 2) {
      result += ' and ';
    }
  });
  return result;
}

export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function getUnplayedClues(board, limit = -1) {
  let unplayedClues = [];
loop:
  for (const category of Object.values(board.categories)) {
    for (const clue of category.clues) {
      if (!clue.played) {
        unplayedClues.push(clue);
        if (limit !== -1 && unplayedClues.length >= limit) {
          break loop;
        }
      }
    }
  }
  return unplayedClues;
}

export function getUnrevealedClues(board) {
  let unrevealedClues = [];
  for (const category of Object.values(board.categories)) {
    for (const clue of category.clues) {
      if (clue.unrevealed) {
        unrevealedClues.push(clue);
      }
    }
  }
  return unrevealedClues;
}

export function getAugmentedPlayerStats(playerStats) {
  const {
    gamesPlayed,
    gamesWon,
    cluesAnswered,
    cluesAnsweredCorrectly,
    dailyDoublesAnswered,
    dailyDoublesAnsweredCorrectly,
  } = playerStats;
  return {
    ...playerStats,
    correctPercentage: Math.round((cluesAnswered === 0 ? 0 : (cluesAnsweredCorrectly / cluesAnswered)) * 100),
    dailyDoublePercentage: Math.round((dailyDoublesAnswered === 0 ? 0 : (dailyDoublesAnsweredCorrectly / dailyDoublesAnswered)) * 100),
    winningPercentage: Math.round((gamesPlayed === 0 ? 0 : (gamesWon / gamesPlayed)) * 100),
  };
}

export function getPlaces(scores) {
  let places = {};
  let i = 0;
  let prevScore = null;
  let players = [];
  scores.sort((player1, player2) => player2.score - player1.score).forEach(player => {
    const playerScore = {playerID: player.playerID, name: player.name, score: player.score};
    if (prevScore === null || player.score === prevScore || i === MAX_PLACE_INDEX) {
      players.push(playerScore);
    } else {
      places[PLACE_NAMES[i]] = players;
      i = Math.min(i + players.length, MAX_PLACE_INDEX);
      players = [playerScore];
    }
    prevScore = player.score;
  });
  if (players.length) {
    places[PLACE_NAMES[i]] = players;
  }
  return places;
}

export function getCurrentChampion(places) {
  const winners = places[Object.keys(places)[0]];
  return (winners.length === 1 ? winners[0].playerID : null);
}

export function getWagerRange(currentRound, playerScore) {
  const defaultMax = DAILY_DOUBLE_DEFAULT_MAXIMUM_WAGERS[currentRound];
  const maxWager = Math.max(playerScore, defaultMax);
  return [DAILY_DOUBLE_MINIMUM_WAGER, maxWager];
}

export function getClueReadingDelayInMillis(clue) {
  const question = clue?.question || '';
  const words = question.split(/[-\s]/);
  const readingSpeed = words.length * READING_SPEED_SECONDS_PER_WORD;
  const seconds = Math.ceil(Math.min(Math.max(readingSpeed, MIN_CLUE_READING_DELAY_SECONDS), MAX_CLUE_READING_DELAY_SECONDS));
  return (seconds + Math.random()) * 1000;
}

export function getCountdownTimeInMillis(dailyDouble = false) {
  return (dailyDouble ? DAILY_DOUBLE_COUNTDOWN_SECONDS : DEFAULT_COUNTDOWN_SECONDS) * 1000;
}

export function getNextRound(game) {
  if (!hasMoreRounds(game)) {
    return null;
  }
  const roundNames = Object.keys(game.rounds);
  return roundNames[roundNames.indexOf(game.currentRound) + 1];
}

export function hasMoreRounds(game) {
  const roundNames = Object.keys(game.rounds);
  return (game.currentRound !== roundNames[roundNames.length - 1]);
}

export function isDailyDouble(round, clueID) {
  return round.dailyDoubles.includes(clueID);
}

export function titleizeCategoryName(categoryName) {
  return (
    categoryName.toTitleCase()
    .replaceAll('u.s.a.', 'U.S.A.')
    .replaceAll('u.s.', 'U.S.')
    .replaceAll('Tv', 'TV')
  );
}

export function sanitizeQuestionText(text) {
  /* remove backslashes and HTML style tags (<b>, </b>, <i>, </i>, <u>, </u>) */
  return text.replaceAll(/\\|<\/?[biu]>/g, '');
}

function normalizeAnswerText(text) {
  text = (
    text.replaceAll('.', '')
    .replaceAll('-', ' ')
    .replaceAll(/\s&\s/g, ' and ')
  );
  let words = stemmer.tokenizeAndStem(text, false);
  if (!words.length) {
    words = stemmer.tokenizeAndStem(text, true);
    if (!words.length) {
      return text;
    }
  }
  return words.join(' ');
}

function removeWhitespace(text) {
  return text.replaceAll(/\s+/g, '');
}

function isCloseEnough(correctAnswer, submittedAnswer) {
  correctAnswer = removeWhitespace(correctAnswer);
  submittedAnswer = removeWhitespace(submittedAnswer);
  if (correctAnswer === submittedAnswer) {
    return true;
  }
  const distance = leven(correctAnswer, submittedAnswer);
  const ratio = (correctAnswer.length - distance) / correctAnswer.length;
  return (ratio >= MIN_ANSWER_SIMILARITY_RATIO);
}

export function checkSubmittedAnswer(correctAnswer, submittedAnswer) {
  const normalizedCorrectAnswer = normalizeAnswerText(correctAnswer);
  const normalizedSubmittedAnswer = normalizeAnswerText(submittedAnswer);
  /* Happy path: exact match (or close enough) */
  if (isCloseEnough(normalizedCorrectAnswer, normalizedSubmittedAnswer)) {
    return true;
  }
  /* Try removing parenthesized information, e.g., '(william) shakespeare' --> 'shakespeare' */
  if (correctAnswer.includes('(')) {
    const simplifiedCorrectAnswer = normalizeAnswerText(correctAnswer.replaceAll(/\(.+?\)/g, ''));
    if (isCloseEnough(simplifiedCorrectAnswer, normalizedSubmittedAnswer)) {
      return true;
    }
  }
  /* Try more general parenthesized answer at the end, e.g., 'volkswagen beetle (car)' --> 'car' */
  if (correctAnswer.endsWith(')')) {
    const matches = correctAnswer.match(/\(.+?\)/g);
    if (matches) {
      const simplifiedCorrectAnswer = normalizeAnswerText(matches[matches.length - 1]);
      if (isCloseEnough(simplifiedCorrectAnswer, normalizedSubmittedAnswer)) {
        return true;
      }
    }
  }
  /* Try comparing items without considering order, e.g., '<x> and <y>' or '<x> or <y>' --> {'<x>', '<y>'} */
  for (const conjunction of [/and|&/, 'or']) {
    if (correctAnswer.search(conjunction) !== -1 && submittedAnswer.search(conjunction) !== -1) {
      const splitCorrectAnswer = correctAnswer.split(conjunction).map(normalizeAnswerText).sort();
      const splitSubmittedAnswer = submittedAnswer.split(conjunction).map(normalizeAnswerText).sort();
      if (splitCorrectAnswer.every((value, i) => isCloseEnough(value, splitSubmittedAnswer[i]))) {
        return true;
      }
    }
  }
  /* Try checking either answer if there's a slash, e.g., 'snake/serpent' --> 'snake' or 'serpent' */
  if (correctAnswer.includes('/')) {
    const possibleCorrectAnswers = correctAnswer.split('/').map(normalizeAnswerText);
    for (const answer of possibleCorrectAnswers) {
      if (isCloseEnough(answer, normalizedSubmittedAnswer)) {
        return true;
      }
    }
  }
  /* Try replacing a numeral with the corresponding word or vice versa, e.g., '6' vs. 'six' */
  if (NUMERALS_TO_WORDS[normalizedCorrectAnswer] === normalizedSubmittedAnswer ||
      NUMERALS_TO_WORDS[normalizedSubmittedAnswer] === normalizedCorrectAnswer) {
    return true;
  }
  /* Try checking if the correct answer is a substring of the submitted answer, e.g., 'salinger' vs. 'j.d. salinger' */
  return removeWhitespace(normalizedSubmittedAnswer).includes(removeWhitespace(normalizedCorrectAnswer));
}
