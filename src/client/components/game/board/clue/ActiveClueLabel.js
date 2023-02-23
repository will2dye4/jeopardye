import React from 'react';
import { Text } from '@chakra-ui/react';

function ActiveClueLabel(props) {
  return (
    <Text bg="jeopardyeYellow.500" borderRadius={4} fontSize="2xl" mb={2} mx="auto" px={2} py={1} textColor="black"
          textShadow="none" w="20%" minW={props.minW || "300px"}>
      {props.children}
    </Text>
  );
}

export default ActiveClueLabel;
