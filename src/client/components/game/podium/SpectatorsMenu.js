import React from 'react';
import {
  Badge,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Icon from '../../common/Icon';
import PlayerList from '../../lobby/players/PlayerList';

function SpectatorsMenu(props) {
  const numSpectators = Object.keys(props.spectators).length;
  const spectating = props.gameState.playerIsSpectating;
  const title = (spectating ? 'You are spectating' : `${numSpectators} spectator${numSpectators > 1 ? 's' : ''}`);
  return (
    <Popover>
      <PopoverTrigger>
        <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={2} fontSize="lg"
               userSelect="none" position="fixed" bottom="5" right="5" zIndex="1000" title={title} className="hover-pointer">
          <HStack spacing="5px">
            <Icon id="spectators" icon={faEye} title={title} clickable={spectating} />
            <Text>{numSpectators}</Text>
          </HStack>
        </Badge>
      </PopoverTrigger>
      <PopoverContent p={0}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody p={0}>
          <PlayerList spectators={true} players={props.spectators} currentPlayerID={props.playerID}
                      edit={props.playerEditor.open} changeSpectatingStatus={props.stopSpectating}
                      mb={0} boxShadow="dark-lg" />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default SpectatorsMenu;
