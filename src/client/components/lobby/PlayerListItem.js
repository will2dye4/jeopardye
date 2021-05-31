import React from 'react';
import { Flex, Spacer, Text } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

function PlayerListItem(props) {
  return (
    <li className="list-group-item">
      <Flex align="center">
        <Text>{props.player.name}</Text>
        <Spacer />
        {props.isCurrentPlayer && <FontAwesomeIcon id='edit-player' icon={faPen} title="Edit" className="hover-pointer hover-blue" onClick={props.edit} />}
      </Flex>
    </li>
  );
}

export default PlayerListItem;
