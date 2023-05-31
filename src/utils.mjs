import { EventContext as AleaEventContext } from '@dyesoft/alea-core';
import langEn from '@nlpjs/lang-en';
import similarity from '@nlpjs/similarity';
import '@gouch/to-title-case';
import moment from 'moment';
import numberConverter from 'number-to-words';
import {
  DAILY_DOUBLE_COUNTDOWN_SECONDS,
  DAILY_DOUBLE_DEFAULT_MAXIMUM_WAGERS,
  DAILY_DOUBLE_MINIMUM_WAGER,
  DAY_OF_WEEK_SATURDAY,
  DAY_OF_WEEK_SUNDAY,
  DEFAULT_COUNTDOWN_SECONDS,
  EARLIEST_EPISODE_DATE,
  FINAL_ROUND_MINIMUM_WAGER,
  MAX_CLUE_READING_DELAY_SECONDS,
  MIN_CLUE_READING_DELAY_SECONDS,
  READING_SPEED_SECONDS_PER_WORD,
  Rounds,
} from './constants.mjs';
import { FIRST_NAMES } from './config/names.mjs';
import missingEpisodeDates from './config/missingEpisodeDates.json' assert { type: 'json' };
import yearSeasonDates from './config/yearSeasonDates.json' assert { type: 'json' };

const { StemmerEn, StopwordsEn } = langEn;
const { leven } = similarity;

const AND_REGEX = /\s+and|&\s+/;
const OR_REGEX = /\s+or\s+/;

const MIN_ANSWER_SIMILARITY_RATIO = 0.8;

const INTERCHANGEABLE_TERMS = [
  new Set(['america', 'united states', 'united states of america', 'us', 'usa']),
  new Set(['ben franklin', 'benjamin franklin']),
  new Set(['brother love', 'diddy', 'p diddy', 'puff daddy', 'puffy', 'sean combs', 'sean john combs', 'sean love combs']),
  new Set(['chairman mao', 'chairman mao zedong', 'chairman mao tse-tung', 'mao zedong', 'mao tse-tung', 'mao']),
  new Set(['cs lewis', 'c s lewis', 'lewis']),
  new Set(['ellen', 'ellen degeneres']),
  new Set(['eminem', 'marshall mathers', 'slim shady']),
  new Set(['eu', 'european union']),
  new Set(['fdr', 'franklin d roosevelt', 'franklin delano roosevelt', 'franklin roosevelt']),
  new Set(['gabriel iglesias', 'fluffy']),
  new Set(['george bush', 'george h w bush', 'george herbert walker bush', 'george hw bush', 'george bush sr']),
  new Set(['george w bush', 'george walker bush', 'george bush jr']),
  new Set(['god', 'lord', 'yahweh', 'yhwh']),
  new Set(['jennifer lopez', 'jennifer lynn lopez', 'jennifer affleck', 'jennifer lynn affleck', 'jlo', 'j lo']),
  new Set(['jesus', 'jesus christ', 'jesus h christ', 'christ']),
  new Set(['jfk', 'john f kennedy', 'john fitzgerald kennedy', 'john kennedy']),
  new Set(['kanye', 'kanye omari west', 'kanye west', 'ye', 'yeezus', 'yeezy']),
  new Set(['lbj', 'lyndon b johnson', 'lyndon baines johnson', 'lyndon johnson']),
  new Set(['lord voldemort', 'voldemort', 'tom riddle', 'tom marvolo riddle', 'riddle']),
  new Set(['martin luther king', 'martin luther king jr', 'mlk', 'mlk jr']),
  new Set(['martin luther king day', 'martin luther king jr day', 'mlk day']),
  new Set(['napoleon', 'napoleon bonaparte']),
  new Set(['oprah', 'oprah winfrey', 'winfrey']),
  new Set(['pi', '3.14', '3.14159', 'π']),
  new Set(['rfk', 'robert f kennedy', 'robert francis kennedy', 'robert kennedy', 'bobby kennedy']),
  new Set(['rms', 'richard m stallman', 'richard matthew stallman', 'richard stallman']),
  new Set(['t rex', 'tyrannosaurus rex']),
  new Set(['teddy roosevelt', 'theodore roosevelt']),
  new Set(['television', 'tv']),
  new Set(['theodore roosevelt', 'teddy roosevelt']),
  new Set(['uk', 'united kingdom']),
  new Set(['un', 'united nations']),
  new Set(['wwi', 'ww1', 'world war i', 'world war 1']),
  new Set(['wwii', 'ww2', 'world war ii', 'world war 2']),
];

const AMBIGUOUS_LAST_NAMES = new Set(['bronte', 'kennedy', 'roosevelt']);

