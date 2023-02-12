import React from 'react';
import { HStack } from '@chakra-ui/react';
import DashboardButton from './DashboardButton';
import WhatsNewModalButton from '../lobby/WhatsNewModalButton';

function HomeButtons(props) {
  return (
    <HStack spacing={4} position="fixed" top="5" right="5" zIndex="1000">
      {props.isAdmin && <DashboardButton {...props} />}
      <WhatsNewModalButton {...props} />
    </HStack>
  );
}

export default HomeButtons;
