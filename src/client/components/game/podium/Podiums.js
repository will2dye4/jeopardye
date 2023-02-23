import React from 'react';
import { Flex } from '@chakra-ui/react';
import { MAX_PLAYERS_PER_GAME } from '../../../../constants.mjs';
import { comparePlayerNames } from '../../../../utils.mjs';
import Podium from './Podium';
import SpectatorsMenu from './SpectatorsMenu';

function getSize(numPlayers) {
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
  const numPlayers = Object.keys(props.players).length;
  const size = getSize(numPlayers);
  let allowSpectate = (!props.gameState.playerIsSpectating && numPlayers > 1);
  if (props.gameState.isFinalRound) {
    const finalRoundPlayers = Object.values(props.players).filter(player => player.score > 0).map(player => player.playerID);
    allowSpectate &= !(props.currentWager?.hasOwnProperty(props.playerID) || (finalRoundPlayers.length === 1 && finalRoundPlayers.pop() === props.playerID));
  } else {
    allowSpectate &= !props.gameState.playerHasControl;
  }
  const podiums = Object.values(props.players).sort(comparePlayerNames).map(player => {
    const isCurrentPlayer = (player.playerID === props.playerID);
    const isHost = (player.playerID === props.room?.hostPlayerID);
    const isChampion = (player.playerID === props.room?.currentChampion);
    let active;
    if (props.gameState.isFinalRound) {
      if (props.roundSummary || player.score <= 0) {
        active = false;
      } else if (props.playerAnswering) {
        active = (player.playerID === props.playerAnswering);
      } else if (props.activeClue?.played && !props.responseTimerElapsed) {
        active = !props.activeClue?.playersAttempted?.includes(player.playerID);
      } else {
        active = !props.currentWager?.hasOwnProperty(player.playerID);
      }
    } else {
      active = (player.playerID === props.playerAnswering);
    }
    return <Podium key={`${player.playerID}-${numPlayers}`}
                   player={player}
                   gameState={props.gameState}
                   modals={props.modals}
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
