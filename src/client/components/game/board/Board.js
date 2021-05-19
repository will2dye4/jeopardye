import React from 'react';
import { CATEGORIES_PER_ROUND, CLUES_PER_CATEGORY } from '../../../../constants.mjs';
import Clue from './Clue';
import ActiveClue from './ActiveClue';

const CATEGORY_HEADING_CLASSES = ('align-items-center border border-2 category-heading col d-flex fw-bold ' +
                                  'justify-content-center p-3 text-center text-uppercase user-select-none');

function getHeadingElement(key, categoryName, small = false) {
  let classes = CATEGORY_HEADING_CLASSES;
  if (small) {
    classes += ' small-heading';
  }
  if (!categoryName) {
    categoryName = <br />;
  }
  return <div key={key} className={classes}>{categoryName}</div>;
}

function categoryToHeading(category) {
  let small = false;
  let finished = true;
  category.clues.forEach(clue => {
    if (!clue.played) {
      finished = false;
    }
  });
  let name;
  if (finished) {
    name = <br />;
  } else {
    name = category.name;
    const words = name.split(' ');
    const meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    small = (name.length > 30 || meanLength > 7 || (words.length > 3 && meanLength > 4));
  }
  return getHeadingElement(category.categoryID, name, small);
}

function indexToRowOfCells(props, i) {
  let cells;
  if (props.gameState.categories) {
    cells = Object.values(props.gameState.categories).map(category => {
      const clue = {...category.clues[i], category: category.name};
      return <Clue key={clue.clueID} clue={clue} onClick={() => props.handleClueClick(clue)} />;
    });
  } else {
    cells = [...Array(CATEGORIES_PER_ROUND).keys()].map(j => <Clue key={`${i},${j}`} clue={{}} />)
  }
  return <div key={i} className="row row-cols-6">{cells}</div>;
}

function Board(props) {
  let headings;
  if (props.gameState.categories) {
    headings = Object.values(props.gameState.categories).map(categoryToHeading);
  } else {
    headings = [...Array(CATEGORIES_PER_ROUND).keys()].map(i => getHeadingElement(i));
  }
  const rows = [...Array(CLUES_PER_CATEGORY).keys()].map(i => indexToRowOfCells(props, i));
  let content = [
    <div key="headings" className="row row-cols-6">{headings}</div>,
    ...rows,
  ];
  if (props.showActiveClue && props.activeClue) {
    content.push(<ActiveClue key="active-clue" {...props} />);
  }
  return <div id="board" className="position-relative">{content}</div>;
}

export default Board;
