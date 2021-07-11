import React from 'react';
import { Redirect, useParams } from 'react-router-dom';
import Game from './game/Game';
import Lobby from './lobby/Lobby';

function Room(props) {
  const { roomCode } = useParams();
  if (props.game) {
    return <Game {...props} />;
  }
  if (props.room) {
    return <Lobby {...props} />;
  }
  if (props.playerID) {
    console.log(`Fetching room ${roomCode}`);
    props.fetchRoom(roomCode);
  }
  return <Redirect to="/" />;
}

export default Room;
