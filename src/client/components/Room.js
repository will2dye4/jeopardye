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
  if (roomCode && props.playerID && !props.redirectToHome) {
    console.log(`Fetching room ${roomCode}`);
    props.fetchRoom(roomCode);
  }
  const destination = (props.redirectToHome ? '/' : `/?code=${roomCode}`);
  return <Redirect to={destination} />;
}

export default Room;
