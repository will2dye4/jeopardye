import React from 'react';
import { Flex } from '@chakra-ui/react';

function Card(props) {
  return (
    <Flex direction="column" bg="gray.50" borderColor="rgba(0, 0, 0, 0.125)" borderRadius="md" borderWidth={1} {...props}>
      {props.children}
    </Flex>
  );
}

export default Card;
