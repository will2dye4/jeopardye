import React from 'react';
import { Flex, Spacer, Text } from '@chakra-ui/react';
import PlayerListItemIcons from './PlayerListItemIcons';

function PlayerListItem(props) {
  return (
    <li className="list-group-item">
      <Flex align="center">
        <Text>{props.player.name}</Text>
        <Spacer />
        {props.isCurrentPlayer && <PlayerListItemIcons {...props} />}
      </Flex>
    </li>
  );
}

export default PlayerListItem;
