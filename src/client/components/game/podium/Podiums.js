import React from 'react';
import { Flex } from '@chakra-ui/react';
import Podium from './Podium';
import SpectatorsMenu from './SpectatorsMenu';

function getSize(players) {
  const numPlayers = Object.keys(players).length;
  if (numPlayers >= 6) {
    return 'xs';
  } else if (numPlayers === 5) {
    return 'sm';
  } else if (numPlayers === 4) {
    return 'md';
  }
  return 'lg';
}

function Podiums(props) {
  const size = getSize(props.players);
  const podiums = Object.values(props.players).map(player => {
    let onClick;
    if (player.playerID === props.playerID) {
      onClick = props.playerEditor.open;
    }
    const active = (player.playerID === props.playerAnswering);
    return <Podium key={player.playerID} player={player} onClick={onClick} active={active} size={size} />;
  });
  return (
    <Flex className="podium-container" justify="center">
      {podiums}
      {Object.keys(props.spectators).length > 0 && <SpectatorsMenu {...props} />}
    </Flex>
  );
}

export default Podiums;
