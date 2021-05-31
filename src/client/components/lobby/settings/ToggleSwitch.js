import React from 'react';
import { Flex, Switch, Text } from '@chakra-ui/react';

function ToggleSwitch(props) {
  return (
    <Flex align="center" ml={5}>
      <Switch colorScheme="jeopardyBlue" name={props.name} id={props.name} isChecked={props.checked} onChange={props.onChange} />
      <Text px={4}>{props.checked ? 'On' : 'Off'}</Text>
    </Flex>
  );
}

export default ToggleSwitch;
