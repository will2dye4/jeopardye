import React from 'react';
import { GridItem } from '@chakra-ui/react';
import './Lobby.css';
import { DEFAULT_PLAYER_ID } from '../../../constants.mjs';
import GridRow from '../common/GridRow';
import LogoPage from '../common/LogoPage';
import GameSettings from './settings/GameSettings';
import LeaveButton from './LeaveButton';
import LobbyButtons from './LobbyButtons';
import PlayerLists from './PlayerLists';
import RoomCode from './RoomCode';

function Lobby(props) {
  const isAdmin = (props.playerID === DEFAULT_PLAYER_ID);
  return (
    <LogoPage id="lobby">
      <LeaveButton onConfirm={() => props.leaveRoom(props.playerID, props.roomID)} />
      <LobbyButtons isAdmin={isAdmin} modals={props.modals} />
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
