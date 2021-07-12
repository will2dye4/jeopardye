import React from 'react';
import PlayerList from '../common/players/PlayerList';

function PlayerLists(props) {
  const startSpectating = (playerID) => props.startSpectating(props.roomID, playerID);
  const stopSpectating = (props.allowJoin ? (playerID) => props.stopSpectating(props.roomID, playerID, props.gameState?.gameID) : null);
  const listProps = {
    currentPlayerID: props.playerID,
    edit: props.playerEditor.open,
    kickPlayerDialog: props.kickPlayerDialog,
    reassignRoomHost: props.reassignRoomHost,
    room: props.room,
  };
  return (
    <React.Fragment>
      <PlayerList spectators={false} players={props.players} changeSpectatingStatus={startSpectating} {...listProps} />
      <PlayerList spectators={true} players={props.spectators} changeSpectatingStatus={stopSpectating} {...listProps} />
    </React.Fragment>
  );
}

export default PlayerLists;
