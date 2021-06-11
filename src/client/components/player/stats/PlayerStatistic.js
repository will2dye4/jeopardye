import React from 'react';
import { Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';

function PlayerStatistic(props) {
  return (
    <Stat>
      <StatLabel fontSize="xl">{props.label}</StatLabel>
      <StatNumber color="jeopardyBlue.500" fontSize="5xl" fontWeight="bold">{props.value}</StatNumber>
      {!!props.helpText && <StatHelpText fontSize="lg">{props.helpText}</StatHelpText>}
    </Stat>
  );
}

export default PlayerStatistic;
