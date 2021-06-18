import React from 'react';
import PlayerList from '../common/players/PlayerList';

function PlayerLists(props) {
  const startSpectating = (playerID) => props.startSpectating(props.roomID, playerID);
  const stopSpectating = (props.allowJoin ? (playerID) => props.stopSpectating(props.roomID, playerID, props.gameState?.gameID) : null);
  return (
    <React.Fragment>
      <PlayerList spectators={false} players={props.players} currentPlayerID={props.playerID} room={props.room}
                  edit={props.playerEditor.open} changeSpectatingStatus={startSpectating} />
      <PlayerList spectators={true} players={props.spectators} currentPlayerID={props.playerID} room={props.room}
                  edit={props.playerEditor.open} changeSpectatingStatus={stopSpectating} />
    </React.Fragment>
  );
}

export default PlayerLists;
