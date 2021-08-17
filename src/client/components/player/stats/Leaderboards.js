import React from 'react';
import { Flex, Select, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { LeaderboardKeys } from '../../../../constants.mjs';
import { comparePlayerNames, formatScore } from '../../../../utils.mjs';
import Icon from '../../common/Icon';
import {
  ALL_TIME_SCORE,
  DAILY_DOUBLE_ACCURACY,
  HIGHEST_SINGLE_GAME_SCORE,
  RESPONSE_ACCURACY,
  WINNING_PERCENTAGE,
} from './constants';

const formatPercentage = (value) => `${value}%`;

const LEADERBOARDS = {
  [LeaderboardKeys.OVERALL_SCORE]: {
    formatter: formatScore,
    optionLabel: ALL_TIME_SCORE,
    scoreColumnLabel: 'Score',
  },
  [LeaderboardKeys.HIGHEST_GAME_SCORE]: {
    formatter: formatScore,
    optionLabel: HIGHEST_SINGLE_GAME_SCORE,
    scoreColumnLabel: 'Score',
  },
  [LeaderboardKeys.CORRECT_PERCENTAGE]: {
    formatter: formatPercentage,
    optionLabel: RESPONSE_ACCURACY,
    scoreColumnLabel: 'Accuracy',
  },
  [LeaderboardKeys.DAILY_DOUBLE_PERCENTAGE]: {
    formatter: formatPercentage,
    optionLabel: DAILY_DOUBLE_ACCURACY,
    scoreColumnLabel: 'Accuracy',
  },
  [LeaderboardKeys.WINNING_PERCENTAGE]: {
    formatter: formatPercentage,
    optionLabel: WINNING_PERCENTAGE,
    scoreColumnLabel: 'Win %',
  },
};

function Leaderboards(props) {
  const { formatter, scoreColumnLabel } = LEADERBOARDS[props.selectedLeaderboard];
  return (
    <React.Fragment>
      <Flex align="center" justify="center" py={3}>
        <Select focusBorderColor="jeopardyBlue.500" w="30%" value={props.selectedLeaderboard} onChange={props.onLeaderboardChanged}>
          {Object.entries(LEADERBOARDS).map(([key, value]) => <option key={key} value={key}>{value.optionLabel}</option>)}
        </Select>
      </Flex>
      <Table my={4} variant="striped">
        <Thead>
          <Tr>
            <Th>Place</Th>
            <Th>Players</Th>
            <Th>{scoreColumnLabel}</Th>
          </Tr>
        </Thead>
        <Tbody fontSize="lg">
          {props.leaderboards && Object.entries(props.leaderboards[props.selectedLeaderboard]).map(([place, players]) => {
            if (place === 'Honorable Mention') {
              return null;
            }
            const firstPlace = (place === '1st');
            const color = (firstPlace ? 'jeopardyBlue.500' : 'black');
            const fontWeight = (firstPlace ? 'bold' : 'normal');
            const playerNames = players.sort(comparePlayerNames).map(player => <Text py={2}>{player.name}</Text>);
            return (
              <Tr key={place} textColor={color} fontSize="2xl" fontWeight={fontWeight}>
                <Td>
                  {place.substring(0, place.length - 2)}<sup>{place.substring(place.length - 2, place.length)}</sup>
                  {firstPlace && <Text as="span" color="jeopardyYellow.500" ml={3}><Icon id="first-place-icon" icon={faCrown} title="1st Place" clickable={false} /></Text>}
                </Td>
                <Td>{playerNames}</Td>
                <Td>{formatter(players[0].score)}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </React.Fragment>
  );
}

export default Leaderboards;
