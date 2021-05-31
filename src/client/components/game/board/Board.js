import React from 'react';
import { Box } from '@chakra-ui/react';
import CategoryHeadings from './category/CategoryHeadings';
import ClueGrid from './clue/ClueGrid';
import ActiveClue from './clue/ActiveClue';

function Board(props) {
  return (
    <Box id="board" position="relative">
      <CategoryHeadings {...props} />
      <ClueGrid {...props} />
      {(props.showActiveClue && props.activeClue) && <ActiveClue {...props} />}
    </Box>
  );
}

export default Board;
