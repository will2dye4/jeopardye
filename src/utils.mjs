export class WebsocketEvent {
  constructor(eventType, payload) {
    this.eventType = eventType;
    this.payload = payload;
  }
}

export function titleizeCategoryName(categoryName) {
  return categoryName.toTitleCase();
}

export function sanitizeQuestionText(text) {
  /* remove backslashes and HTML style tags (<b>, </b>, <i>, </i>, <u>, </u>) */
  return text.replaceAll(/\\|<\/?[biu]>/g, '');
}

/* Normalization process:
 * 1. Split the string into words.
 * 2. Join the words with spaces.
 * 3. Remove quotes.
 * 4. Replace accented characters with their unaccented versions.
 *
 * Reference for accented characters: https://emw3.com/unicode-accents.html
 */
function normalizeAnswerText(text) {
  text = text.toLowerCase();
  const words = text.match(/\b([\w']+)\b/g);
  if (!words) {
    return text;
  }
  return (
    words.join(' ')
    .replaceAll(/['"]/g, '')
    .replaceAll(/[\u00e0\u00e1\u00e2\u00e3\u00e4]|&[aA](acute|circ|grave|tilde|uml);/g, 'a')
    .replaceAll(/[\u00e8\u00e9\u00ea\u00eb]|&[eE](acute|circ|grave|uml);/g, 'e')
    .replaceAll(/[\u00ec\u00ed\u00ee\u00ef]|&[iI](acute|circ|grave|uml);/g, 'i')
    .replaceAll(/[\u00f2\u00f3\u00f4\u00f5\u00f6]|&[oO](acute|circ|grave|tilde|uml);/g, 'o')
    .replaceAll(/[\u00f9\u00fa\u00fb\u00fc]|&[uU](acute|circ|grave|uml);/g, 'u')
    .replaceAll(/\u00fd|&[yY]acute;/g, 'y')
    .replaceAll(/\u00e7|&[cC]cedil;/g, 'c')
    .replaceAll(/\u00f1|&[nN]tilde;/g, 'n')
  );
}

export function checkSubmittedAnswer(correctAnswer, submittedAnswer) {
  const normalizedCorrectAnswer = normalizeAnswerText(correctAnswer);
  const normalizedSubmittedAnswer = normalizeAnswerText(submittedAnswer);
  /* Happy path: exact match */
  if (normalizedCorrectAnswer === normalizedSubmittedAnswer) {
    return true;
  }
  /* Try removing parenthesized information, e.g., '(william) shakespeare' --> 'shakespeare' */
  if (correctAnswer.indexOf('(') !== -1) {
    const simplifiedCorrectAnswer = normalizeAnswerText(correctAnswer.replaceAll(/\(.+?\)/g, ''));
    if (simplifiedCorrectAnswer === normalizedSubmittedAnswer) {
      return true;
    }
  }
  /* Try replacing '&' with 'and', for both answers */
  if (correctAnswer.indexOf('&') !== -1) {
    const simplifiedCorrectAnswer = normalizeAnswerText(correctAnswer.replaceAll('&', 'and'));
    if (simplifiedCorrectAnswer === normalizedSubmittedAnswer) {
      return true;
    }
  } else if (submittedAnswer.indexOf('&') !== -1) {
    const simplifiedSubmittedAnswer = normalizeAnswerText(submittedAnswer.replaceAll('&', 'and'));
    if (normalizedCorrectAnswer === simplifiedSubmittedAnswer) {
      return true;
    }
  }
  /* Try removing initial article, e.g., 'a house' --> 'house' */
  if (normalizedCorrectAnswer.startsWith('a') || normalizedCorrectAnswer.startsWith('the')) {
    const simplifiedCorrectAnswer = normalizedCorrectAnswer.replace(/^(an?|the)\s+/, '');
    if (simplifiedCorrectAnswer === normalizedSubmittedAnswer) {
      return true;
    }
  }
  /* Try removing ending 's' from both answers, e.g., 'presidents' --> 'president' */
  if (normalizedCorrectAnswer.endsWith('s')) {
    const simplifiedCorrectAnswer = normalizedCorrectAnswer.substring(0, normalizedCorrectAnswer.length - 1);
    if (simplifiedCorrectAnswer === normalizedSubmittedAnswer) {
      return true;
    }
  } else if (normalizedSubmittedAnswer.endsWith('s')) {
    const simplifiedSubmittedAnswer = normalizedSubmittedAnswer.substring(0, normalizedSubmittedAnswer.length - 1);
    if (normalizedCorrectAnswer === simplifiedSubmittedAnswer) {
      return true;
    }
  }
  return false;
}
