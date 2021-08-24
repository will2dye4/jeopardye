import React from 'react';
import { Flex, ListItem, Spacer, Text } from '@chakra-ui/react';
import { faCrown, faUserTie } from '@fortawesome/free-solid-svg-icons';
import PlayerListItemIcons from './PlayerListItemIcons';
import Icon from '../Icon';

function PlayerListItem(props) {
  return (
    <ListItem className="list-group-item">
      <Flex align="center">
        <Text cursor="default">
          {props.player.name}
          {props.isHost && <Text as="span" color="purple.500" ml={3}><Icon id="host-icon" icon={faUserTie} title="Host" clickable={false} /></Text>}
          {props.isChampion && <Text as="span" color="jeopardyeYellow.500" ml={3}><Icon id="champion-icon" icon={faCrown} title="Champion" clickable={false} /></Text>}
        </Text>
        <Spacer minW={10} />
        {(props.isCurrentPlayer || props.currentPlayerIsHost) && <PlayerListItemIcons {...props} />}
      </Flex>
    </ListItem>
  );
}

export default PlayerListItem;
