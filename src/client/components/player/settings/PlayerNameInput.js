import React from 'react';
import { MAX_PLAYER_NAME_LENGTH, PLACEHOLDER_PLAYER_NAME } from '../../../../constants.mjs';

function PlayerNameInput(props) {
  let inputClasses = 'form-control form-control-lg w-75';
  if (props.invalid) {
    inputClasses += ' is-invalid';
  }
  return (
    <div className="row my-5">
      <div className="col col-2 my-1">
        <div className="form-label fw-bold mb-0">Name</div>
        <div className="fs-6 fst-italic">max {MAX_PLAYER_NAME_LENGTH} characters</div>
      </div>
      <div className="col">
        <input type="text" placeholder={PLACEHOLDER_PLAYER_NAME} value={props.name} aria-label="player-name"
               className={inputClasses} autoFocus={true} onChange={props.onChange} />
      </div>
    </div>
  );
}

export default PlayerNameInput;
