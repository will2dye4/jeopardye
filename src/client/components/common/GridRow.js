import React from 'react';
import { Grid } from '@chakra-ui/react';

const DEFAULT_NUM_COLUMNS = 12;

function GridRow(props) {
  const numColumns = props.columns || props.cols || DEFAULT_NUM_COLUMNS;
  const templateColumns = `repeat(${numColumns}, 1fr)`;
  return (
    <Grid templateColumns={templateColumns} templateRows="repeat(1, 1fr)" {...props}>
      {props.children}
    </Grid>
  );
}

export default GridRow;
