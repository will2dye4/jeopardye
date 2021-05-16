import langEn from '@nlpjs/lang-en';
import similarity from '@nlpjs/similarity';

const { StemmerEn, StopwordsEn } = langEn;
const { leven } = similarity;

const MIN_ANSWER_SIMILARITY_RATIO = 0.8;

const stemmer = new StemmerEn();
stemmer.stopwords = new StopwordsEn();

export class WebsocketEvent {
  constructor(eventType, payload) {
    this.eventType = eventType;
    this.payload = payload;
  }
}

export function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

export function titleizeCategoryName(categoryName) {
  return categoryName.toTitleCase();
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
  return false;
}