const stemmer = new StemmerEn();
stemmer.stopwords = new StopwordsEn();

export class EventContext extends AleaEventContext {
  static fromGameAndClue(game, clue, playerID = null) {
    return new EventContext(game.roomID, game.gameID, playerID, clue.categoryID, clue.clueID);
  }

  static fromProps(props) {
    let context = super.fromProps(props);
    if (props.activeClue) {
      context.categoryID = props.activeClue.categoryID;
      context.clueID = props.activeClue.clueID;
    }
    return context;
  }

  constructor(roomID, gameID, playerID, categoryID, clueID) {
    super(roomID, gameID, playerID);
    if (categoryID) {
      this.categoryID = categoryID;
    }
    if (clueID) {
      this.clueID = clueID;
    }
  }
}

export function getURLForContestant(contestantID) {
  return `https://j-archive.com/showplayer.php?player_id=${contestantID}`;
}

export function isValidEpisodeDate(date, latestEpisodeDate) {
  date = moment.utc(date);
  if (!date) {
    return false;
  }

  if (date.isBefore(moment.utc(EARLIEST_EPISODE_DATE), 'day') || date.isAfter(moment.utc(latestEpisodeDate), 'day')) {
    return false;
  }

  const year = date.year().toString();
  const yearSeasonInfo = yearSeasonDates[year];
  if (yearSeasonInfo && yearSeasonInfo.hasOwnProperty('seasonEnd') && yearSeasonInfo.hasOwnProperty('seasonStart')) {
    const lastSeasonEnd = yearSeasonInfo.seasonEnd;
    const nextSeasonStart = yearSeasonInfo.seasonStart;
    if (date.isAfter(moment.utc(lastSeasonEnd), 'day') && date.isBefore(moment.utc(nextSeasonStart), 'day')) {
      return false;
    }
  }

  const dayOfWeek = date.day();
  if (dayOfWeek === DAY_OF_WEEK_SATURDAY || dayOfWeek === DAY_OF_WEEK_SUNDAY) {
    return false;
  }
  const month = (date.month() + 1).toString();
  if (missingEpisodeDates.hasOwnProperty(year) && missingEpisodeDates[year].hasOwnProperty(month) &&
    missingEpisodeDates[year][month].includes(date.date())) {
    return false;
  }
  return true;
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
  const overallScore = playerStats.overallScore || 0;
  const highestGameScore = playerStats.highestGameScore || 0;
  const gamesPlayed = playerStats.gamesPlayed || 0;
  const gamesWon = playerStats.gamesWon || 0;
  const cluesAnswered = playerStats.cluesAnswered || 0;
  const cluesAnsweredCorrectly = playerStats.cluesAnsweredCorrectly || 0;
  const dailyDoublesAnswered = playerStats.dailyDoublesAnswered || 0;
  const dailyDoublesAnsweredCorrectly = playerStats.dailyDoublesAnsweredCorrectly || 0;
  const finalCluesAnswered = playerStats.finalCluesAnswered || 0;
  const finalCluesAnsweredCorrectly = playerStats.finalCluesAnsweredCorrectly || 0;
  return {
    overallScore: overallScore,
    highestGameScore: highestGameScore,
    gamesPlayed: gamesPlayed,
    gamesWon: gamesWon,
    cluesAnswered: cluesAnswered,
    cluesAnsweredCorrectly: cluesAnsweredCorrectly,
    dailyDoublesAnswered: dailyDoublesAnswered,
    dailyDoublesAnsweredCorrectly: dailyDoublesAnsweredCorrectly,
    finalCluesAnswered: finalCluesAnswered,
    finalCluesAnsweredCorrectly: finalCluesAnsweredCorrectly,
    averageScore: Math.round(gamesPlayed === 0 ? 0 : (overallScore / gamesPlayed)),
    correctPercentage: Math.round((cluesAnswered === 0 ? 0 : (cluesAnsweredCorrectly / cluesAnswered)) * 100),
    dailyDoublePercentage: Math.round((dailyDoublesAnswered === 0 ? 0 : (dailyDoublesAnsweredCorrectly / dailyDoublesAnswered)) * 100),
    finalRoundPercentage: Math.round((finalCluesAnswered === 0 ? 0 : (finalCluesAnsweredCorrectly / finalCluesAnswered)) * 100),
    winningPercentage: Math.round((gamesPlayed === 0 ? 0 : (gamesWon / gamesPlayed)) * 100),
  };
}

