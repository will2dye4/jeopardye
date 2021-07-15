import React from 'react';
import { GridItem } from '@chakra-ui/react';
import './Lobby.css';
import GridRow from '../common/GridRow';
import LogoPage from '../common/LogoPage';
import GameSettings from './settings/GameSettings';
import LeaveButton from './LeaveButton';
import PlayerLists from './PlayerLists';
import RoomCode from './RoomCode';
import StatisticsButton from './StatisticsButton';

function Lobby(props) {
  return (
    <LogoPage id="lobby">
      <LeaveButton onConfirm={() => props.leaveRoom(props.playerID, props.roomID)} />
      <StatisticsButton playerStats={props.playerStats} />
      <GridRow cols={4} gap={8} m={4}>
        <GridItem>
          <RoomCode code={props.room.roomCode} />
          <PlayerLists {...props} />
        </GridItem>
        <GridItem colSpan={3}>
          <GameSettings {...props} />
        </GridItem>
      </GridRow>
    </LogoPage>
  );
}

export default Lobby;
