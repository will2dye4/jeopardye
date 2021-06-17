import React from 'react';
import PlayerList from '../common/players/PlayerList';

function PlayerLists(props) {
  const stopSpectating = (props.allowJoin ? (playerID) => props.stopSpectating(props.roomID, playerID, props.gameState?.gameID) : null);
  return (
    <React.Fragment>
      <PlayerList spectators={false} players={props.players} currentPlayerID={props.playerID}
                  edit={props.playerEditor.open} changeSpectatingStatus={props.startSpectating} />
      <PlayerList spectators={true} players={props.spectators} currentPlayerID={props.playerID}
                  edit={props.playerEditor.open} changeSpectatingStatus={stopSpectating} />
    </React.Fragment>
  );
}

export default PlayerLists;
