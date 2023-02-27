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
  VStack,
} from '@chakra-ui/react';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { EventContext, formatList, getNextRound } from '../../../../utils.mjs';
import { getPlayerName } from '../../../reducers/game_reducer';
import Bold from '../../common/Bold';
import Card from '../../common/card/Card';
import Icon from '../../common/Icon';
import RoundScores from './RoundScores';

function RoundSummary(props) {
  if (!props.roundSummary) {
    return null;
  }

  const { gameOver, round, skippedFinalRound } = props.roundSummary;
  const heading = (gameOver ? 'Final Scores' : `${round.toTitleCase()} Jeopardye Round Standings`);
  const nextRound = (gameOver ? '' : (getNextRound(props.game) || 'next'));

  let buttonLabel, onClick;
  if (gameOver) {
    buttonLabel = 'Return to Lobby';
    onClick = () => props.clearCurrentGame(props.gameState.gameID);
  } else {
    if (props.gameState.playerIsHost) {
      buttonLabel = `Start ${nextRound.toTitleCase()} Round`;
      onClick = () => props.advanceToNextRound(EventContext.fromProps(props));
    } else {
      buttonLabel = `Ready for ${nextRound.toTitleCase()} Round`;
      onClick = () => props.markPlayerAsReadyForNextRound(EventContext.fromProps(props));
    }
  }

  const showWaitingPlayers = (!gameOver && (props.gameState.playerIsSpectating || props.playersReadyForNextRound.includes(props.gameState.playerID) || props.gameState.playerIsHost));
  let waitingText;
  if (showWaitingPlayers) {
    let waitingPlayers = Object.values(props.players).filter(player => !props.playersReadyForNextRound.includes(player.playerID));
    if (props.gameState.playerIsHost) {
      waitingPlayers = waitingPlayers.filter(player => player.playerID !== props.room?.hostPlayerID);
    }
    if (waitingPlayers.length > 3) {
      waitingText = `Waiting for ${waitingPlayers.length} players...`;
    } else if (waitingPlayers.length > 1 || (waitingPlayers.length === 1 && waitingPlayers[0].playerID !== props.room?.hostPlayerID)) {
      waitingText = `Waiting for ${formatList(waitingPlayers.map(player => player.playerID === props.gameState.playerID ? 'you' : player.name).sort())}...`;
    } else if (!props.gameState.playerIsHost) {
      const hostName = (props.room ? getPlayerName(props.room.hostPlayerID) : 'host');
      waitingText = `Waiting for ${hostName} to start the ${nextRound} round...`;
    }
  }

  return (
    <Modal isOpen={true} closeOnEsc={false} closeOnOverlayClick={false} size="5xl" onClose={() => null}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <Card className="game-settings" px={10} py={6} textAlign="center">
            <Heading mb={8}>{heading}</Heading>
            {skippedFinalRound && (
              <Text fontSize="xl" p={5} mx={10} mb={2} borderRadius={10} bg="yellow.200">
                <Text as="span" mr={2}><Icon id="final-round-skipped-icon" icon={faTriangleExclamation} clickable={false} /></Text>
                <Bold>NOTE:</Bold> The final round was skipped because no players would have been able to wager.
              </Text>)}
            <RoundScores {...props} />
            <Flex justify="center" mt={12} mb={3}>
              <VStack w="100%">
                {showWaitingPlayers && <Heading size="lg" pb={3}>{waitingText}</Heading>}
                {(!showWaitingPlayers || props.gameState.playerIsHost) && <Button colorScheme="jeopardyeBlue" size="lg" w="25%" onClick={onClick}>{buttonLabel}</Button>}
              </VStack>
            </Flex>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default RoundSummary;
