import { randomChoice } from '@dyesoft/alea-core';

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

const TIME_ELAPSED_RESPONSES = {
  CURRENT_PLAYER: [
    `Sorry, you didn't answer in time.`,
    `Time's up, ${PLAYER_PLACEHOLDER}.`,
  ],
  OTHER_PLAYER: [
    `${PLAYER_PLACEHOLDER} ran out of time.`
  ],
};

export function getStartOfRoundMessage(game, isNewRound, playerHasControl, playerInControlReassigned, playerName) {
  let response;
  if (isNewRound) {
    if (game.currentRound === Object.keys(game.rounds)[0]) {
      response = `Game started. ${playerName} will be the first to select a clue.`;
    } else {
      response = `Let's play the ${game.currentRound} Jeopardye round! ${playerName} will choose first.`;
    }
  } else if (playerInControlReassigned) {
    if (playerHasControl) {
      response = `It's now your turn, ${playerName}!`;
    } else {
      response = `It's now ${playerName}'s turn.`;
    }
  } else {
    response = `Joined existing game in the ${game.currentRound} Jeopardye round.`;
    if (playerHasControl) {
      response += ` It's your turn!`;
    } else {
      response += ` It's ${playerName}'s turn.`;
    }
  }
  return response;
}

export function getBuzzInMessage(categoryName) {
  const punctuation = (categoryName.endsWith('!') ? '' : '!');
  return `Buzz in if you know the answer in ${categoryName}${punctuation}`;
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

export function getTimeElapsedMessage(isCurrentPlayer, playerName, amount) {
  const responses = (isCurrentPlayer ? TIME_ELAPSED_RESPONSES.CURRENT_PLAYER : TIME_ELAPSED_RESPONSES.OTHER_PLAYER);
  let response = randomChoice(responses).replaceAll(PLAYER_PLACEHOLDER, playerName);
  if (amount) {
    response = `${response.substring(0, response.length - 1)} (-$${amount.toLocaleString()})`;
  }
  return response;
}

export function addPrevAnswerStatus(message, isCurrentPlayer, prevAnswerCorrect) {
  if (isCurrentPlayer) {
    if (prevAnswerCorrect) {
      message = `Correct! ${message}`;
    } else {
      message = `Sorry, no. ${message}`;
    }
  }
  return message;
}

export function getLastClueMessage(isCurrentPlayer, prevAnswerCorrect) {
  return addPrevAnswerStatus('And now the last clue ...', isCurrentPlayer, prevAnswerCorrect);
}

export function getEndOfRoundMessage(isCurrentPlayer, prevAnswerCorrect, round, gameOver) {
  const roundName = (gameOver ? 'game' : `${round} Jeopardye round`);
  return addPrevAnswerStatus(`That's the end of the ${roundName}.`, isCurrentPlayer, prevAnswerCorrect);
}
