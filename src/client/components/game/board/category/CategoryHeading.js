import React from 'react';
import { Flex } from '@chakra-ui/react';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import Icon from '../../../common/Icon';

function shouldReduceSize(name) {
  const words = name.split(' ');
  const meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  return (name.length > 30 || meanLength > 7 || words.length > 5 || (words.length >= 3 && meanLength > 4));
}

function CategoryHeading(props) {
  const borderColor = (props.activeClue && !props.showClueAnimation ? '#1D08A3' : 'white');
  let classes = 'category-heading';
  let finished = true;
  let name = <br />;
  let title;
  if (props.category) {
    let allUnrevealed = true;
    props.category.clues.forEach(clue => {
      if (!clue.played) {
        finished = false;
      }
      if (!clue.unrevealed) {
        allUnrevealed = false;
      }
    });
    if (!finished) {
      name = props.category.name;
      if (shouldReduceSize(name)) {
        classes += ' small-heading';
      }
    }
    if (allUnrevealed) {
      title = `None of the clues in this category were revealed during the show. The category was: ${props.category.name}.`;
    } else if (props.category.hasOwnProperty('comments')) {
      title = props.category.comments;
    }
  }
  return (
    <Flex className={classes} border={`2px solid ${borderColor}`} align="center" justify="center" position="relative"
          px={3} py={2} title={title} userSelect="none">
      {name}
      {props.category?.comments && !finished && (
        <Flex fontSize="sm" position="absolute" top={2} right={2}>
          <Icon id={`category-comments-${props.category.categoryID}`} clickable={false} icon={faMessage} />
        </Flex>
      )}
    </Flex>
  );
}

export default CategoryHeading;
