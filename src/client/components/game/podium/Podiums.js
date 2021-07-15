import React from 'react';
import { Flex } from '@chakra-ui/react';
import { MAX_PLAYERS_PER_GAME } from '../../../../constants.mjs';
import Podium from './Podium';
import SpectatorsMenu from './SpectatorsMenu';

function getSize(players) {
  const numPlayers = Object.keys(players).length;
  if (numPlayers >= MAX_PLAYERS_PER_GAME) {
    return 'xs';
  } else if (numPlayers === MAX_PLAYERS_PER_GAME - 1) {
    return 'sm';
  } else if (numPlayers === MAX_PLAYERS_PER_GAME - 2) {
    return 'md';
  }
  return 'lg';
}

function Podiums(props) {
  const size = getSize(props.players);
  const allowSpectate = (!props.gameState.playerIsSpectating && !props.gameState.playerHasControl && Object.keys(props.players).length > 1);
  const podiums = Object.values(props.players).map(player => {
    const isCurrentPlayer = (player.playerID === props.playerID);
    const isHost = (player.playerID === props.room?.hostPlayerID);
    const isChampion = (player.playerID === props.room?.currentChampion);
    const active = (player.playerID === props.playerAnswering);
    return <Podium key={`${player.playerID}-${Object.keys(props.players).length}`}
                   player={player}
                   gameState={props.gameState}
                   gameHistory={props.gameHistory}
                   kickPlayerDialog={props.kickPlayerDialog}
                   playerEditor={props.playerEditor}
                   playerStats={props.playerStats}
                   isCurrentPlayer={isCurrentPlayer}
                   isHost={isHost}
                   isChampion={isChampion}
                   allowSpectate={allowSpectate}
                   startSpectating={props.startSpectating}
                   abandonGame={props.abandonGame}
                   leaveRoom={props.leaveRoom}
                   reassignRoomHost={props.reassignRoomHost}
                   active={active}
                   size={size} />;
  });
  return (
    <Flex className="podium-container" justify="center">
      {podiums}
      {Object.keys(props.spectators).length > 0 && <SpectatorsMenu {...props} />}
    </Flex>
  );
}

export default Podiums;
