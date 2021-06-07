import React from 'react';
import { HStack } from '@chakra-ui/react';
import { faEye, faPen, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import Icon from '../Icon';

function getSpectatingStateIcon(props) {
  if (!props.changeSpectatingStatus) {
    return null;
  }
  let iconProps;
  if (props.isSpectator) {
    iconProps = {
      id: 'stop-spectating',
      icon: faUserPlus,
      title: 'Join Game',
    };
  } else {
    iconProps = {
      id: 'start-spectating',
      icon: faEye,
      title: 'Spectate',
    };
  }
  return <Icon className="hover-blue" onClick={() => props.changeSpectatingStatus(props.player.playerID)} {...iconProps} />;
}

function PlayerListItemIcons(props) {
  return (
    <HStack spacing="15px">
      {getSpectatingStateIcon(props)}
      <Icon className="hover-blue" id="edit-player" icon={faPen} title="Edit" onClick={props.edit} />
    </HStack>
  );
}

export default PlayerListItemIcons;
