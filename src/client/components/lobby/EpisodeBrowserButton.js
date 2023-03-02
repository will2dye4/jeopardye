import React from 'react';
import { Badge } from '@chakra-ui/react';
import { RETRO_TV_ICON }  from '../../../constants.mjs';
import ActionIcon from '../common/ActionIcon';

function EpisodeBrowserButton(props) {
  const title = 'Show episode browser';
  return (
    <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={3} py={2} fontSize="xl"
           userSelect="none" title={title} className="hover-pointer" onClick={props.modals.episodeBrowser.open}>
      <ActionIcon id="episode-browser-button" icon={RETRO_TV_ICON} title={title} />
    </Badge>
  );
}

export default EpisodeBrowserButton;
