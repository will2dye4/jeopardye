import React from 'react';
import Blue from '../../common/Blue';

function PlayerName(props) {
  return <Blue fontWeight="bold">{props.children}</Blue>;
}

export default PlayerName;
