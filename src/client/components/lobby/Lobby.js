import React from 'react';
import './Lobby.css';
import GameSettings from './settings/GameSettings';
import Logo from './Logo';
import PlayerList from './PlayerList';
import RoomCode from './RoomCode';

class Lobby extends React.Component {
  render() {
    return (
      <div id="lobby" className="d-flex flex-fill lobby">
        <Logo />
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
