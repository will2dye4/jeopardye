import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box, GridItem, Text,
} from '@chakra-ui/react';
import GridRow from "../../common/GridRow";
import ToggleSwitch from "../../common/form/ToggleSwitch";

function AudioPreferenceRow(props) {
  return (
    <GridRow cols={4} my={5}>
      <GridItem my={1}>
        <Text fontWeight="bold" fontSize="xl">{props.label}</Text>
      </GridItem>
      <GridItem colSpan={3} d="flex" alignItems="center">
        <ToggleSwitch name={props.name} checked={props.checked} onChange={props.onChange} />
      </GridItem>
    </GridRow>
  );
}

function PlayerAudioPreferences(props) {
  return (
    <Accordion allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton _expanded={{bg: 'jeopardyBlue.500', color: 'white'}}>
            <Box flex="1" fontWeight="bold" fontSize="2xl" textAlign="left">Audio Preferences</Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={0}>
          <AudioPreferenceRow label="Sound Effects" name="sound-effects" checked={props.soundEffectsEnabled}
                              onChange={props.onSoundEffectsChanged} />
          <AudioPreferenceRow label="Speak Clues" name="speak-clues" checked={props.speakCluesEnabled}
                              onChange={props.onSpeakCluesChanged} />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export default PlayerAudioPreferences;
