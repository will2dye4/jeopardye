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
import { EventContext, formatList } from '../../../../utils.mjs';
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
    onClick = () => props.markPlayerAsReadyForNextRound(EventContext.fromProps(props));
  }

  const readyForNextRound = ((!gameOver && props.gameState.playerIsSpectating) || props.playersReadyForNextRound.includes(props.gameState.playerID));
  let waitingText;
  if (readyForNextRound) {
    const waitingPlayers = Object.values(props.players).filter(player => !props.playersReadyForNextRound.includes(player.playerID));
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
