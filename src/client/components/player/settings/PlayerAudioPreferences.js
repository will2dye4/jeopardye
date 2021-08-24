import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
} from '@chakra-ui/react';
import AudioPreferenceRow from './AudioPreferenceRow';

function PlayerAudioPreferences(props) {
  return (
    <Accordion allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton _expanded={{bg: 'jeopardyeBlue.500', color: 'white'}}>
            <Box flex="1" fontWeight="bold" fontSize="2xl" textAlign="left">Audio Preferences</Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={0}>
          <AudioPreferenceRow label="Sound Effects" name="sound-effects" checked={props.soundEffectsEnabled}
                              onChange={props.onSoundEffectsChanged} />
          <AudioPreferenceRow label="Speak Clues" name="speak-clues" checked={props.speakCluesEnabled}
                              onChange={props.onSpeakCluesChanged} />
          <AudioPreferenceRow label="Speak Correct Answers" name="speak-answers" checked={props.speakAnswersEnabled}
                              onChange={props.onSpeakAnswersChanged} />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export default PlayerAudioPreferences;
