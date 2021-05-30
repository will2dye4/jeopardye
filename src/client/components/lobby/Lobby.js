import React from 'react';
import './Lobby.css';
import LogoPage from '../common/LogoPage';
import GameSettings from './settings/GameSettings';
import PlayerList from './PlayerList';
import RoomCode from './RoomCode';

class Lobby extends React.Component {
  render() {
    return (
      <LogoPage id="lobby">
        <div className="col col-3 mx-4 my-2">
          <RoomCode code="YYZ" />
          <PlayerList listType="Players" players={this.props.players} currentPlayerID={this.props.player?.playerID}
                      edit={this.props.showPlayerEditor} />
          <PlayerList listType="Spectators" players={this.props.spectators} currentPlayerID={this.props.player?.playerID}
                      edit={this.props.showPlayerEditor} />
        </div>
        <div className="col mx-4 my-2">
          <GameSettings {...this.props} />
        </div>
      </LogoPage>
    );
  }
}

export default Lobby;
