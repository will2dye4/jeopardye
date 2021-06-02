import React from 'react';
import { Flex } from '@chakra-ui/react';
import Podium from './Podium';

function Podiums(props) {
  const podiums = Object.values(props.players).map(player => {
    let onClick;
    if (player.playerID === props.playerID) {
      onClick = props.playerEditor.open;
    }
    const active = (player.playerID === props.playerAnswering);
    return <Podium key={player.playerID} name={player.name} score={player.score || 0} onClick={onClick}
                   preferredFontStyle={player.preferredFontStyle} active={active} />
  });
  return (
    <Flex className="podium-container" justify="center">
      {podiums}
    </Flex>
  );
}

export default Podiums;
