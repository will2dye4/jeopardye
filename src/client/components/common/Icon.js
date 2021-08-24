import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JEOPARDYE_THEME from '../../theme';

function Icon(props) {
  const clickable = (props.clickable ?? true);
  const color = (props.color === 'jeopardyeBlue' ? JEOPARDYE_THEME.colors.jeopardyeBlue['500'] : (props.color || 'inherit'));
  let classes = props.className || '';
  if (clickable) {
    classes += ' hover-pointer';
  }
  return <FontAwesomeIcon id={props.id} icon={props.icon} title={props.title} className={classes} onClick={props.onClick}
                          color={color} />;
}

export default Icon;
