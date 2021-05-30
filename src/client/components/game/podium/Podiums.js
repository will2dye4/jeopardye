import React from 'react';
import Podium from './Podium';

function Podiums(props) {
  const podiums = Object.values(props.players).map(player => {
    const active = (player.playerID === props.playerAnswering);
    return <Podium key={player.playerID} name={player.name} score={player.score || 0} active={active} />
  });
  return (
    <div className="d-flex justify-content-center podium-container">
      {podiums}
    </div>
  );
}

export default Podiums;
