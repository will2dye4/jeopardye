import React from 'react';
import { Badge } from '@chakra-ui/react';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../common/ActionIcon';

function RoomHistoryButton(props) {
  const title = 'Show room history';
  return (
    <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={3} py={2} fontSize="xl"
           userSelect="none" title={title} className="hover-pointer" onClick={props.modals.roomHistory.open}>
      <ActionIcon id="room-history-button" icon={faHistory} title={title} />
    </Badge>
  );
}

export default RoomHistoryButton;
