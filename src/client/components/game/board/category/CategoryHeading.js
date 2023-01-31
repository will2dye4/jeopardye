import React from 'react';
import { Flex } from '@chakra-ui/react';

function shouldReduceSize(name) {
  const words = name.split(' ');
  const meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  return (name.length > 30 || meanLength > 7 || words.length > 5 || (words.length >= 3 && meanLength > 4));
}

function CategoryHeading(props) {
  let classes = 'category-heading';
  let name = <br />;
  let title;
  if (props.category) {
    if (props.category.hasOwnProperty('comments')) {
      title = props.category.comments;
    }
    let finished = true;
    props.category.clues.forEach(clue => {
      if (!clue.played) {
        finished = false;
      }
    });
    if (!finished) {
      name = props.category.name;
      if (shouldReduceSize(name)) {
        classes += ' small-heading';
      }
    }
  }
  return (
    <Flex className={classes} align="center" justify="center" px={3} py={2} title={title} userSelect="none">
      {name}
    </Flex>
  );
}

export default CategoryHeading;
