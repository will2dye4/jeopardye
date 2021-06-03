import React from 'react';
import { GridItem, Text } from '@chakra-ui/react';
import GridRow from '../../common/GridRow';
import ToggleSwitch from '../../common/form/ToggleSwitch';

function AudioPreferenceRow(props) {
  return (
    <GridRow cols={6} my={5}>
      <GridItem colSpan={2} my={1}>
        <Text fontWeight="bold" fontSize="xl">{props.label}</Text>
      </GridItem>
      <GridItem colSpan={4} d="flex" alignItems="center">
        <ToggleSwitch name={props.name} checked={props.checked} onChange={props.onChange} />
      </GridItem>
    </GridRow>
  );
}

export default AudioPreferenceRow;
