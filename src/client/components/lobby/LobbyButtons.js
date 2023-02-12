import React from 'react';
import { HStack } from '@chakra-ui/react';
import DashboardButton from '../home/DashboardButton';
import EpisodeBrowserButton from './EpisodeBrowserButton';
import RoomHistoryButton from './RoomHistoryButton';
import StatisticsButton from './StatisticsButton';
import WhatsNewModalButton from './WhatsNewModalButton';

function LobbyButtons(props) {
  return (
    <HStack spacing={4} position="fixed" top="5" right="5" zIndex="1000">
      {props.isAdmin && <DashboardButton {...props} />}
      <WhatsNewModalButton {...props} />
      <RoomHistoryButton {...props} />
      <EpisodeBrowserButton {...props} />
      <StatisticsButton {...props} />
    </HStack>
  );
}

export default LobbyButtons;
