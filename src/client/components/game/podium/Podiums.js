import React from 'react';
import { Flex } from '@chakra-ui/react';
import Podium from './Podium';

function Podiums(props) {
  const podiums = Object.values(props.players).map(player => {
    const active = (player.playerID === props.playerAnswering);
    return <Podium key={player.playerID} name={player.name} score={player.score || 0}
                   preferredFontStyle={player.preferredFontStyle} active={active} />
  });
  return (
    <Flex className="podium-container" justify="center">
      {podiums}
    </Flex>
  );
}

export default Podiums;
