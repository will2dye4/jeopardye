import React from 'react';
import { FormControl, FormHelperText, FormLabel, GridItem, Input } from '@chakra-ui/react';
import { MAX_PLAYER_NAME_LENGTH, PLACEHOLDER_PLAYER_NAME } from '../../../../constants.mjs';
import GridRow from '../../common/GridRow';

function PlayerNameInput(props) {
  return (
    <FormControl id="player-name" isInvalid={props.invalid}>
      <GridRow cols={6} my={5}>
        <GridItem my={1}>
          <FormLabel fontWeight="bold" fontSize="2xl" mb={0}>Name</FormLabel>
          <FormHelperText fontStyle="italic" mt={0}>max {MAX_PLAYER_NAME_LENGTH} characters</FormHelperText>
        </GridItem>
        <GridItem colSpan={5} d="flex" alignItems="center">
          <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" placeholder={PLACEHOLDER_PLAYER_NAME}
                 value={props.name} onChange={props.onChange} autoFocus={true} aria-label="player-name" />
        </GridItem>
      </GridRow>
    </FormControl>
  );
}

export default PlayerNameInput;
