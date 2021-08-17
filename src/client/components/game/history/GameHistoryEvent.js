import React from 'react';
import moment from 'moment';
import { Box, GridItem, HStack, ListItem, Text } from '@chakra-ui/react';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { Emoji, EventTypes } from '../../../../constants.mjs';
import { comparePlayerNames, formatScore, isDailyDouble } from '../../../../utils.mjs';
import { getPlayerName } from '../../../reducers/game_reducer';
import { formatElementList } from '../../../utils';
import ActionIcon from '../../common/ActionIcon';
import Bold from '../../common/Bold';
import GridRow from '../../common/GridRow';
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

function getRoundStandings(round, places) {
  return (
    <Box>
      <GridRow key="heading" cols={4}>
        <GridItem colSpan={4} pb={2} textAlign="center"><Bold>{round.toTitleCase()} Round Standings</Bold></GridItem>
      </GridRow>
      {Object.entries(places).map(([place, players]) => {
        const playerNames = formatElementList(players.sort(comparePlayerNames).map(player => <PlayerName>{player.name}</PlayerName>));
        const score = formatScore(players[0].score);
        return (
          <GridRow key={place} cols={4}>
            <GridItem pr={3} textAlign="right"><Bold>{place}</Bold></GridItem>
            <GridItem colSpan={3}>{playerNames} ({score})</GridItem>
          </GridRow>
        );
      })}
    </Box>
  );
}

