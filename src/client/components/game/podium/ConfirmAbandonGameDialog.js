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

function ConfirmAbandonGameDialog(props) {
  const cancelRef = React.useRef();
  return (
    <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef} onClose={props.onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="2xl" fontWeight="bold">End Game</AlertDialogHeader>
          <AlertDialogBody fontSize="xl" pb={5}>Are you sure you want to end the game for everyone and return to the lobby?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={props.onClose}>Cancel</Button>
            <Button colorScheme="red" onClick={props.onConfirm} ml={3}>End Game</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default ConfirmAbandonGameDialog;
