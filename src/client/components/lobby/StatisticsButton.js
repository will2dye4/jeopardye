import React from 'react';
import { Badge } from '@chakra-ui/react';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../common/ActionIcon';

function StatisticsButton(props) {
  const title = 'Show player statistics';
  return (
    <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={3} py={2} fontSize="xl"
           userSelect="none" position="fixed" top="5" right="5" zIndex="1000" title={title} className="hover-pointer"
           onClick={props.playerStats.open}>
      <ActionIcon id="statistics" icon={faChartLine} title={title}/>
    </Badge>
  );
}

export default StatisticsButton;
