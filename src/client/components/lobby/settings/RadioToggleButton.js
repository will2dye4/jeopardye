import React from 'react';

function RadioToggleButton(props) {
  const id = `${props.name}-${props.itemKey}`;
  const classes = "btn btn-outline-primary " + props.name;
  return (
    <React.Fragment key={props.itemKey}>
      <input type="radio"
             className="btn-check"
             autoComplete="off"
             id={id}
             name={props.name}
             value={props.value}
             checked={props.currentValue === props.value}
             onChange={props.onChange} />
      <label className={classes} htmlFor={id}>{props.label}</label>
    </React.Fragment>
  );
}

export default RadioToggleButton;
