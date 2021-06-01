import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { DEFAULT_FONT_STYLE } from '../../../../constants.mjs';

function Podium(props) {
  let score = props.score.toLocaleString();
  let scoreClasses = 'podium-score';
  if (props.score < 0) {
    score = '-$' + score.substring(1);
    scoreClasses += ' podium-score-negative';
  } else {
    score = '$' + score;
  }
  let nameClasses = 'podium-name';
  if (props.active) {
    nameClasses += ' podium-name-active';
  }
  const fontStyle = props.preferredFontStyle || DEFAULT_FONT_STYLE;
  return (
    <Flex className="podium" mb={2} mx={12} textAlign="center" userSelect="none">
      <Box className="podium-left-side podium-side">
        <Box className="podium-stripe" />
        <Box className="podium-stripe" />
      </Box>
      <Box className="podium-center">
        <Box className={scoreClasses} py={2}>{score}</Box>
        <Box className={nameClasses} borderRadius="md" fontFamily={fontStyle} m={2} py={2}>{props.name}</Box>
      </Box>
      <Box className="podium-right-side podium-side">
        <Box className="podium-stripe" />
        <Box className="podium-stripe" />
      </Box>
    </Flex>
  );
}

export default Podium;
