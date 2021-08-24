import React from 'react';
import { Flex, Switch, Text } from '@chakra-ui/react';

function ToggleSwitch(props) {
  return (
    <Flex align="center" ml={5}>
      <Switch colorScheme="jeopardyeBlue" name={props.name} id={props.name} isChecked={props.checked}
              isDisabled={props.disabled} onChange={props.onChange} />
      <Text px={4}>{props.checked ? 'On' : 'Off'}</Text>
    </Flex>
  );
}

export default ToggleSwitch;
