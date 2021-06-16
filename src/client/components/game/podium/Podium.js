import React from 'react';
import {
  Box,
  Flex,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/react';
import { DEFAULT_FONT_STYLE, MAX_PLAYER_NAME_LENGTH } from '../../../../constants.mjs';
import { formatScore } from '../../../../utils.mjs';
import PodiumMenu from './PodiumMenu';

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
  return LARGE_FONTS.includes(font);
}

function isSmallFont(font) {
  return SMALL_FONTS.includes(font);
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

function getPodiumElement(props) {
  const size = props.size || 'lg';
  let wrapperClasses = `podium podium-${size}`;
  if (props.isCurrentPlayer) {
    wrapperClasses += ' hover-pointer';
  }
  const score = formatScore(props.player.score);
  let scoreClasses = 'podium-score';
  if (props.player.score < 0) {
    scoreClasses += ' podium-score-negative';
  }
  const mx = (size === 'xs' ? 6 : (size === 'sm' ? 8 : 12));
  const fontStyle = props.player.preferredFontStyle || DEFAULT_FONT_STYLE;
  let nameClasses = getNameClasses(props.player.name, fontStyle, size);
  if (props.active) {
    nameClasses += ' podium-name-active';
  }
  return (
    <Flex className={wrapperClasses} mb={3} mx={mx} textAlign="center" userSelect="none">
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

function Podium(props) {
  let podium = getPodiumElement(props);
  if (!props.isCurrentPlayer) {
    return podium;
  }
  return (
    <Popover>
      <PopoverTrigger>
        {podium}
      </PopoverTrigger>
      <PopoverContent p={0} w="auto">
        <PopoverArrow />
        <PopoverBody p={0}>
          <PodiumMenu {...props} />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default Podium;
