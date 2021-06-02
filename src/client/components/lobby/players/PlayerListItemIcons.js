import React from 'react';
import { HStack } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faUserPlus } from '@fortawesome/free-solid-svg-icons';

function getIconElement(config) {
  return <FontAwesomeIcon id={config.id} icon={config.icon} title={config.title} className="hover-pointer hover-blue"
                          onClick={config.onClick} />;
}

function getSpectatingStateIcon(props) {
  let iconConfig;
  if (props.isSpectator) {
    iconConfig = {
      id: 'stop-spectating',
      icon: faUserPlus,
      title: 'Join Game',
    };
  } else {
    iconConfig = {
      id: 'start-spectating',
      icon: faEye,
      title: 'Spectate',
    };
  }
  iconConfig.onClick = () => props.changeSpectatingStatus(props.player.playerID);
  return getIconElement(iconConfig);
}

function PlayerListItemIcons(props) {
  return (
    <HStack>
      {getSpectatingStateIcon(props)}
      {getIconElement({id: 'edit-player', icon: faPen, title: 'Edit', onClick: props.edit})}
    </HStack>
  )
}

export default PlayerListItemIcons;
