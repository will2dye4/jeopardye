import React from 'react';

function RoomCode(props) {
  return (
    <div className="card mb-3 text-center">
      <div className="card-header fw-bold text-center">Room Code</div>
      <div className="card-body room-code">{props.code}</div>
    </div>
  );
}

export default RoomCode;
