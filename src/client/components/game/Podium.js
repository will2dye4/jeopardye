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
  let nameClasses = 'podium-name my-2 py-2 rounded';
  if (props.active) {
    nameClasses += ' podium-name-active';
  }
  return (
    <div className="mb-2 mx-4 podium row text-center user-select-none">
      <div className="col-2 podium-side podium-left-side">
        <div className="podium-stripe" />
        <div className="podium-stripe" />
      </div>
      <div className="col-4 podium-center">
        <div className={scoreClasses}>{score}</div>
        <div className={nameClasses}>{props.name}</div>
      </div>
      <div className="col-2 podium-side podium-right-side">
        <div className="podium-stripe" />
        <div className="podium-stripe" />
      </div>
    </div>
  );
}

export default Podium;
