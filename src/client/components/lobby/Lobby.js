import React from 'react';
import './Lobby.css';
import GameSettings from './GameSettings';
import PlayerList from './PlayerList';
import RoomCode from './RoomCode';

class Lobby extends React.Component {
  render() {
    return (
      <div id="lobby" className="d-flex flex-fill lobby">
        <div className="logo-container">
          <h1 className="logo position-absolute top-0 start-50 translate-middle-x">Jeopardye!</h1>
        </div>
        <div className="row lobby-content">
          <div className="col col-3 mx-4 my-2">
            <RoomCode code="YYZ" />
            <PlayerList listType="Players" players={this.props.players} />
            <PlayerList listType="Spectators" players={this.props.spectators} />
          </div>
          <div className="col mx-4 my-2">
            <GameSettings {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}

export default Lobby;
