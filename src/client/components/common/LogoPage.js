import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import './Common.css';
import Footer from './Footer';
import Logo from './Logo';

function LogoPage(props) {
  return (
    <Flex id={props.id} className="logo-page">
      <Logo />
      <Box className="logo-page-content">
        {props.children}
        <Footer />
      </Box>
    </Flex>
  );
}

export default LogoPage;
