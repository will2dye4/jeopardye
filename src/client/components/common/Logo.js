import React from 'react';
import { Heading } from '@chakra-ui/react';
import { isChrome } from '../../utils';

function Logo() {
  const textStroke = (isChrome() ? '0.1px' : '2px') + ' white';
  return (
    <Heading as="h1" className="logo" style={{WebkitTextStroke: textStroke}} userSelect="none">Jeopardye!</Heading>
  );
}

export default Logo;
