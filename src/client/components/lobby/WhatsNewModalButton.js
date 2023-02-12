import React from 'react';
import { Badge } from '@chakra-ui/react';
import { faBullhorn } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../common/ActionIcon';

function WhatsNewModalButton(props) {
  const title = 'See what\'s new in v2!';
  return (
    <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={3} py={2} fontSize="xl"
           userSelect="none" title={title} className="hover-pointer" onClick={props.modals.whatsNew.open}>
      <ActionIcon id="whats-new-button" icon={faBullhorn} title={title} />
    </Badge>
  );
}

export default WhatsNewModalButton;
