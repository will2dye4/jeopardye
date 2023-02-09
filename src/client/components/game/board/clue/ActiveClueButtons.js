import React from 'react';
import { HStack } from '@chakra-ui/react';
import { faFastForward, faFlag } from '@fortawesome/free-solid-svg-icons';
import ActiveClueButton from './ActiveClueButton';

const ENABLE_MARKING_CLUES_INVALID = false;

function ActiveClueButtons(props) {
  if (!props.allowAnswers) {
    return null;
  }
  const allowMarkInvalid = !props.playersMarkingClueInvalid.includes(props.gameState.playerID);
  const allowVoteToSkip = !props.playersVotingToSkipClue.includes(props.gameState.playerID);
  return (
    <HStack className="active-clue-buttons" spacing="15px" mb={2} mr={3} position="absolute">
      {ENABLE_MARKING_CLUES_INVALID && (
        <ActiveClueButton id="invalid-icon" icon={faFlag} selectable={allowMarkInvalid} title="Mark this clue invalid"
                          badge={props.playersMarkingClueInvalid.length} />
      )}
      <ActiveClueButton id="skip-icon" icon={faFastForward} selectable={allowVoteToSkip} title="Vote to skip this clue"
                        badge={props.playersVotingToSkipClue.length} />
    </HStack>
  );
}

export default ActiveClueButtons;
