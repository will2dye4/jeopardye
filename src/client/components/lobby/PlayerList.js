import React from 'react';
import PlayerListItem from './PlayerListItem';

function PlayerList(props) {
  const currentPlayers = Object.values(props.players || {});
  let players;
  if (currentPlayers.length) {
    players = currentPlayers.map(player => <PlayerListItem key={player.playerID} player={player} edit={props.edit}
                                                           isCurrentPlayer={player.playerID === props.currentPlayerID} />);
  } else {
    players = <li key="empty" className="list-group-item empty-list">No {props.listType}</li>;
  }
  return (
    <div className="card player-list mb-3">
      <div className="card-header fw-bold text-center">{props.listType}</div>
      <ul className="list-group list-group-flush">
        {players}
      </ul>
    </div>
  );
}

export default PlayerList;
