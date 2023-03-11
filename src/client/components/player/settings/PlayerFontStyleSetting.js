import React from 'react';
import { Box, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import { range } from '@dyesoft/alea-core';
import { ALL_FONT_STYLES } from '../../../../constants.mjs';
import GridRow from '../../common/GridRow';

const STYLES_PER_ROW = 3;
const NUM_ROWS = ALL_FONT_STYLES.length / STYLES_PER_ROW;

function PlayerFontStyleSetting(props) {
  const rows = range(NUM_ROWS).map(i => {
    const choices = range(STYLES_PER_ROW).map(j => {
      const index = (i * STYLES_PER_ROW) + j;
      const font = ALL_FONT_STYLES[index];
      let classes = 'hover-pointer font-sample';
      if (font === props.selectedStyle) {
        classes += ' font-sample-selected';
      }
      return (
        <Box key={j} bg="white" className={classes} fontFamily={font} borderRadius="md" mb={3} mx={3} textAlign="center"
             title={font} onClick={() => props.onChange(font)}>
          <Text className="font-sample-text">{props.name}</Text>
        </Box>
      );
    });
    return <SimpleGrid key={i} columns={STYLES_PER_ROW}>{choices}</SimpleGrid>;
  });
  return (
    <GridRow cols={6} my={5}>
      <GridItem my={1}>
        <Text fontWeight="bold">Font Style</Text>
      </GridItem>
      <GridItem colSpan={5}>
        {rows}
      </GridItem>
    </GridRow>
  );
}

export default PlayerFontStyleSetting;
