import React from 'react';
import Icon from './Icon';

function ActionIcon(props) {
  return <Icon color={props.color || 'jeopardyeBlue'} className="hover-yellow" {...props} />;
}

export default ActionIcon;
