import React from 'react';
import { GridItem } from '@chakra-ui/react';
import './Lobby.css';
import GridRow from '../common/GridRow';
import LogoPage from '../common/LogoPage';
import GameSettings from './settings/GameSettings';
import LeaveButton from './LeaveButton';
import LobbyButtons from './LobbyButtons';
import PlayerLists from './PlayerLists';
import RoomCode from './RoomCode';

function Lobby(props) {
  return (
    <LogoPage id="lobby">
      <LeaveButton onConfirm={() => props.leaveRoom(props.playerID, props.roomID)} />
      <LobbyButtons isAdmin={props.isAdmin} modals={props.modals} />
      <GridRow cols={4} gap={8} m={4}>
        <GridItem>
          <RoomCode code={props.room.roomCode} toast={props.toast} />
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
