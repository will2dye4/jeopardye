import React from 'react';

function GameSetting(props) {
  return (
    <div className="row my-5">
      <div className="col col-4 my-1">
        <div className="form-label fw-bold">{props.label}</div>
      </div>
      <div className="col">
        {props.children}
      </div>
    </div>
  );
}

export default GameSetting;
