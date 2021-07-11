import React from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { faChartLine, faDoorOpen, faEye, faHistory, faPen, faSignOutAlt, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { EventContext } from '../../../../utils.mjs';
import Icon from '../../common/Icon';
import Card from '../../common/card/Card';
import ConfirmAbandonGameDialog from './ConfirmAbandonGameDialog';

const CANNOT_SPECTATE_MESSAGE = 'You are not allowed to spectate right now.';

function PodiumMenu(props) {
  const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = React.useState(false);

  const handleSpectate = () => {
    if (props.allowSpectate) {
      props.startSpectating(props.gameState.roomID, props.player.playerID);
    }
  }

  const reassignRoomHost = () => props.reassignRoomHost(props.gameState.roomID, props.player.playerID);
  const kickPlayer = () => props.kickPlayer(props.gameState.roomID, props.player.playerID, 60);  /* TODO - pass in duration */

  let menuItems;
  if (props.isCurrentPlayer) {
    menuItems = [
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
    if (props.gameState.playerIsHost) {
      menuItems.push({
        icon: faDoorOpen,
        label: 'End Game',
        onClick: () => setIsConfirmDialogOpen(true),
      });
    } else if (props.gameState.playerIsOwner) {
      menuItems.push({
        icon: faUserTie,
        label: 'Become Host',
        onClick: reassignRoomHost,
      });
    }
  } else if (props.gameState.playerIsHost) {
    menuItems = [
      {
        icon: faUserTie,
        label: 'Make Host',
        onClick: reassignRoomHost,
      },
      {
        icon: faSignOutAlt,
        label: 'Kick',
        onClick: kickPlayer,
      },
    ];
  }

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
      <ConfirmAbandonGameDialog isOpen={isConfirmDialogOpen}
                                onClose={() => setIsConfirmDialogOpen(false)}
                                onConfirm={() => props.abandonGame(EventContext.fromProps(props))} />
    </Card>
  );
}

export default PodiumMenu;
