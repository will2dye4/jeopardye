import React from 'react';
import { CATEGORIES_PER_ROUND, CLUES_PER_CATEGORY } from '../../../../../constants.mjs';
import { range } from '../../../../../utils.mjs';
import Clue from './Clue';

function ClueGrid(props) {
  return range(CLUES_PER_CATEGORY).map(i => {
    let cells;
    if (props.gameState.categories) {
      cells = Object.values(props.gameState.categories).map(category => {
        const clue = {...category.clues[i], category: category.name};
        return <Clue key={clue.clueID} clue={clue} onClick={() => props.handleClueClick(clue)} />;
      });
    } else {
      cells = range(CATEGORIES_PER_ROUND).map(j => <Clue key={`${i},${j}`} clue={{}} />)
    }
    return <div key={i} className="row row-cols-6">{cells}</div>;
  });
}

export default ClueGrid;
