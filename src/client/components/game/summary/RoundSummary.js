import React from 'react';
import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  VStack,
} from '@chakra-ui/react';
import { EventContext, formatList } from '../../../../utils.mjs';
import Card from '../../common/card/Card';
import RoundScores from './RoundScores';

function RoundSummary(props) {
  if (!props.roundSummary) {
    return null;
  }

  const { gameOver, round } = props.roundSummary;
  const heading = (gameOver ? 'Final Scores' : `${round.toTitleCase()} Jeopardye Round Standings`);

  let buttonLabel, onClick;
  if (gameOver) {
    buttonLabel = 'Return to Lobby';
    onClick = () => props.clearCurrentGame(props.gameState.gameID);
  } else if (props.gameState.playerIsHost) {
    buttonLabel = 'Start Next Round';
    onClick = () => props.advanceToNextRound(EventContext.fromProps(props));
  } else {
    buttonLabel = 'Ready for Next Round';
    onClick = () => props.markPlayerAsReadyForNextRound(EventContext.fromProps(props));
  }

  const showWaitingPlayers = (!gameOver && (props.gameState.playerIsSpectating || props.playersReadyForNextRound.includes(props.gameState.playerID) || props.gameState.playerIsHost));
  let waitingText;
  if (showWaitingPlayers) {
    const waitingPlayers = Object.values(props.players).filter(player => !props.playersReadyForNextRound.includes(player.playerID));
    if (waitingPlayers.length > 3) {
      waitingText = `Waiting for ${waitingPlayers.length} players...`;
    } else if (waitingPlayers.length) {
      waitingText = `Waiting for ${formatList(waitingPlayers.map(player => player.name))}...`;
    } else {
      waitingText = 'Waiting for host to start next round...';
    }
  }

  return (
    <Modal isOpen={true} closeOnEsc={false} closeOnOverlayClick={false} size="5xl" onClose={() => null}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <Card className="game-settings" px={10} py={6} textAlign="center">
            <Heading mb={8}>{heading}</Heading>
            <RoundScores {...props} />
            <Flex justify="center" mt={12} mb={3}>
              <VStack w="100%">
                {showWaitingPlayers && <Heading size="lg" pb={3}>{waitingText}</Heading>}
                {(!showWaitingPlayers || props.gameState.playerIsHost) && <Button colorScheme="jeopardyBlue" size="lg" w="25%" onClick={onClick}>{buttonLabel}</Button>}
              </VStack>
            </Flex>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default RoundSummary;
