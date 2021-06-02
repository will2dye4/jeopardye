import React from 'react';
import { Box } from '@chakra-ui/react';
import { faFastForward, faFlag } from '@fortawesome/free-solid-svg-icons';
import Icon from '../../../common/Icon';

function ActiveClueButtons(props) {
  return (
    <Box className="active-clue-buttons" mb={2} position="absolute">
      {props.allowAnswers && <Icon className="active-clue-button" id="invalid-icon" icon={faFlag} title="Mark this clue invalid" />}
      {props.allowAnswers && <Icon className="active-clue-button" id="skip-icon" icon={faFastForward} title="Skip this clue" />}
    </Box>
  );
}

export default ActiveClueButtons;
