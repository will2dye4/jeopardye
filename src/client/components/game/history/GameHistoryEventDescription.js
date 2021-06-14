import React from 'react';
import { Box, Text } from '@chakra-ui/react';

function GameHistoryEventDescription(props) {
  return (
    <Box className={props.className} lineHeight="short" cursor="default" w="100%">
      {props.isAccordion ? props.description : <Text as="span" mr={2}>{props.description}</Text>}
      {props.showTimestamp && <Text as="span" d="inline-block" fontSize="sm" fontStyle="italic" opacity="0.8">{props.timestamp}</Text>}
    </Box>
  );
}

export default GameHistoryEventDescription;
