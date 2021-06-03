import React from 'react';
import { GridItem } from '@chakra-ui/react';
import './Lobby.css';
import GridRow from '../common/GridRow';
import LogoPage from '../common/LogoPage';
import GameSettings from './settings/GameSettings';
import PlayerLists from './PlayerLists';
import RoomCode from './RoomCode';

class Lobby extends React.Component {
  render() {
    return (
      <LogoPage id="lobby">
        <GridRow cols={4} gap={8} m={4}>
          <GridItem>
            <RoomCode code="YYZ" />
            <PlayerLists {...this.props} />
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
