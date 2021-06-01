import { Text } from '@chakra-ui/react';

function Bold(props) {
  return <Text as="span" fontWeight="bold">{props.children}</Text>;
}

export default Bold;
