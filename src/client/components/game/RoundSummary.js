import React from 'react';
import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { formatList } from '../../../utils.mjs';
import Card from '../common/card/Card';

function RoundSummary(props) {
  const { gameOver, places } = props.roundSummary;
  const heading = (gameOver ? 'Game Summary' : 'Round Summary');
  const buttonLabel = (gameOver ? 'Return to Lobby' : 'Ready for Next Round');
  return (
    <Modal isOpen={true} closeOnEsc={false} closeOnOverlayClick={false} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <Card className="game-settings" px={10} py={6} textAlign="center">
            <Heading mb={5}>{heading}</Heading>
            {Object.entries(places).map(([place, playerIDs]) =>
              <Text key={place}>{place} - {formatList(playerIDs.map(playerID => props.players[playerID]?.name || playerID))}</Text>
            )}
            <Flex justify="center" mt={8} mb={3}>
              <Button colorScheme="jeopardyBlue" size="lg" w="25%">
                {buttonLabel}
              </Button>
            </Flex>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default RoundSummary;
