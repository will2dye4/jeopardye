import React from 'react';

function Podium(props) {
  let score = props.score.toLocaleString();
  let scoreClasses = 'py-2 podium-score';
  if (props.score < 0) {
    score = '-$' + score.substring(1);
    scoreClasses += ' podium-score-negative';
  } else {
    score = '$' + score;
  }
  let indicatorClasses = 'podium-indicator';
  if (props.active) {
    indicatorClasses += ' podium-indicator-active';
  }
  return (
    <div className="mb-2 mx-4 podium row text-center user-select-none">
      <div className="col-2 podium-side podium-left-side">
        <div className="podium-stripe" />
        <div className="podium-stripe" />
      </div>
      <div className="col-4 podium-center">
        <div className={scoreClasses}>{score}</div>
        <div className={indicatorClasses} />
        <div className="py-1 podium-name">{props.name}</div>
        <div className={indicatorClasses + ' mb-1'} />
      </div>
      <div className="col-2 podium-side podium-right-side">
        <div className="podium-stripe" />
        <div className="podium-stripe" />
      </div>
    </div>
  );
}

export default Podium;
