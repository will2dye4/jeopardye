import React from 'react';
import {
  Badge,
  Flex,
  HStack,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react';
import { faChartLine, faDoorOpen, faEye, faHistory } from '@fortawesome/free-solid-svg-icons';
import { EventContext } from '../../../../utils.mjs';
import ActionIcon from '../../common/ActionIcon';
import Icon from '../../common/Icon';
import PlayerList from '../../common/players/PlayerList';
import ConfirmLeaveGameDialog from './ConfirmLeaveGameDialog';

function SpectatorsMenu(props) {
  const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = React.useState(false);
  const onConfirm = (props.gameState.playerIsHost ?
    () => props.abandonGame(EventContext.fromProps(props)) :
    () => props.leaveRoom(props.playerID, props.gameState.roomID));

  let buttonIcons = [
    {
      id: 'spectator-history-icon',
      title: 'Show game history',
      icon: faHistory,
      onClick: props.modals.gameHistory.open,
    },
    {
      id: 'spectator-stats-icon',
      title: 'Show player statistics',
      icon: faChartLine,
      onClick: props.modals.playerStats.open,
    },
    {
      id: (props.gameState.playerIsHost ? 'end-game-icon' : 'leave-game-icon'),
      title: (props.gameState.playerIsHost ? 'End game' : 'Leave game'),
      icon: faDoorOpen,
      onClick: () => setIsConfirmDialogOpen(true),
    },
  ];

  const numSpectators = Object.keys(props.spectators).length;
  const spectating = props.gameState.playerIsSpectating;
  const title = (spectating ? 'You are spectating' : `${numSpectators} spectator${numSpectators > 1 ? 's' : ''}`);
  const stopSpectating = (props.allowJoin ? (playerID) => props.stopSpectating(props.gameState.roomID, playerID, props.gameState.gameID) : null);
  return (
    <Popover>
      <PopoverTrigger>
        <Badge variant="solid" bg="white" color="jeopardyBlue.500" borderRadius="full" boxShadow="dark-lg" px={2} py={1} fontSize="lg"
               userSelect="none" position="fixed" bottom="5" right="5" zIndex="1000" title={title} className="hover-pointer hover-yellow">
          <HStack spacing="5px">
            <Icon id="spectators" icon={faEye} title={title} clickable={spectating} />
            <Text>{numSpectators}</Text>
          </HStack>
        </Badge>
      </PopoverTrigger>
      <PopoverContent p={0} w="auto" minW={200}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody p={0}>
          <PlayerList spectators={true} players={props.spectators} currentPlayerID={props.playerID}
                      mb={0} boxShadow="dark-lg" changeSpectatingStatus={stopSpectating} modals={props.modals}
                      reassignRoomHost={props.reassignRoomHost} room={props.room}>
            {spectating && (
              <ListItem key="buttons" className="list-group-item">
                <Flex justify="center">
                  <HStack spacing={8}>
                    {buttonIcons.map(iconConfig => <Text key={iconConfig.id} fontSize="3xl"><ActionIcon {...iconConfig} /></Text>)}
                  </HStack>
                </Flex>
              </ListItem>
            )}
          </PlayerList>
        </PopoverBody>
        <ConfirmLeaveGameDialog abandon={props.gameState.playerIsHost} isOpen={isConfirmDialogOpen} gameID={props.gameState.gameID}
                                onClose={() => setIsConfirmDialogOpen(false)} onConfirm={onConfirm} />
      </PopoverContent>
    </Popover>
  );
}

export default SpectatorsMenu;
