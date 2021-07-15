import React from 'react';
import { Badge } from '@chakra-ui/react';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import ConfirmLeaveGameDialog from '../game/podium/ConfirmLeaveGameDialog';
import ActionIcon from '../common/ActionIcon';

function LeaveButton(props) {
  const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = React.useState(false);
  const title = 'Leave room';
  return (
    <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={3} py={2} fontSize="xl"
           userSelect="none" position="fixed" top="5" left="5" zIndex="1000" title={title} className="hover-pointer"
           onClick={() => setIsConfirmDialogOpen(true)}>
      <ActionIcon id="leave-room" icon={faArrowLeft} title={title} />
      <ConfirmLeaveGameDialog abandon={false} isOpen={isConfirmDialogOpen}
                              onClose={() => setIsConfirmDialogOpen(false)} onConfirm={props.onConfirm} />
    </Badge>
  );
}

export default LeaveButton;
