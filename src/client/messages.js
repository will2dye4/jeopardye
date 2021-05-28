import { randomChoice } from '../utils.mjs';

const PLAYER_PLACEHOLDER = '{{PLAYER}}';

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

const INCORRECT_RESPONSES = [
  `Sorry, no.`,
  `No, ${PLAYER_PLACEHOLDER}, that's not it.`,
  `I'm afraid we can't accept that.`,
  `That's incorrect, ${PLAYER_PLACEHOLDER}.`,
  `That is not what we were looking for.`,
];

const TIME_ELAPSED_RESPONSES = [
  `Sorry, you didn't answer in time.`,
  `Time's up, ${PLAYER_PLACEHOLDER}.`,
];

export function getCorrectAnswerMessage(isCurrentPlayer, tookControl, playerName) {
  let responses = (isCurrentPlayer ? CORRECT_RESPONSES.CURRENT_PLAYER : CORRECT_RESPONSES.OTHER_PLAYER);
  responses = (tookControl ? responses.TAKE_CONTROL : responses.KEEP_CONTROL);
  return randomChoice(responses).replaceAll(PLAYER_PLACEHOLDER, playerName);
}

export function getIncorrectAnswerMessage(playerName) {
  return randomChoice(INCORRECT_RESPONSES).replaceAll(PLAYER_PLACEHOLDER, playerName);
}

export function getTimeElapsedMessage(playerName) {
  return randomChoice(TIME_ELAPSED_RESPONSES).replaceAll(PLAYER_PLACEHOLDER, playerName);
}
