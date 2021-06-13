import React from 'react';
import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { formatList } from '../../../../utils.mjs';
import Card from '../../common/card/Card';
import RoundScores from './RoundScores';

function RoundSummary(props) {
  if (!props.roundSummary) {
    return null;
  }

  const { gameOver, round } = props.roundSummary;
  const heading = (gameOver ? 'Final Scores' : `${round.toTitleCase()} Jeopardye Round Standings`);
  const buttonLabel = (gameOver ? 'Return to Lobby' : 'Ready for Next Round');

  let onClick;
  if (gameOver) {
    onClick = () => props.clearCurrentGame(props.gameState.gameID);
  } else {
    onClick = () => props.markPlayerAsReadyForNextRound(props.gameState.gameID, props.gameState.playerID);
  }

  const readyForNextRound = ((!gameOver && props.gameState.playerIsSpectating) || props.playersReadyForNextRound.indexOf(props.gameState.playerID) !== -1);
  let waitingText;
  if (readyForNextRound) {
    const waitingPlayers = Object.values(props.players).filter(player => props.playersReadyForNextRound.indexOf(player.playerID) === -1);
    if (waitingPlayers.length > 3) {
      waitingText = `Waiting for ${waitingPlayers.length} players...`;
    } else if (waitingPlayers.length) {
      waitingText = `Waiting for ${formatList(waitingPlayers.map(player => player.name))}...`;
    } else {
      waitingText = 'Starting next round...';
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
              {readyForNextRound ?
                <Heading size="lg">{waitingText}</Heading> :
                <Button colorScheme="jeopardyBlue" size="lg" w="25%" onClick={onClick}>{buttonLabel}</Button>
              }
            </Flex>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default RoundSummary;