function getEventDescription(props) {
  const event = props.event;
  const timestamp = getRelativeEventTime(event.timestamp);
  const playerID = event.payload.context?.playerID || event.payload.playerID;
  const playerName = (playerID === props.gameState.playerID ? 'You' : getPlayerName(playerID));
  const futureEvents = props.eventHistory.slice(props.index + 1);
  let dailyDouble, description, emoji, eventConfig, heading, name;
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
            The {event.payload.round} Jeopardye round has started. <PlayerName>{getPlayerName(event.payload.playerInControl)}</PlayerName> is in control.
          </Bold>
        ),
        emoji: Emoji.PLAY_BUTTON,
      };
      break;
    case EventTypes.ROUND_ENDED:
      if (event.payload.gameOver) {
        heading = <Bold>The game has ended.</Bold>;
      } else {
        heading = (
          <GameHistoryEventAccordion heading={<Bold>The {event.payload.round} Jeopardye round has ended.</Bold>} timestamp={timestamp}>
            {getRoundStandings(event.payload.round, event.payload.places)}
          </GameHistoryEventAccordion>
        );
      }
      eventConfig = {
        description: heading,
        emoji: (event.payload.gameOver ? Emoji.CHECKERED_FLAG : Emoji.END_ARROW),
        isAccordion: !event.payload.gameOver,
      };
      break;
    case EventTypes.ROOM_HOST_REASSIGNED:
    case EventTypes.PLAYER_LEFT_ROOM:
      if (event.payload.newHostPlayerID) {
        const name = (event.payload.newHostPlayerID === props.gameState.playerID ? 'You' : getPlayerName(event.payload.newHostPlayerID));
        const verb = (name === 'You' ? 'are' : 'is');
        eventConfig = {
          description: <Bold><PlayerName>{name}</PlayerName> {verb} now the host.</Bold>,
          emoji: Emoji.MICROPHONE,
        };
      }
      break;
    case EventTypes.PLAYER_CHANGED_NAME:
      if (event.payload.name !== event.payload.prevName) {
        eventConfig = {
          description: <React.Fragment><PlayerName>{event.payload.prevName}</PlayerName> is now known as <PlayerName>{event.payload.name}</PlayerName>.</React.Fragment>,
          emoji: Emoji.NAME_BADGE,
        };
      }
      break;
    case EventTypes.PLAYER_JOINED:
      name = (event.payload.player.playerID === props.gameState.playerID ? 'You' : event.payload.player.name);
      eventConfig = {
        description: <React.Fragment><PlayerName>{name}</PlayerName> joined the game.</React.Fragment>,
        emoji: Emoji.BUST_IN_SILHOUETTE,
      };
      break;
    case EventTypes.PLAYER_STARTED_SPECTATING:
    case EventTypes.PLAYER_STOPPED_SPECTATING:
      const started = (event.eventType === EventTypes.PLAYER_STARTED_SPECTATING);
      const verb = (playerName === 'You' ? 'are' : 'is');
      eventConfig = {
        description: <React.Fragment><PlayerName>{playerName}</PlayerName> {verb} now a {started ? 'spectator' : 'player'}.</React.Fragment>,
        emoji: (started ? Emoji.EYE : Emoji.BUST_IN_SILHOUETTE),
      };
      break;
    case EventTypes.PLAYER_SELECTED_CLUE:
      dailyDouble = (!!props.game && isDailyDouble(props.game.rounds[event.round], event.clue.clueID));
      const showQuestion = (!dailyDouble || !!futureEvents.find(event => event.eventType === EventTypes.PLAYER_WAGERED));
      heading = (
        <React.Fragment>
          <PlayerName>{playerName}</PlayerName> played <Bold>{event.clue.category}</Bold> for <Bold>${event.clue.value.toLocaleString()}</Bold>.
        </React.Fragment>
      );
      if (showQuestion) {
        description = (
          <GameHistoryEventAccordion heading={heading} timestamp={timestamp}>
            {event.clue.question}
          </GameHistoryEventAccordion>
        );
      } else {
        description = heading;
      }
      eventConfig = {
        description: description,
        emoji: Emoji.QUESTION_MARK,
        isAccordion: showQuestion,
      };
      break;
    case EventTypes.PLAYER_BUZZED:
      eventConfig = {
        description: <React.Fragment><PlayerName>{playerName}</PlayerName> buzzed in.</React.Fragment>,
        emoji: Emoji.BELL,
      };
      break;
    case EventTypes.PLAYER_ANSWERED:
      const { answer, clue, correct, value } = event.payload;
      const amount = (correct ? '+' : '-') + `$${value.toLocaleString()}`;
      const color = (correct ? 'green' : 'red');
      dailyDouble = (!!props.game && isDailyDouble(props.game.rounds[event.round], clue.clueID));
      const showAnswer = (dailyDouble && !correct);
      let showOverride = false;
      if (!correct && props.gameState.playerIsHost) {
        const answerRevealedPredicate = (e) => {
          if (e.eventType === EventTypes.PLAYER_ANSWERED) {
            const { categoryID, clueID } = e.payload.clue;
            return (categoryID === clue.categoryID && clueID === clue.clueID && e.payload.correct);
          }
          if (e.eventType === EventTypes.BUZZING_PERIOD_ENDED) {
            const { categoryID, clueID } = e.clue;
            return (categoryID === clue.categoryID && clueID === clue.clueID);
          }
          return false;
        };
        const decisionOverriddenPredicate = (e) => {
          if (e.eventType === EventTypes.HOST_OVERRODE_SERVER_DECISION) {
            const { categoryID, clueID } = e.payload.clue;
            return (categoryID === clue.categoryID && clueID === clue.clueID && e.payload.context.playerID === playerID);
          }
          return false;
        };
        showOverride = ((dailyDouble || !!futureEvents.find(answerRevealedPredicate)) && !futureEvents.find(decisionOverriddenPredicate));
      }
      let overrideButton = null;
      if (showOverride) {
        const onClick = (clickEvent) => {
          clickEvent.preventDefault();
          props.overrideServerDecision(event.payload.context, value);
        };
        overrideButton = (
          <Text as="span" mx={2}>
            <ActionIcon id="override-icon" icon={faGavel} title="Override" ml={2} onClick={onClick} />
          </Text>
        );
      }
      heading = (
        <React.Fragment>
          <PlayerName>{playerName}</PlayerName> answered "{answer.trim()}" (<Text as="span" fontWeight="bold" textColor={color} whiteSpace="nowrap">{amount}</Text>).
        </React.Fragment>
      );
      if (showAnswer) {
        description = (
          <GameHistoryEventAccordion heading={heading} timestamp={timestamp} button={overrideButton}>
            <Bold>Answer:</Bold> {clue.answer}
          </GameHistoryEventAccordion>
        );
      } else {
        description = heading;
      }
      eventConfig = {
        description: description,
        emoji: (correct ? Emoji.CHECK_MARK : Emoji.CROSS_MARK),
        isAccordion: showAnswer,
        button: (showAnswer ? null : overrideButton),
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
    case EventTypes.HOST_OVERRODE_SERVER_DECISION:
      const hostName = (props.room ? (props.gameState.playerIsHost ? 'You' : getPlayerName(props.room.hostPlayerID)) : 'Host');
      const suffix = (playerName === 'You' ? '' : `'s`);
      name = (playerName === 'You' ? 'your' : playerName);
      eventConfig = {
        description: <React.Fragment><PlayerName>{hostName}</PlayerName> overrode the server's decision on <PlayerName>{name}</PlayerName>{suffix} previous answer (<Text as="span" fontWeight="bold" textColor="green" whiteSpace="nowrap">+${event.payload.value.toLocaleString()}</Text>).</React.Fragment>,
        emoji: Emoji.JUDGE,
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
      name = (playerName === 'You' ? 'you' : playerName);
      eventConfig = {
        description: <React.Fragment>Time ran out for <PlayerName>{name}</PlayerName> to answer.</React.Fragment>,
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
  const description = getEventDescription(props);
  if (!description) {
    return null;
  }
  return (
    <ListItem className="list-group-item" px={4} py={3} fontSize="lg">{description}</ListItem>
  );
}

export default GameHistoryEvent;
