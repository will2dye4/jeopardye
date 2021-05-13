import React from 'react';
import { CLUES_PER_CATEGORY } from '../../../../constants.mjs';
import Clue from './Clue';
import ActiveClue from './ActiveClue';

function Board(props) {
  const headings = Object.values(props.categories).map(category => {
    let classes = 'align-items-center border border-2 category-heading col d-flex fw-bold justify-content-center p-3 ' +
      'text-center text-uppercase user-select-none';
    let name = category.name;
    let words = name.split(' ');
    let meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (name.length > 30 || meanLength > 7 || (words.length > 3 && meanLength > 4)) {
      classes += ' small-heading';
    }
    return <div key={name} className={classes}>{name}</div>;
  });
  const rows = [...Array(CLUES_PER_CATEGORY).keys()].map(i => {
    const cells = Object.entries(props.categories).map(([id, category]) => {
      const clue = {...category.clues[i], category: category.name, categoryID: id};
      const played = props.playedClues.indexOf(clue.clueID) !== -1;
      return <Clue key={clue.clueID} clue={clue} played={played} onClick={() => props.handleClueClick(clue)} />;
    });
    return <div key={i} className="row row-cols-6">{cells}</div>;
  });
  let content = [
    <div key="headings" className="row row-cols-6">{headings}</div>,
    ...rows,
  ];
  if (props.showActiveClue && props.activeClue) {
    content.push(<ActiveClue key="current-clue"
                             gameID={props.gameID}
                             clue={props.activeClue}
                             playerAnswering={props.playerAnswering}
                             allowAnswers={props.allowAnswers}
                             reveal={props.revealAnswer}
                             timerRef={props.timerRef}
                             buzzIn={props.buzzIn}
                             dismiss={props.dismissActiveClue} />);
  }
  return <div id="board" className="position-relative">{content}</div>;
}

export default Board;
