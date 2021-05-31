import React from 'react';
import Card from '../common/card/Card';
import CardHeader from '../common/card/CardHeader';
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
    <Card className="player-list" mb={5}>
      <CardHeader>{props.listType}</CardHeader>
      <ul className="list-group">
        {players}
      </ul>
    </Card>
  );
}

export default PlayerList;
