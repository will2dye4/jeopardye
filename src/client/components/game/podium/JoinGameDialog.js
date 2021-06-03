import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';

function JoinGameDialog(props) {
  const cancelRef = React.useRef();
  return (
    <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef} onClose={props.onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent bg="gray.50">
          <AlertDialogHeader fontSize="2xl" fontWeight="bold">Join Game</AlertDialogHeader>
          <AlertDialogBody fontSize="lg">Do you want to join the game?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={props.onClose}>Cancel</Button>
            <Button colorScheme="jeopardyBlue" onClick={props.onSubmit} ml={3}>Join</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default JoinGameDialog;
