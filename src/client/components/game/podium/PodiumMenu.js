import React from 'react';
import { Flex, Text } from '@chakra-ui/react';
import {
  faChartLine,
  faDoorOpen,
  faEye,
  faHistory,
  faPen,
  faSignOutAlt,
  faTools,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { EventContext } from '../../../../utils.mjs';
import Icon from '../../common/Icon';
import Card from '../../common/card/Card';
import ConfirmLeaveGameDialog from './ConfirmLeaveGameDialog';

const CANNOT_SPECTATE_MESSAGE = 'You are not allowed to spectate right now.';

function PodiumMenu(props) {
  const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = React.useState(false);

  const handleSpectate = () => {
    if (props.allowSpectate) {
      props.startSpectating(props.gameState.roomID, props.player.playerID);
    }
  }

  const reassignRoomHost = () => props.reassignRoomHost(props.gameState.roomID, props.player.playerID);
  const kickPlayer = () => props.modals.kickPlayerDialog.open(props.player.playerID);

  let menuItems;
  let onConfirm;
  if (props.isCurrentPlayer) {
    menuItems = [
      {
        icon: faPen,
        label: 'Settings',
        onClick: props.modals.playerEditor.open,
      },
      {
        icon: faChartLine,
        label: 'Statistics',
        onClick: props.modals.playerStats.open,
      },
      {
        icon: faHistory,
        label: 'History',
        onClick: props.modals.gameHistory.open,
      },
      {
        icon: faEye,
        disabled: !props.allowSpectate,
        label: 'Spectate',
        onClick: handleSpectate,
        title: (props.allowSpectate ? null : CANNOT_SPECTATE_MESSAGE),
      },
    ];
    if (props.gameState.playerIsAdmin) {
      menuItems.push({
        icon: faTools,
        label: 'Dashboard',
        onClick: props.modals.adminDashboard.open,
      });
    }
    if (props.gameState.playerIsHost) {
      menuItems.push({
        icon: faDoorOpen,
        label: 'End Game',
        onClick: () => setIsConfirmDialogOpen(true),
      });
      onConfirm = () => props.abandonGame(EventContext.fromProps(props));
    } else {
      if (props.gameState.playerIsOwner) {
        menuItems.push({
          icon: faUserTie,
          label: 'Become Host',
          onClick: reassignRoomHost,
        });
      }
      menuItems.push({
        icon: faDoorOpen,
        label: 'Leave Game',
        onClick: () => setIsConfirmDialogOpen(true),
      });
      onConfirm = () => props.leaveRoom(props.player.playerID, props.gameState.roomID);
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
      <ConfirmLeaveGameDialog abandon={props.gameState.playerIsHost} isOpen={isConfirmDialogOpen} gameID={props.gameState.gameID}
                              onClose={() => setIsConfirmDialogOpen(false)} onConfirm={onConfirm} />
    </Card>
  );
}

export default PodiumMenu;
