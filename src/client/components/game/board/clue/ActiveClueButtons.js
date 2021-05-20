import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFastForward } from '@fortawesome/free-solid-svg-icons';

function getButtonElement(id, icon, title) {
  return <FontAwesomeIcon id={id} icon={icon} title={title} className="hover-pointer current-clue-button" />;
}

function ActiveClueButtons(props) {
  return (
    <div className="current-clue-buttons mb-2 position-absolute">
      {props.allowAnswers && getButtonElement('skip-icon', faFastForward, 'Skip this clue')}
    </div>
  );
}

export default ActiveClueButtons;
