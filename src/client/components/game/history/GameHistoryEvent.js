import React from 'react';
import moment from 'moment';
import { Box, HStack, ListItem, Text } from '@chakra-ui/react';
import { Emoji, EventTypes } from '../../../../constants.mjs';
import { getPlayerName } from '../../../reducers/game_reducer';
import Bold from '../../common/Bold';
import GameHistoryEventAccordion from './GameHistoryEventAccordion';
import GameHistoryEventDescription from './GameHistoryEventDescription';
import PlayerName from './PlayerName';

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
  let eventConfig, heading, emoji;
  switch (event.eventType) {
    case EventTypes.GAME_STARTED:
      eventConfig = {
        description: <Bold>A new game has started.</Bold>,
        emoji: Emoji.PLAY_BUTTON,
      };
      break;
    case EventTypes.GAME_ENDED:
      eventConfig = {
        description: <Bold>The game has ended.</Bold>,
        emoji: Emoji.CHECKERED_FLAG,
      };
      break;
    case EventTypes.ROUND_STARTED:
      eventConfig = {
        description: (
          <Bold>
            The {event.payload.round} Jeopardye round has started.
            <PlayerName>{getPlayerName(event.payload.playerInControl)}</PlayerName> is in control.
          </Bold>
        ),
        emoji: Emoji.PLAY_BUTTON,
      };
      break;
    case EventTypes.ROUND_ENDED:
      /* TODO - show scores in accordion */
      if (event.payload.gameOver) {
        eventConfig = {
          description: <Bold>The game has ended.</Bold>,
          emoji: Emoji.CHECKERED_FLAG,
        };
      } else {
        eventConfig = {
          description: <Bold>The {event.payload.round} Jeopardye round has ended.</Bold>,
          emoji: Emoji.END_ARROW,
        };
      }
      break;
    case EventTypes.PLAYER_JOINED:
      eventConfig = {
        description: <React.Fragment><PlayerName>{event.payload.player.name}</PlayerName> joined the game.</React.Fragment>,
        emoji: Emoji.BUST_IN_SILHOUETTE,
      };
      break;
    case EventTypes.PLAYER_SELECTED_CLUE:
      heading = (
        <React.Fragment>
          <PlayerName>{playerName}</PlayerName> played <Bold>{event.clue.category}</Bold> for <Bold>${event.clue.value.toLocaleString()}</Bold>.
        </React.Fragment>
      );
      eventConfig = {
        description: (
          <GameHistoryEventAccordion heading={heading} timestamp={timestamp}>
            {event.clue.question}
          </GameHistoryEventAccordion>
        ),
        emoji: Emoji.QUESTION_MARK,
        isAccordion: true,
      };
      break;
    case EventTypes.PLAYER_BUZZED:
      eventConfig = {
        description: <React.Fragment><PlayerName>{playerName}</PlayerName> buzzed in.</React.Fragment>,
        emoji: Emoji.BELL,
      };
      break;
    case EventTypes.PLAYER_ANSWERED:
      const { answer, correct, value } = event.payload;
      const amount = (correct ? '+' : '-') + `$${value.toLocaleString()}`;
      const color = (correct ? 'green' : 'red');
      emoji = (correct ? Emoji.CHECK_MARK : Emoji.CROSS_MARK);
      eventConfig = {
        description: (
          <React.Fragment>
            <PlayerName>{playerName}</PlayerName> answered "{answer.trim()}" (<Text as="span" fontWeight="bold" textColor={color} whiteSpace="nowrap">{amount}</Text>).
          </React.Fragment>
        ),
        emoji: emoji,
      };
      break;
    case EventTypes.PLAYER_WAGERED:
      eventConfig = {
        description: (
          <React.Fragment>
            <PlayerName>{playerName}</PlayerName> wagered <Bold>${event.payload.wager.toLocaleString()}</Bold>.
          </React.Fragment>
        ),
        emoji: Emoji.MONEY_WITH_WINGS,
      };
      break;
    case EventTypes.PLAYER_MARKED_CLUE_AS_INVALID:
      eventConfig = {
        description: <React.Fragment><PlayerName>{playerName}</PlayerName> marked the clue as invalid.</React.Fragment>,
        emoji: Emoji.INTERROBANG,
      };
      break;
    case EventTypes.PLAYER_VOTED_TO_SKIP_CLUE:
      eventConfig = {
        description: <React.Fragment><PlayerName>{playerName}</PlayerName> voted to skip the clue.</React.Fragment>,
        emoji: Emoji.SKIP_FORWARD,
      };
      break;
    case EventTypes.BUZZING_PERIOD_ENDED:
      if (event.payload.skipped) {
        heading = 'Skipped the clue.';
        emoji = Emoji.SKIP_FORWARD;
      } else {
        heading = 'Buzzing time expired.';
        emoji = Emoji.TIMER_CLOCK;
      }
      eventConfig = {
        description: (
          <GameHistoryEventAccordion heading={heading} timestamp={timestamp}>
            <Bold>Answer:</Bold> {event.clue.answer}
          </GameHistoryEventAccordion>
        ),
        emoji: emoji,
        isAccordion: true,
      };
      break;
    case EventTypes.RESPONSE_PERIOD_ENDED:
      eventConfig = {
        description: <React.Fragment>Time ran out for <PlayerName>{playerName}</PlayerName> to answer.</React.Fragment>,
        emoji: Emoji.TIMER_CLOCK,
      };
      break;
    default:
      break;
  }
  if (!eventConfig) {
    return null;
  }
  return (
    <HStack spacing={4}>
      <Box>{eventConfig.emoji}</Box>
      <GameHistoryEventDescription {...eventConfig} showTimestamp={!eventConfig.isAccordion} timestamp={timestamp} />
    </HStack>
  );
}

function GameHistoryEvent(props) {
  return (
    <ListItem className="list-group-item" px={4} py={3} fontSize="lg">{getEventDescription(props)}</ListItem>
  );
}

export default GameHistoryEvent;
