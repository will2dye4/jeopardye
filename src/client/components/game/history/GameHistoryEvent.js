import React from 'react';
import moment from 'moment';
import { ListItem, Text } from '@chakra-ui/react';
import { EventTypes } from '../../../../constants.mjs';
import { getPlayerName } from '../../../reducers/game_reducer';
import Bold from '../../common/Bold';

const RECENT_EVENT_THRESHOLD_MILLIS = 2000;

function getRelativeEventTime(timestamp) {
  if (Date.now() - timestamp < RECENT_EVENT_THRESHOLD_MILLIS) {
    return 'just now';
  }
  return moment(timestamp).fromNow();
}

function getEventDescription(props) {
  const event = props.event;
  const timestamp = getRelativeEventTime(event.timestamp);
  const playerID = event.payload.playerID;
  const playerName = (playerID === props.gameState.playerID ? 'You' : getPlayerName(playerID));
  const categoryID = event.payload.categoryID;
  const clueID = event.payload.clueID;
  let clue;
  if (categoryID && clueID) {
    clue = props.board.categories[categoryID].clues.find(clue => clue.clueID === clueID);
  }
  let description;
  switch (event.eventType) {
    case EventTypes.GAME_STARTED:
      description = 'A new game has started.';
      break;
    case EventTypes.GAME_ENDED:
      description = 'The game has ended.';
      break;
    case EventTypes.ROUND_STARTED:
      description = `The ${event.payload.round} Jeopardye round has started. ${getPlayerName(event.payload.playerInControl)} is in control.`;
      break;
    case EventTypes.ROUND_ENDED:
      if (event.payload.gameOver) {
        description = 'The game has ended.';
      } else {
        description = `The ${event.payload.round} Jeopardye round has ended.`;
      }
      break;
    case EventTypes.PLAYER_JOINED:
      description = `${event.payload.player.name} joined the game.`;
      break;
    case EventTypes.PLAYER_SELECTED_CLUE:
      /* TODO - show clue text */
      description = (
        <React.Fragment>
          {playerName} played <Bold>{clue.category}</Bold> for <Bold>${clue.value.toLocaleString()}</Bold>.
        </React.Fragment>
      );
      break;
    case EventTypes.PLAYER_BUZZED:
      description = `${playerName} buzzed in.`;
      break;
    case EventTypes.PLAYER_ANSWERED:
      const { answer, correct, value } = event.payload;
      const amount = (correct ? '+' : '-') + `$${value.toLocaleString()}`;
      description = `${playerName} answered "${answer.trim()}" (${amount}).`;
      break;
    case EventTypes.PLAYER_WAGERED:
      description = (
        <React.Fragment>
          {playerName} wagered <Bold>${event.payload.wager.toLocaleString()}</Bold>.
        </React.Fragment>
      );
      break;
    case EventTypes.PLAYER_MARKED_CLUE_AS_INVALID:
      description = `${playerName} marked the active clue as invalid.`;
      break;
    case EventTypes.PLAYER_VOTED_TO_SKIP_CLUE:
      description = `${playerName} voted to skip the active clue.`;
      break;
    case EventTypes.BUZZING_PERIOD_ENDED:
      /* TODO - show correct answer, handle skipping the clue */
      description = 'Time ran out before anyone answered correctly.';
      break;
    case EventTypes.RESPONSE_PERIOD_ENDED:
      description = `Time ran out for ${playerName} to answer.`;
      break;
    default:
      break;
  }
  if (!description) {
    return null;
  }
  return (
    <React.Fragment>
      <Text as="span" mr={2}>{description}</Text>
      <Text as="span" d="inline-block" fontSize="sm" fontStyle="italic" opacity="0.8">{timestamp}</Text>
    </React.Fragment>
  );
}

function GameHistoryEvent(props) {
  return (
    <ListItem className="list-group-item" p={4} fontSize="lg">{getEventDescription(props)}</ListItem>
  );
}

export default GameHistoryEvent;
