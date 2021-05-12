import React from 'react';

function StatusText(props) {
  const colorClasses = props.action ? 'bg-success' : 'bg-light text-dark';
  const classes = 'card mt-3 rounded-pill user-select-none ' + colorClasses;
  return (
    <div className={classes}>
      <div className="card-body">{props.text}</div>
    </div>
  );
}

export default StatusText;
