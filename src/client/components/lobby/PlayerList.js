import React from 'react';

function PlayerList(props) {
  const currentPlayers = Object.values(props.players || {});
  let players;
  if (currentPlayers.length) {
    players = currentPlayers.map(player => <li key={player.playerID} className="list-group-item">{player.name}</li>);
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
