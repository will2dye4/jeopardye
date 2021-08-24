import { Text } from '@chakra-ui/react';

function Blue(props) {
  return <Text as="span" textColor="jeopardyeBlue.500" {...props}>{props.children}</Text>;
}

export default Blue;
