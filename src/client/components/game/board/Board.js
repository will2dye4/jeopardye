import React from 'react';
import {CATEGORIES_PER_ROUND, CLUES_PER_CATEGORY} from '../../../../constants.mjs';
import Clue from './Clue';
import ActiveClue from './ActiveClue';

function Board(props) {
  let headingClasses = 'align-items-center border border-2 category-heading col d-flex fw-bold justify-content-center ' +
    'p-3 text-center text-uppercase user-select-none';
  let headings;
  if (props.gameState.categories) {
    headings = Object.values(props.gameState.categories).map(category => {
      let classes = headingClasses;
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
        let words = name.split(' ');
        let meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

        if (name.length > 30 || meanLength > 7 || (words.length > 3 && meanLength > 4)) {
          classes += ' small-heading';
        }
      }
      return <div key={category.categoryID} className={classes}>{name}</div>;
    });
  } else {
    headings = [...Array(CATEGORIES_PER_ROUND).keys()].map(i => <div key={i} className={headingClasses}><br /></div>);
  }
  const rows = [...Array(CLUES_PER_CATEGORY).keys()].map(i => {
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
  });
  let content = [
    <div key="headings" className="row row-cols-6">{headings}</div>,
    ...rows,
  ];
  if (props.showActiveClue && props.activeClue) {
    content.push(<ActiveClue key="current-clue"
                             gameID={props.gameState.gameID}
                             playerID={props.gameState.playerID}
                             clue={props.activeClue}
                             showAnimation={props.showClueAnimation}
                             showDailyDouble={props.showDailyDouble}
                             allowAnswers={props.allowAnswers}
                             reveal={props.revealAnswer}
                             timerRef={props.timerRef}
                             buzzIn={props.buzzIn}
                             dismiss={props.dismissActiveClue}
                             skipActiveClue={props.skipActiveClue} />);
  }
  return <div id="board" className="position-relative">{content}</div>;
}

export default Board;
