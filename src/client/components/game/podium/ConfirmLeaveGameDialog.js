import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';

function ConfirmLeaveGameDialog(props) {
  const cancelRef = React.useRef();
  let action, colorScheme, destination, heading;
  if (props.abandon) {
    action = 'end the game for everyone';
    colorScheme = 'red';
    destination = 'lobby';
    heading = 'End Game';
  } else {
    action = `leave the ${props.gameID ? 'game' : 'room'}`;
    colorScheme = 'jeopardyeBlue';
    destination = 'home page';
    heading = `Leave ${props.gameID ? 'Game' : 'Room'}`;
  }
  return (
    <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef} onClose={props.onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="2xl" fontWeight="bold">{heading}</AlertDialogHeader>
          <AlertDialogBody fontSize="xl" pb={5}>Are you sure you want to {action} and return to the {destination}?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={props.onClose}>Cancel</Button>
            <Button colorScheme={colorScheme} onClick={props.onConfirm} ml={3}>{heading}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default ConfirmLeaveGameDialog;
