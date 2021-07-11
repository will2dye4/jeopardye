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
    players = currentPlayers.map(player => {
      const playerProps = {
        changeSpectatingStatus: props.changeSpectatingStatus,
        changeHost: () => props.reassignRoomHost(props.room?.roomID, player.playerID),
        currentPlayerIsHost: (props.currentPlayerID === props.room?.hostPlayerID),
        edit: props.edit,
        isChampion: (player.playerID === props.room?.currentChampion),
        isCurrentPlayer: (player.playerID === props.currentPlayerID),
        isHost: (player.playerID === props.room?.hostPlayerID),
        isOwner: (player.playerID === props.room?.ownerPlayerID),
        isSpectator: props.spectators,
        kickPlayer: () => props.kickPlayer(props.room?.roomID, player.playerID, 60),  /* TODO - pass in duration */
        player: player,
      };
      return <PlayerListItem key={player.playerID} {...playerProps} />;
    });
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
