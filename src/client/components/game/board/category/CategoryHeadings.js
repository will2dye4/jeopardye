import React from 'react';
import { CATEGORIES_PER_ROUND } from '../../../../../constants.mjs';
import { range } from '../../../../../utils.mjs';
import CategoryHeading from './CategoryHeading';

function CategoryHeadings(props) {
  let headings;
  if (props.gameState.categories) {
    headings = Object.values(props.gameState.categories).map(category => <CategoryHeading key={category.categoryID} category={category} />);
  } else {
    headings = range(CATEGORIES_PER_ROUND).map(i => <CategoryHeading key={i} />);
  }
  return <div className="row row-cols-6">{headings}</div>;
}

export default CategoryHeadings;
