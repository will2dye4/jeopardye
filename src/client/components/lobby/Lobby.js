import React from 'react';
import { GridItem } from '@chakra-ui/react';
import './Lobby.css';
import GridRow from '../common/GridRow';
import LogoPage from '../common/LogoPage';
import GameSettings from './settings/GameSettings';
import PlayerList from './PlayerList';
import RoomCode from './RoomCode';

class Lobby extends React.Component {
  render() {
    return (
      <LogoPage id="lobby">
        <GridRow cols={4} gap={8} m={4}>
          <GridItem>
            <RoomCode code="YYZ" />
            <PlayerList listType="Players" players={this.props.players} currentPlayerID={this.props.player?.playerID}
                        edit={this.props.showPlayerEditor} />
            <PlayerList listType="Spectators" players={this.props.spectators} currentPlayerID={this.props.player?.playerID}
                        edit={this.props.showPlayerEditor} />
          </GridItem>
          <GridItem colSpan={3}>
            <GameSettings {...this.props} />
          </GridItem>
        </GridRow>
      </LogoPage>
    );
  }
}

export default Lobby;
