import React from 'react';
import { Box } from '@chakra-ui/react';

function CardHeader(props) {
  return (
    <Box className="card-header" borderTopRadius="md" fontWeight="bold" textAlign="center" py={2} userSelect="none">
      {props.children}
    </Box>
  );
}

export default CardHeader;
