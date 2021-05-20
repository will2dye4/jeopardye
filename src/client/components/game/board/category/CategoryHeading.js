import React from 'react';

function shouldReduceSize(name) {
  const words = name.split(' ');
  const meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  return (name.length > 30 || meanLength > 7 || (words.length > 3 && meanLength > 4));
}

function CategoryHeading(props) {
  let classes = 'align-items-center border border-2 category-heading col d-flex fw-bold justify-content-center ' +
                'p-3 text-center text-uppercase user-select-none';
  let name = <br />;
  if (props.category) {
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
  return <div className={classes}>{name}</div>;
}

export default CategoryHeading;
