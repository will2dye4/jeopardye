import React from 'react';
import {
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/react';
import EpisodePopoverBody from './EpisodePopoverBody';

function EpisodePopover(props) {
  return (
    <Popover isLazy placement="right">
      <PopoverTrigger>
        {props.children}
      </PopoverTrigger>
      <PopoverContent className="popover" p={0} w="auto">
        <PopoverArrow />
        <PopoverCloseButton />
        <EpisodePopoverBody {...props} />
      </PopoverContent>
    </Popover>
  );
}

export default EpisodePopover;
