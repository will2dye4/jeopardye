import React from 'react';
import { List, ListItem } from '@chakra-ui/react';
import Card from '../card/Card';
import CardHeader from '../card/CardHeader';
import PlayerListItem from './PlayerListItem';

function PlayerList(props) {
  const currentPlayers = Object.values(props.players || {});
  const listType = (props.spectators ? 'Spectators' : 'Players');
  let players;
  if (currentPlayers.length) {
    players = currentPlayers.map(player => <PlayerListItem key={player.playerID} player={player} edit={props.edit}
                                                           isCurrentPlayer={player.playerID === props.currentPlayerID}
                                                           isSpectator={props.spectators}
                                                           changeSpectatingStatus={props.changeSpectatingStatus} />);
  } else {
    players = <ListItem key="empty" className="list-group-item empty-list">No {listType}</ListItem>;
  }
  return (
    <Card className="player-list" mb={props.mb ?? 5} boxShadow={props.boxShadow}>
      <CardHeader>{listType}</CardHeader>
      <List className="list-group">
        {players}
        {props.children}
      </List>
    </Card>
  );
}

export default PlayerList;
