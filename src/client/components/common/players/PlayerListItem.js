import React from 'react';
import { Flex, Spacer, Text } from '@chakra-ui/react';
import PlayerListItemIcons from './PlayerListItemIcons';

function PlayerListItem(props) {
  return (
    <li className="list-group-item">
      <Flex align="center">
        <Text cursor="default">{props.player.name}</Text>
        <Spacer minW={10} />
        {props.isCurrentPlayer && <PlayerListItemIcons {...props} />}
      </Flex>
    </li>
  );
}

export default PlayerListItem;
