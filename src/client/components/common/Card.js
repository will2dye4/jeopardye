import React from 'react';
import { Flex } from '@chakra-ui/react';

function Card(props) {
  return (
    <Flex direction="column" bg="white" borderRadius="md" {...props}>
      {props.children}
    </Flex>
  );
}

export default Card;
