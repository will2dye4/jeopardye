import React from 'react';
import { Flex, HStack, IconButton } from '@chakra-ui/react';
import { faArrowLeft, faArrowRight, faCompressAlt, faExpandAlt, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import Icon from '../../common/Icon';

function GameHistoryButtons(props) {
  const expandButton = {
    id: 'expand-history-icon',
    title: 'Make history ' + (props.gameHistory.size === 'xs' ? 'bigger' : 'smaller'),
    icon: (props.gameHistory.size === 'xs' ? faExpandAlt : faCompressAlt),
    onClick: props.gameHistory.toggleSize,
  };
  const moveButton = {
    id: 'move-history-icon',
    title: `Move to ${props.gameHistory.side === 'left' ? 'right' : 'left'} side`,
    icon: (props.gameHistory.side === 'left' ? faArrowRight : faArrowLeft),
    onClick: props.gameHistory.toggleSide,
  };
  const scrollButton = {
    id: 'auto-scroll-history-icon',
    title: (props.gameHistory.scroll ? 'Pause scrolling' : 'Scroll to bottom'),
    icon: (props.gameHistory.scroll ? faPause : faPlay),
    onClick: props.toggleScroll,
  };
  const buttons = (props.gameHistory.side === 'left' ? [scrollButton, expandButton, moveButton] : [moveButton, expandButton, scrollButton]);
  return (
    <Flex mt={3}>
      <HStack spacing={3}>
        {buttons.map(buttonConfig =>
          <IconButton key={buttonConfig.id} colorScheme="jeopardyBlue" icon={<Icon {...buttonConfig} />}
                      aria-label={buttonConfig.title} title={buttonConfig.title} onClick={buttonConfig.onClick} />
        )}
      </HStack>
    </Flex>
  );
}

export default GameHistoryButtons;
