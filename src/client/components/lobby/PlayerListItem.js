import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

function PlayerListItem(props) {
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col col-10">
          {props.player.name}
        </div>
        <div className="col">
          {props.isCurrentPlayer && <FontAwesomeIcon id='edit-player' icon={faPen} title="Edit" className="hover-pointer hover-blue" onClick={props.edit} />}
        </div>
      </div>
    </li>
  );
}

export default PlayerListItem;
