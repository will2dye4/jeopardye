import React from 'react';
import { HStack } from '@chakra-ui/react';
import DashboardButton from './DashboardButton';

function HomeButtons(props) {
  return (
    <HStack position="fixed" top="5" right="5" zIndex="1000">
      {props.isAdmin && <DashboardButton {...props} />}
    </HStack>
  );
}

export default HomeButtons;
