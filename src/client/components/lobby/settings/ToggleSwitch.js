import React from 'react';

function ToggleSwitch(props) {
  return (
    <div className="toggle-switch form-check form-switch">
      <input type="checkbox" className="form-check-input" name={props.name} id={props.name}
             checked={props.checked} onChange={props.onChange} />
      <div className="px-2 pt-1">{props.checked ? 'On' : 'Off'}</div>
    </div>
  );
}

export default ToggleSwitch;
