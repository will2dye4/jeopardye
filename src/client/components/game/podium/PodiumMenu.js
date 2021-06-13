import React from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { faChartLine, faEye, faHistory, faPen } from '@fortawesome/free-solid-svg-icons';
import Icon from '../../common/Icon';
import Card from '../../common/card/Card';

const CANNOT_SPECTATE_MESSAGE = 'You are not allowed to spectate right now.';

function PodiumMenu(props) {
  const handleSpectate = () => {
    if (props.allowSpectate) {
      props.startSpectating(props.player.playerID);
    }
  }

  const menuItems = [
    {
      icon: faPen,
      label: 'Settings',
      onClick: props.playerEditor.open,
    },
    {
      icon: faChartLine,
      label: 'Statistics',
      onClick: props.playerStats.open,
    },
    {
      icon: faHistory,
      label: 'History',
      onClick: props.gameHistory.open,
    },
    {
      icon: faEye,
      disabled: !props.allowSpectate,
      label: 'Spectate',
      onClick: handleSpectate,
      title: (props.allowSpectate ? null : CANNOT_SPECTATE_MESSAGE),
    },
  ];

  return (
    <Card mb={0} boxShadow="dark-lg" className="popover-card">
      <ul className="list-group">
        {menuItems.map(item => {
          const key = item.label.toLowerCase();
          let classes = 'list-group-item';
          if (item.disabled) {
            classes += ' menu-item-disabled';
          } else {
            classes += ' hover-pointer list-group-menu-item';
          }
          return (
            <li key={key} className={classes} onClick={item.onClick} title={item.title}>
              <Flex align="center" pr={6} userSelect="none">
                <Icon id={`${key}-menu-item-icon`} icon={item.icon} clickable={!item.disabled} />
                <Text ml={3}>{item.label}</Text>
              </Flex>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default PodiumMenu;
