import React from 'react';
import { GridItem, Text } from '@chakra-ui/react';
import GridRow from '../../common/GridRow';

function GameSetting(props) {
  const cols = props.cols || 3;
  return (
    <GridRow cols={cols} my={8}>
      <GridItem my={1}>
        <Text fontWeight="bold">{props.label}</Text>
        {!!props.helperText && <Text color="gray" fontStyle="italic" fontSize="sm" mt={1} pr={7}>{props.helperText}</Text>}
      </GridItem>
      <GridItem colSpan={cols - 1} display="flex" alignItems="center">
        {props.children}
      </GridItem>
    </GridRow>
  );
}

export default GameSetting;
