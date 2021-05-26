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

const stemmer = new StemmerEn();
stemmer.stopwords = new StopwordsEn();

export class WebsocketEvent {
  constructor(eventType, payload) {
    this.eventType = eventType;
    this.payload = payload;
  }
}

export function range(n) {
  return [...Array(n).keys()];
}

export function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
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

export function isDailyDouble(round, clueID) {
  return (round.dailyDoubles.indexOf(clueID) !== -1);
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
  if (correctAnswer.indexOf('(') !== -1) {
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
  if (correctAnswer.indexOf('/') !== -1) {
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
  return (removeWhitespace(normalizedSubmittedAnswer).indexOf(removeWhitespace(normalizedCorrectAnswer)) !== -1);
}
