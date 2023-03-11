import React from 'react';
import { Flex, Select, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { comparePlayerNames, formatScore } from '@dyesoft/alea-core';
import { LeaderboardKeys } from '../../../../constants.mjs';
import Icon from '../../common/Icon';
import {
  ALL_TIME_SCORE,
  AVERAGE_SCORE,
  DAILY_DOUBLE_ACCURACY,
  FINAL_ROUND_ACCURACY,
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
  [LeaderboardKeys.AVERAGE_SCORE]: {
    formatter: formatScore,
    optionLabel: AVERAGE_SCORE,
    scoreColumnLabel: 'Avg. Score',
  },
  [LeaderboardKeys.WINNING_PERCENTAGE]: {
    formatter: formatPercentage,
    optionLabel: WINNING_PERCENTAGE,
    scoreColumnLabel: 'Win %',
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
  [LeaderboardKeys.FINAL_ROUND_PERCENTAGE]: {
    formatter: formatPercentage,
    optionLabel: FINAL_ROUND_ACCURACY,
    scoreColumnLabel: 'Accuracy',
  },
};

function Leaderboards(props) {
  const { formatter, scoreColumnLabel } = LEADERBOARDS[props.selectedLeaderboard];
  return (
    <React.Fragment>
      <Flex align="center" justify="center" py={3}>
        <Select focusBorderColor="jeopardyeBlue.500" w="30%" value={props.selectedLeaderboard} onChange={props.onLeaderboardChanged}>
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
            const color = (firstPlace ? 'jeopardyeBlue.500' : 'black');
            const isPlayerPlace = players.map(player => player.playerID).includes(props.playerID);
            const playerNames = players.sort(comparePlayerNames).map(player =>
              <Text key={player.playerID} fontWeight={firstPlace || player.playerID === props.playerID ? 'bold' : 'normal'} py={2}>{player.name}</Text>
            );
            return (
              <Tr key={place} textColor={color} fontSize="2xl" fontWeight={firstPlace || isPlayerPlace ? 'bold' : 'normal'}>
                <Td>
                  {place.substring(0, place.length - 2)}<sup>{place.substring(place.length - 2, place.length)}</sup>
                  {firstPlace && <Text as="span" color="jeopardyeYellow.500" ml={3}><Icon id="first-place-icon" icon={faCrown} title="1st Place" clickable={false} /></Text>}
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
