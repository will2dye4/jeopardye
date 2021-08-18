import React from 'react';
import { Flex, HStack } from '@chakra-ui/react';
import { faArrowLeft, faArrowRight, faCompressAlt, faExpandAlt, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../../common/ActionIcon';

function GameHistoryButtons(props) {
  const expandButton = {
    id: 'expand-history-icon',
    title: 'Make history ' + (props.modals.gameHistory.size === 'xs' ? 'bigger' : 'smaller'),
    icon: (props.modals.gameHistory.size === 'xs' ? faExpandAlt : faCompressAlt),
    onClick: props.modals.gameHistory.toggleSize,
  };
  const moveButton = {
    id: 'move-history-icon',
    title: `Move to ${props.modals.gameHistory.side === 'left' ? 'right' : 'left'} side`,
    icon: (props.modals.gameHistory.side === 'left' ? faArrowRight : faArrowLeft),
    onClick: props.modals.gameHistory.toggleSide,
  };
  const scrollButton = {
    id: 'auto-scroll-history-icon',
    title: (props.modals.gameHistory.scroll ? 'Pause scrolling' : 'Scroll to bottom'),
    icon: (props.modals.gameHistory.scroll ? faPause : faPlay),
    onClick: props.toggleScroll,
  };
  const buttonIcons = (props.modals.gameHistory.side === 'left' ? [scrollButton, expandButton, moveButton] : [moveButton, expandButton, scrollButton]);
  return (
    <Flex mt={3}>
      <HStack spacing={8}>
        {buttonIcons.map(iconConfig => <ActionIcon key={iconConfig.id} {...iconConfig} />)}
      </HStack>
    </Flex>
  );
}

export default GameHistoryButtons;
