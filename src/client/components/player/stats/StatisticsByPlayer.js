import React from 'react';
import { Flex, Select, StatGroup, Text } from '@chakra-ui/react';
import { comparePlayerEntries, formatScore } from '@dyesoft/alea-core';
import moment from 'moment';
import { getAugmentedPlayerStats } from '../../../../utils.mjs';
import {
  ALL_TIME_SCORE,
  AVERAGE_SCORE,
  DAILY_DOUBLE_ACCURACY,
  FINAL_ROUND_ACCURACY,
  HIGHEST_SINGLE_GAME_SCORE,
  RESPONSE_ACCURACY,
  WINNING_PERCENTAGE,
} from './constants';
import PlayerStatistic from './PlayerStatistic';

const GROUP_PADDING = 10;

function StatisticsByPlayer(props) {
  const player = props.selectedPlayer;
  const {
    overallScore,
    highestGameScore,
    averageScore,
    gamesPlayed,
    gamesWon,
    winningPercentage,
    cluesAnswered,
    cluesAnsweredCorrectly,
    correctPercentage,
    dailyDoublesAnswered,
    dailyDoublesAnsweredCorrectly,
    dailyDoublePercentage,
    finalCluesAnswered,
    finalCluesAnsweredCorrectly,
    finalRoundPercentage,
  } = getAugmentedPlayerStats(player.stats);
  return (
    <React.Fragment>
      <Flex align="center" ml={12} py={3}>
        <Select ref={props.selectRef} focusBorderColor="jeopardyeBlue.500" w="20%" value={player.playerID} onChange={props.onPlayerChanged}>
          {Object.entries(props.players).sort(comparePlayerEntries).map(([playerID, player]) =>
            <option key={playerID} value={playerID}>{player.name}</option>
          )}
        </Select>
        <Text ml={5} fontSize="lg" fontStyle="italic" opacity="0.8">
          joined {moment(player.createdTime).fromNow()}, last connected {moment(player.lastConnectionTime).fromNow()}
        </Text>
      </Flex>
      <StatGroup py={GROUP_PADDING}>
        <PlayerStatistic label={ALL_TIME_SCORE} value={formatScore(overallScore)} />
        <PlayerStatistic label={HIGHEST_SINGLE_GAME_SCORE} value={formatScore(highestGameScore)} />
      </StatGroup>
      <StatGroup py={GROUP_PADDING}>
        <PlayerStatistic label={AVERAGE_SCORE} value={formatScore(averageScore)} helpText="per game" />
        <PlayerStatistic label={WINNING_PERCENTAGE} value={`${winningPercentage}%`}
                         helpText={`${gamesWon.toLocaleString()} / ${gamesPlayed.toLocaleString()}`} />
      </StatGroup>
      <StatGroup py={GROUP_PADDING}>
        <PlayerStatistic label={RESPONSE_ACCURACY} value={`${correctPercentage}%`}
                         helpText={`${cluesAnsweredCorrectly.toLocaleString()} / ${cluesAnswered.toLocaleString()}`} />
        <PlayerStatistic label={DAILY_DOUBLE_ACCURACY} value={`${dailyDoublePercentage}%`}
                         helpText={`${dailyDoublesAnsweredCorrectly.toLocaleString()} / ${dailyDoublesAnswered.toLocaleString()}`} />
        <PlayerStatistic label={FINAL_ROUND_ACCURACY} value={`${finalRoundPercentage}%`}
                         helpText={`${finalCluesAnsweredCorrectly.toLocaleString()} / ${finalCluesAnswered.toLocaleString()}`} />
      </StatGroup>
    </React.Fragment>
  );
}

export default StatisticsByPlayer;
