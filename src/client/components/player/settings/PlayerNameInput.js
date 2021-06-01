import React from 'react';
import { GridItem, Input, Text } from '@chakra-ui/react';
import { MAX_PLAYER_NAME_LENGTH, PLACEHOLDER_PLAYER_NAME } from '../../../../constants.mjs';
import GridRow from '../../common/GridRow';

function PlayerNameInput(props) {
  return (
    <GridRow cols={6} my={5}>
      <GridItem my={1}>
        <Text fontWeight="bold">Name</Text>
        <Text fontSize="sm" fontStyle="italic">max {MAX_PLAYER_NAME_LENGTH} characters</Text>
      </GridItem>
      <GridItem colSpan={5} d="flex" alignItems="center">
        <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" placeholder={PLACEHOLDER_PLAYER_NAME}
               value={props.name} onChange={props.onChange} isInvalid={props.invalid} autoFocus={true} aria-label="player-name" />
      </GridItem>
    </GridRow>
  );
}

export default PlayerNameInput;
