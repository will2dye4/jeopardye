import React from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { CATEGORIES_PER_ROUND } from '../../../../../constants.mjs';
import { range } from '../../../../../utils.mjs';
import CategoryHeading from './CategoryHeading';

function CategoryHeadings(props) {
  let headings;
  if (props.gameState.categories) {
    headings = Object.values(props.gameState.categories).map(category => <CategoryHeading key={category.categoryID}
                                                                                          category={category}
                                                                                          activeClue={props.activeClue}
                                                                                          showClueAnimation={props.showClueAnimation} />);
  } else {
    headings = range(CATEGORIES_PER_ROUND).map(i => <CategoryHeading key={i} />);
  }
  return <SimpleGrid columns={CATEGORIES_PER_ROUND}>{headings}</SimpleGrid>;
}

export default CategoryHeadings;