export function getWagerRange(currentRound, playerScore) {
  if (currentRound === Rounds.FINAL) {
    return [FINAL_ROUND_MINIMUM_WAGER, playerScore];
  }
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

export function compareRounds(round1, round2) {
  const orderedRounds = Object.values(Rounds);
  return orderedRounds.indexOf(round1) - orderedRounds.indexOf(round2);
}

export function sortedRounds(game) {
  return Object.keys(game.rounds).sort(compareRounds);
}

export function getNextRound(game) {
  if (!hasMoreRounds(game)) {
    return null;
  }
  const roundNames = sortedRounds(game);
  return roundNames[roundNames.indexOf(game.currentRound) + 1];
}

export function hasMoreRounds(game) {
  const roundNames = sortedRounds(game);
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

export function numeralsToWords(text) {
  try {
    return numberConverter.toWords(text.replaceAll(',', '').replaceAll('$', ''));
  } catch (e) {
    return text;
  }
}

function isNumericMatch(correctAnswer, submittedAnswer) {
  const correctAnswerWords = removeWhitespace(numeralsToWords(correctAnswer).replaceAll(',', '').replaceAll('-', ''));
  if (correctAnswerWords === removeWhitespace(submittedAnswer.replaceAll(',', '').replaceAll('-', ''))) {
    return true;
  }
  const submittedAnswerWords = removeWhitespace(numeralsToWords(submittedAnswer).replaceAll(',', '').replaceAll('-', ''));
  return (submittedAnswerWords === removeWhitespace(correctAnswer.replaceAll(',', '').replaceAll('-', '')));
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

function isInterchangeable(correctAnswer, submittedAnswer) {
  correctAnswer = correctAnswer.toLowerCase().replaceAll(/(the|,|\.)/g, '').replaceAll(/\s+/g, ' ').trim();
  submittedAnswer = submittedAnswer.toLowerCase().replaceAll(/(the|,|\.)/g, '').replaceAll(/\s+/g, ' ').trim();
  for (const terms of INTERCHANGEABLE_TERMS) {
    if (terms.has(correctAnswer) && terms.has(submittedAnswer)) {
      return true;
    }
  }
  return false;
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
  for (const conjunction of [AND_REGEX, OR_REGEX]) {
    if (correctAnswer.search(conjunction) !== -1 && submittedAnswer.search(conjunction) !== -1) {
      const splitCorrectAnswer = correctAnswer.split(conjunction).map(normalizeAnswerText).sort();
      const splitSubmittedAnswer = submittedAnswer.split(conjunction).map(normalizeAnswerText).sort();
      if (splitCorrectAnswer.every((value, i) => isCloseEnough(value, splitSubmittedAnswer[i]))) {
        return true;
      }
    }
  }
  /* Accept '<x>' or '<y>' if the correct answer is '<x> or <y>' */
  if (correctAnswer.search(OR_REGEX) !== -1) {
    const splitCorrectAnswer = correctAnswer.split(OR_REGEX).map(normalizeAnswerText).sort();
    if (splitCorrectAnswer.find(value => isCloseEnough(value, submittedAnswer))) {
      return true;
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
  if (isNumericMatch(correctAnswer, submittedAnswer)) {
    return true;
  }
  /* Try checking if the correct answer is a substring of the submitted answer, e.g., 'benedict' vs. 'pope benedict' */
  if (removeWhitespace(normalizedSubmittedAnswer).includes(removeWhitespace(normalizedCorrectAnswer))) {
    return true;
  }
  /* Try checking if the correct answer is a person's name and the submitted answer is the last name only.
   * For example, 'Ronald Reagan' vs. 'Reagan', or 'John F. Kennedy' vs. 'Kennedy'.
   * Note that this check operates on the non-normalized answers, since the stemmer can modify names in weird ways.
   */
  const correctAnswerWords = correctAnswer.normalize('NFD').split(/\s+/).filter(word => word.length > 0).map(word => word.toLowerCase());
  if (!submittedAnswer.trim().includes(' ') && correctAnswerWords.length > 1) {
    const lastName = correctAnswerWords[correctAnswerWords.length - 1];
    if (!(correctAnswerWords.length > 2 && correctAnswerWords[0] === 'george' && lastName === 'bush') && !AMBIGUOUS_LAST_NAMES.has(lastName)) {
      const allInitialWordsAreNames = correctAnswerWords.slice(0, correctAnswerWords.length - 1).every(word => FIRST_NAMES.has(word) || word.match(/^[a-z]\.$/));
      if (allInitialWordsAreNames && isCloseEnough(lastName, submittedAnswer.normalize('NFD').toLowerCase())) {
        return true;
      }
    }
  }
  /* Last resort: Try edge cases where multiple answers are interchangeable (e.g., 'John F. Kennedy' vs. 'JFK').
   * Note that this check operates on the non-normalized answers, since the stemmer can modify names in weird ways.
   */
  return isInterchangeable(correctAnswer, submittedAnswer);
}
