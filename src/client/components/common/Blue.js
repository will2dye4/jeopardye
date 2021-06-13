import { Text } from '@chakra-ui/react';

function Blue(props) {
  return <Text as="span" textColor="jeopardyBlue.500" {...props}>{props.children}</Text>;
}

export default Blue;
