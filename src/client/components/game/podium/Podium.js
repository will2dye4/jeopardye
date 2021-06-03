import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { DEFAULT_FONT_STYLE, MAX_PLAYER_NAME_LENGTH } from '../../../../constants.mjs';

const FONT_SIZE_CLASSES = ['xs', 'sm', 'md', 'lg', 'xl'];
const MIN_FONT_SIZE_INDEX = 0;
const MAX_FONT_SIZE_INDEX = FONT_SIZE_CLASSES.length - 1;

const LARGE_FONTS = [
  'Beth Ellen',
  'Homemade Apple',
  'Rock Salt',
];

const SMALL_FONTS = [
  'Rouge Script',
  'Sacramento',
];

function isLargeFont(font) {
  return (LARGE_FONTS.indexOf(font) !== -1);
}

function isSmallFont(font) {
  return (SMALL_FONTS.indexOf(font) !== -1);
}

function getNameClasses(name, font, size) {
  let index = MAX_FONT_SIZE_INDEX - 1;
  if (size === 'xs') {
    index = MIN_FONT_SIZE_INDEX;
    if (!isLargeFont(font)) {
      index += 1;
    }
    if (name.length < MAX_PLAYER_NAME_LENGTH - 3) {
      index += 1;
    }
  } else {
    if (size === 'sm') {
      index -= 1;
      if (name.length > MAX_PLAYER_NAME_LENGTH - 3) {
        index -= 1;
      }
    } else {
      if (name.length === MAX_PLAYER_NAME_LENGTH) {
        index -= 2;
      } else if (name.length === MAX_PLAYER_NAME_LENGTH - 1) {
        index -= 1;
      }
    }
    if (isLargeFont(font)) {
      index -= 1;
    }
  }
  if (isSmallFont(font)) {
    index += 1;
  }
  index = Math.max(MIN_FONT_SIZE_INDEX, Math.min(index, MAX_FONT_SIZE_INDEX));
  const sizeName = FONT_SIZE_CLASSES[index];
  return `podium-name podium-name-${sizeName}`;
}

function Podium(props) {
  const size = props.size || 'lg';
  let wrapperClasses = `podium podium-${size}`;
  if (props.onClick) {
    wrapperClasses += ' hover-pointer';
  }
  let score = (props.player.score || 0).toLocaleString();
  let scoreClasses = 'podium-score';
  if (props.player.score < 0) {
    score = '-$' + score.substring(1);
    scoreClasses += ' podium-score-negative';
  } else {
    score = '$' + score;
  }
  const mx = (size === 'xs' ? 6 : (size === 'sm' ? 8 : 12));
  const fontStyle = props.player.preferredFontStyle || DEFAULT_FONT_STYLE;
  let nameClasses = getNameClasses(props.player.name, fontStyle, size);
  if (props.active) {
    nameClasses += ' podium-name-active';
  }
  return (
    <Flex className={wrapperClasses} mb={3} mx={mx} onClick={props.onClick} textAlign="center" userSelect="none">
      <Box className="podium-left-side podium-side">
        <Box className="podium-stripe" />
        <Box className="podium-stripe" />
      </Box>
      <Box className={`podium-center podium-center-${size}`}>
        <Box className={scoreClasses} py={2}>{score}</Box>
        <Box className={nameClasses} borderRadius="md" fontFamily={fontStyle} m={2} py={2}>{props.player.name}</Box>
      </Box>
      <Box className="podium-right-side podium-side">
        <Box className="podium-stripe" />
        <Box className="podium-stripe" />
      </Box>
    </Flex>
  );
}

export default Podium;
