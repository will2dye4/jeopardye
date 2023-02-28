import React from 'react';
import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spacer,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { Emoji } from '../../../constants.mjs';
import { EventContext } from '../../../utils.mjs';
import { getPlayerName } from '../../reducers/game_reducer';
import ActionIcon from '../common/ActionIcon';
import Bold from '../common/Bold';
import Card from '../common/card/Card';

function FinalizeScoresModal(props) {
  const playerIsHost = (!!props.playerID && !!props.room && props.playerID === props.room.hostPlayerID);
  const hostName = (props.room ? getPlayerName(props.room.hostPlayerID) : 'host');
  const title = (playerIsHost ? 'Finalize Scores' : `Waiting for ${hostName} to finalize scores...`);
  let content = null;
  if (playerIsHost) {
    content = (
      <React.Fragment>
        <Text><Bold>Correct Answer:</Bold><br />{props.activeClue?.answer}</Text>
        <Table my={10}>
          <Thead>
            <Tr>
              <Th cursor="default" userSelect="none" w="25%">Player</Th>
              <Th cursor="default" userSelect="none" w="40%">Answer</Th>
              <Th cursor="default" userSelect="none">Decision</Th>
            </Tr>
          </Thead>
          <Tbody fontSize="lg">
            {Object.entries(props.finalRoundAnswers || {}).map(([playerID, finalAnswer]) => {
              const prefix = (finalAnswer.correct ? '+' : '-');
              const amount = `${prefix}$${finalAnswer.wager.toLocaleString()}`;
              const status = (finalAnswer.correct ? Emoji.CHECK_MARK + ' Correct' : Emoji.CROSS_MARK + ' Incorrect');
              const trimmedAnswer = finalAnswer.answer?.trim() || '';
              const onClick = () => props.overrideServerDecision(EventContext.fromGameAndClue(props.game, props.activeClue, playerID), finalAnswer.wager);
              return (
                <Tr key={playerID}>
                  <Td>{getPlayerName(playerID)}</Td>
                  <Td>
                    {trimmedAnswer === '' ? <Text as="span" fontStyle="italic" textColor="gray.600">None</Text> : trimmedAnswer}
                  </Td>
                  <Td>
                    <Flex direction="row">
                      <Text>{status} ({amount})</Text>
                      {!finalAnswer.correct && !finalAnswer.hostOverrodeDecision && trimmedAnswer !== '' && (
                        <React.Fragment>
                          <Spacer minW="20px" />
                          <Text as="span" mr={5}>
                            <ActionIcon id={`override-icon-${playerID}`} icon={faGavel} title="Override" onClick={onClick} />
                          </Text>
                        </React.Fragment>
                      )}
                    </Flex>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
        <Flex justify="center" mt={5} mb={3}>
          <Button colorScheme="jeopardyeBlue" size="lg" disabled={false}
                  onClick={() => props.finalizeScores(EventContext.fromProps(props))}>
            Confirm Correct Scores
          </Button>
        </Flex>
      </React.Fragment>
    );
  }
  return (
    <Modal id="finalize-scores" closeOnEsc={false} closeOnOverlayClick={false} isCentered={!playerIsHost} isOpen={true}
           onClose={null} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0} cursor="default" userSelect="none">
          <Card className="game-settings" px={10} py={6} textAlign="center">
            <Heading mb={playerIsHost ? 10 : 2}>{title}</Heading>
            {content}
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default FinalizeScoresModal;
