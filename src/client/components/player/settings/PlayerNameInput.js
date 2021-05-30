import React from 'react';
import { Grid, GridItem, Input, Text } from '@chakra-ui/react';
import { MAX_PLAYER_NAME_LENGTH, PLACEHOLDER_PLAYER_NAME } from '../../../../constants.mjs';

function PlayerNameInput(props) {
  return (
    <Grid my={5} templateColumns="repeat(6, 1fr)" templateRows="repeat(1, 1fr)">
      <GridItem my={1}>
        <Text fontWeight="bold">Name</Text>
        <Text fontSize="sm" fontStyle="italic">max {MAX_PLAYER_NAME_LENGTH} characters</Text>
      </GridItem>
      <GridItem colSpan={5} d="flex" alignItems="center">
        <Input focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" placeholder={PLACEHOLDER_PLAYER_NAME}
               value={props.name} onChange={props.onChange} isInvalid={props.invalid} autoFocus={true} aria-label="player-name" />
      </GridItem>
    </Grid>
  );
}

export default PlayerNameInput;
