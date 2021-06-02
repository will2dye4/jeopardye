import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function Icon(props) {
  const clickable = (props.clickable ?? true);
  let classes = props.className || '';
  if (clickable) {
    classes += ' hover-pointer';
  }
  return <FontAwesomeIcon id={props.id} icon={props.icon} title={props.title} className={classes} onClick={props.onClick} />;
}

export default Icon;
