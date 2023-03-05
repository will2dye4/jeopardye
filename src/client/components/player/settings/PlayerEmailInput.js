import React from 'react';
import { FormControl, FormHelperText, FormLabel, GridItem, Input } from '@chakra-ui/react';
import { PLACEHOLDER_PLAYER_EMAIL } from '../../../../constants.mjs';
import Bold from '../../common/Bold';
import GridRow from '../../common/GridRow';

function PlayerEmailInput(props) {
  return (
    <FormControl id="player-email" isInvalid={props.invalid}>
      <GridRow cols={6} mt={3} mb={5}>
        <GridItem my={1}>
          <FormLabel fontWeight="bold" fontSize="2xl" mb={0}>Email</FormLabel>
          <FormHelperText fontStyle="italic" mr={2} mt={0}><Bold>optional:</Bold> register with your email to be able to restore your account in the future</FormHelperText>
        </GridItem>
        <GridItem colSpan={5} display="flex">
          <Input bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={2} mt={2} w="75%" placeholder={PLACEHOLDER_PLAYER_EMAIL}
                 value={props.email} onChange={props.onChange} onKeyUp={props.onKeyUp} aria-label="player-email" />
        </GridItem>
      </GridRow>
    </FormControl>
  );
}

export default PlayerEmailInput;
