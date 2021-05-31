import React from 'react';
import { GridItem, Text } from '@chakra-ui/react';
import GridRow from '../../common/GridRow';

function GameSetting(props) {
  return (
    <GridRow cols={3} my={8}>
      <GridItem my={1}>
        <Text fontWeight="bold">{props.label}</Text>
      </GridItem>
      <GridItem colSpan={2} d="flex" alignItems="center">
        {props.children}
      </GridItem>
    </GridRow>
  );
}

export default GameSetting;
