import React from 'react';
import CategoryHeadings from './category/CategoryHeadings';
import ClueGrid from './clue/ClueGrid';
import ActiveClue from './clue/ActiveClue';

function Board(props) {
  return (
    <div id="board" className="position-relative">
      <CategoryHeadings {...props} />
      <ClueGrid {...props} />
      {(props.showActiveClue && props.activeClue) && <ActiveClue {...props} />}
    </div>
  );
}

export default Board;
