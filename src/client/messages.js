import { randomChoice } from '../utils.mjs';

const PLAYER_PLACEHOLDER = '{{PLAYER}}';

const SELECT_CLUE_RESPONSES = [
  `Choose another clue.`,
  `Select again, ${PLAYER_PLACEHOLDER}.`,
  `${PLAYER_PLACEHOLDER}, pick the next clue.`,
];

const CORRECT_RESPONSES = {
  CURRENT_PLAYER: {
    TAKE_CONTROL: [
      `That is correct, ${PLAYER_PLACEHOLDER}. You are now in control of the board.`,
      `Right! You select the next clue.`,
      `Well done, ${PLAYER_PLACEHOLDER}! You've taken control.`,
    ],
    KEEP_CONTROL: [
      `That's right, ${PLAYER_PLACEHOLDER}. You're still in control.`,
      `Exactly. Select again, ${PLAYER_PLACEHOLDER}.`,
      `Correct! Please pick again.`,
    ],
  },
  OTHER_PLAYER: {
    TAKE_CONTROL: [
      `${PLAYER_PLACEHOLDER} takes it and has control of the board.`,
      `${PLAYER_PLACEHOLDER} is correct.`,
      `${PLAYER_PLACEHOLDER} got the right answer.`,
    ],
    KEEP_CONTROL: [
      `${PLAYER_PLACEHOLDER} gets it and maintains control of the board.`,
      `${PLAYER_PLACEHOLDER} is right again.`,
      `${PLAYER_PLACEHOLDER} really knows some stuff!`,
    ],
  },
}

const INCORRECT_RESPONSES = {
  CURRENT_PLAYER: [
    `Sorry, no.`,
    `No, ${PLAYER_PLACEHOLDER}, that's not it.`,
    `I'm afraid we can't accept that.`,
    `That's incorrect, ${PLAYER_PLACEHOLDER}.`,
    `That is not what we were looking for.`,
  ],
  OTHER_PLAYER: [
    `${PLAYER_PLACEHOLDER} answered incorrectly.`,
    `${PLAYER_PLACEHOLDER} did not get the right answer.`,
  ],
};

const TIME_ELAPSED_RESPONSES = [
  `Sorry, you didn't answer in time.`,
  `Time's up, ${PLAYER_PLACEHOLDER}.`,
];

export function getBuzzInMessage(categoryName) {
  return `Buzz in if you know the answer in ${categoryName}!`;
}

export function getWaitingForBuzzMessage(isSpectating = false) {
  return `Waiting for ${isSpectating ? '' : 'other '}players to buzz in.`;
}

export function getSelectClueMessage(playerName) {
  return randomChoice(SELECT_CLUE_RESPONSES).replaceAll(PLAYER_PLACEHOLDER, playerName);
}

export function getCorrectAnswerMessage(isCurrentPlayer, tookControl, playerName) {
  let responses = (isCurrentPlayer ? CORRECT_RESPONSES.CURRENT_PLAYER : CORRECT_RESPONSES.OTHER_PLAYER);
  responses = (tookControl ? responses.TAKE_CONTROL : responses.KEEP_CONTROL);
  return randomChoice(responses).replaceAll(PLAYER_PLACEHOLDER, playerName);
}

export function getIncorrectAnswerMessage(isCurrentPlayer, playerName) {
  const responses = (isCurrentPlayer ? INCORRECT_RESPONSES.CURRENT_PLAYER : INCORRECT_RESPONSES.OTHER_PLAYER);
  return randomChoice(responses).replaceAll(PLAYER_PLACEHOLDER, playerName);
}

export function getTimeElapsedMessage(playerName) {
  return randomChoice(TIME_ELAPSED_RESPONSES).replaceAll(PLAYER_PLACEHOLDER, playerName);
}
