import React from 'react';
import { Flex, Text } from '@chakra-ui/react';
import packageJSON from '../../../package.alias.json';

function Footer() {
  return (
    <Flex position="fixed" left={0} bottom={0} width="100%" justify="center" mb={2} mt={5}>
      <Text textColor="white" fontSize="md">
        Jeopardye is dedicated to the loving memory of Hailey Worthy. | &copy; {new Date().getFullYear()} | Version {packageJSON.version}
      </Text>
    </Flex>
  );
}

export default Footer;
