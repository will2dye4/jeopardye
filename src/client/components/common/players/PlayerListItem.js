import React from 'react';
import { Flex, ListItem, Spacer, Text } from '@chakra-ui/react';
import PlayerListItemIcons from './PlayerListItemIcons';

function PlayerListItem(props) {
  return (
    <ListItem className="list-group-item">
      <Flex align="center">
        <Text cursor="default">{props.player.name}</Text>
        <Spacer minW={10} />
        {props.isCurrentPlayer && <PlayerListItemIcons {...props} />}
      </Flex>
    </ListItem>
  );
}

export default PlayerListItem;
