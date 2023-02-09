import React from 'react';
import { HStack } from '@chakra-ui/react';
import { faEye, faPen, faPersonArrowUpFromLine, faSignOutAlt, faUserTie } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../ActionIcon';

function getClaimHostIcon(props) {
  if (!props.isOwner || props.isHost) {
    return null;
  }
  const iconProps = {
    id: 'become-host-icon',
    icon: faUserTie,
    title: 'Become host',
    onClick: props.changeHost,
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
      icon: faPersonArrowUpFromLine,
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
  if (props.isCurrentPlayer) {
    return (
      <HStack spacing="15px">
        {getClaimHostIcon(props)}
        {getSpectatingStateIcon(props)}
        <ActionIcon id="edit-player" icon={faPen} title="Edit" onClick={props.edit} />
      </HStack>
    );
  }
  if (props.currentPlayerIsHost) {
    return (
      <HStack spacing="15px">
        <ActionIcon id="make-host-icon" icon={faUserTie} title="Make host" onClick={props.changeHost} />
        <ActionIcon id="kick-icon" icon={faSignOutAlt} title="Kick" onClick={props.kickPlayer} />
      </HStack>
    );
  }
  return null;
}

export default PlayerListItemIcons;
