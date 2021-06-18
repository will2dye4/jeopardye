import React from 'react';
import { HStack } from '@chakra-ui/react';
import { faEye, faPen, faUserPlus, faUserTie } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../ActionIcon';

function getClaimHostIcon(props) {
  if (!props.isOwner || props.isHost) {
    return null;
  }
  const iconProps = {
    id: 'change-host-icon',
    icon: faUserTie,
    title: 'Become host',
    onClick: () => props.changeHost(props.player.playerID),
  };
  return <ActionIcon {...iconProps} />;
}

function getSpectatingStateIcon(props) {
  if (!props.changeSpectatingStatus) {
    return null;
  }
  let iconProps;
  if (props.isSpectator) {
    iconProps = {
      id: 'stop-spectating',
      icon: faUserPlus,
      title: 'Join game',
    };
  } else {
    iconProps = {
      id: 'start-spectating',
      icon: faEye,
      title: 'Spectate',
    };
  }
  return <ActionIcon onClick={() => props.changeSpectatingStatus(props.player.playerID)} {...iconProps} />;
}

function PlayerListItemIcons(props) {
  return (
    <HStack spacing="15px">
      {getClaimHostIcon(props)}
      {getSpectatingStateIcon(props)}
      <ActionIcon id="edit-player" icon={faPen} title="Edit" onClick={props.edit} />
    </HStack>
  );
}

export default PlayerListItemIcons;
