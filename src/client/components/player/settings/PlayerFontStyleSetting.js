import React from 'react';
import { Box, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import { range } from '../../../../utils.mjs';
import { DEFAULT_FONT_STYLE } from '../../../../constants.mjs';
import GridRow from '../../common/GridRow';

const FONT_STYLES = [
  DEFAULT_FONT_STYLE,
  'Shadows Into Light',
  'Caveat Brush',
  'Beth Ellen',
  'Homemade Apple',
  'Gloria Hallelujah',
  'Rock Salt',
  'Satisfy',
  'Sacramento',
  'Rancho',
  'Kaushan Script',
  'Rouge Script',
];

const STYLES_PER_ROW = 3;
const NUM_ROWS = FONT_STYLES.length / STYLES_PER_ROW;

function PlayerFontStyleSetting(props) {
  const rows = range(NUM_ROWS).map(i => {
    const choices = range(STYLES_PER_ROW).map(j => {
      const index = (i * STYLES_PER_ROW) + j;
      const font = FONT_STYLES[index];
      let classes = 'hover-pointer font-sample';
      if (font === props.selectedStyle) {
        classes += ' font-sample-selected';
      }
      return (
        <Box key={j} className={classes} fontFamily={font} borderRadius="md" mb={3} mx={3} textAlign="center" title={font}
                  onClick={() => props.onChange(font)}>
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
      <GridItem colSpan={4}>
        {rows}
      </GridItem>
    </GridRow>
  );
}

export default PlayerFontStyleSetting;
