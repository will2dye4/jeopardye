import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { createStandaloneToast } from '@chakra-ui/react';
import {
  abandonGame,
  advanceToNextRound,
  buzzIn,
  changePlayerName,
  clearCurrentGame,
  clearError,
  clearHostOverride,
  clearPlayerInControlReassigned,
  clearRoomLinkRequestSucceeded,
  clientConnect,
  createNewGameFailed,
  createNewPlayer,
  createNewRoom,
  dismissActiveClue,
  fetchCategoryStats,
  fetchCurrentPlayer,
  fetchEpisodesForSeason,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  fetchPlayers,
  fetchRoom,
  fetchRoomLeaderboards,
  fetchRooms,
  fetchRoomLinkRequests,
  fetchSeasonSummaries,
  joinGame,
  joinRoom,
  joinRoomWithCode,
  kickPlayer,
  leaveRoom,
  markClueAsInvalid,
  markPlayerAsReadyForNextRound,
  overrideServerDecision,
  reassignRoomHost,
  requestNewRoomLink,
  resolveRoomLinkRequest,
  searchCategorySummaries,
  selectClue,
  startSpectating,
  stopSpectating,
  submitAnswer,
  submitWager,
  updateGameSettings,
  voteToSkipClue,
  websocketConnect,
} from '../actions/action_creators';
import { ADMIN_PLAYER_IDS, MAX_PLAYERS_PER_GAME } from '../../constants.mjs';
import { getPlayerName } from '../reducers/game_reducer';
import JEOPARDYE_THEME from '../theme';
import AdminDashboard from './admin/AdminDashboard';
import KickPlayerDialog from './common/players/KickPlayerDialog';
import Home from './home/Home';
import EpisodeBrowser from './episode/EpisodeBrowser';
import PlayerEditor from './player/PlayerEditor';
import PlayerStatistics from './player/stats/PlayerStatistics';
import Room from './Room';

const CONNECTED_TOAST_ID = 'connected-to-server';
const DISCONNECTED_TOAST_ID = 'disconnected-from-server';
const RECONNECT_ATTEMPT_INTERVAL_MILLIS = 5000;

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

function mapStateToProps(state) {
  let players = {};
  let spectators = {};
  Object.entries(state.players).forEach(([playerID, player]) => {
    if (player.active || playerID === state.playerID) {
      if (player.spectating) {
        spectators[playerID] = player;
      } else {
        players[playerID] = player;
      }
    }
  });
  return {...state, players: players, spectators: spectators};
}

const actionCreators = {
  abandonGame,
  advanceToNextRound,
  buzzIn,
  changePlayerName,
  clearCurrentGame,
  clearError,
  clearHostOverride,
  clearPlayerInControlReassigned,
  clearRoomLinkRequestSucceeded,
  clientConnect,
  createNewGameFailed,
  createNewPlayer,
  createNewRoom,
  dismissActiveClue,
  fetchCategoryStats,
  fetchCurrentPlayer,
  fetchEpisodesForSeason,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  fetchPlayers,
  fetchRoom,
  fetchRoomLeaderboards,
  fetchRooms,
  fetchRoomLinkRequests,
  fetchSeasonSummaries,
  joinGame,
  joinRoom,
  joinRoomWithCode,
  kickPlayer,
  leaveRoom,
  markClueAsInvalid,
  markPlayerAsReadyForNextRound,
  overrideServerDecision,
  reassignRoomHost,
  requestNewRoomLink,
  resolveRoomLinkRequest,
  searchCategorySummaries,
  selectClue,
  startSpectating,
  stopSpectating,
  submitAnswer,
  submitWager,
  updateGameSettings,
  voteToSkipClue,
  websocketConnect,
};

class Connector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connectionIntervalID: null,
      disconnected: false,
      kickPlayerID: null,
      onPlayerEditorClose: null,
      showAdminDashboard: false,
      showEpisodeBrowser: false,
      showKickPlayerDialog: false,
      showPlayerEditor: false,
      showPlayerStats: false,
    };
    this.closeAdminDashboard = this.closeAdminDashboard.bind(this);
    this.closeEpisodeBrowser = this.closeEpisodeBrowser.bind(this);
    this.closeKickPlayerDialog = this.closeKickPlayerDialog.bind(this);
    this.closePlayerEditor = this.closePlayerEditor.bind(this);
    this.closePlayerStats = this.closePlayerStats.bind(this);
    this.openAdminDashboard = this.openAdminDashboard.bind(this);
    this.openEpisodeBrowser = this.openEpisodeBrowser.bind(this);
    this.openKickPlayerDialog = this.openKickPlayerDialog.bind(this);
    this.openPlayerEditor = this.openPlayerEditor.bind(this);
    this.openPlayerStats = this.openPlayerStats.bind(this);
  }

  componentDidMount() {
    if (!this.props.connected) {
      console.log('Opening websocket connection...');
      this.props.websocketConnect();
    }

    if (this.props.playerID && !this.props.players.hasOwnProperty(this.props.playerID) && !this.props.spectators.hasOwnProperty(this.props.playerID)) {
      this.props.fetchCurrentPlayer();
    }

    if (this.props.roomID && !this.props.room) {
      this.props.fetchRoom(this.props.roomID);
    }

    this.checkPlayerInRoom();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((!prevProps.connected && this.props.connected && this.props.playerID) ||
      (!prevProps.playerID && this.props.playerID && this.props.connected)) {
      console.log('Establishing connection to server...');
      this.connectAndFetchCurrentState();
    }

    if (prevProps.connected && !this.props.connected && this.props.playerID) {
      console.log('Websocket connection lost. Attempting to reconnect...');
      if (!toast.isActive(DISCONNECTED_TOAST_ID)) {
        toast({
          id: DISCONNECTED_TOAST_ID,
          position: 'top',
          title: 'Connection to server lost. Trying to reconnect...',
          status: 'error',
          isClosable: true,
        });
      }
      const intervalID = setInterval(function() {
        if (this.props.connected) {
          this.cancelConnectionInterval();
        } else {
          console.log('Attempting to reconnect...');
          this.props.websocketConnect();
        }
      }.bind(this), RECONNECT_ATTEMPT_INTERVAL_MILLIS);
      this.setState({connectionIntervalID: intervalID, disconnected: true});
    }

    if ((this.props.roomID && prevProps.roomID !== this.props.roomID) || (!prevProps.roomID && this.props.roomID && !this.props.room)) {
      this.connectAndFetchCurrentState();
    }

    if (!prevProps.room && this.props.room && this.props.room.currentGameID && this.props.room.currentGameID !== this.props.game?.gameID) {
      this.props.fetchGame(this.props.room.currentGameID);
    }

    this.checkPlayerInRoom();

    if (prevProps.playerID && !this.props.playerID) {
      this.setState({showPlayerEditor: true});
    }

    if (this.props.error && this.props.error !== prevProps.error) {
      if (!toast.isActive(this.props.error)) {
        toast({
          id: this.props.error,
          position: 'top',
          title: this.props.error,
          status: 'error',
          isClosable: true,
        });
      }
      this.props.clearError(this.props.error);
    }

    if (prevProps.room && this.props.room && prevProps.room !== this.props.room && prevProps.room.hostPlayerID !== this.props.room.hostPlayerID) {
      const playerName = (this.props.room.hostPlayerID === this.props.playerID ? 'You' : getPlayerName(this.props.room.hostPlayerID));
      const verb = (playerName === 'You' ? 'are' : 'is');
      toast({
        position: 'top',
        title: `${playerName} ${verb} now the host.`,
        status: 'info',
        isClosable: true,
      });
    }

    if (!prevProps.roomLinkRequestSucceeded && this.props.roomLinkRequestSucceeded) {
      toast({
        position: 'top',
        title: `Room link request submitted successfully.`,
        status: 'success',
        isClosable: true,
      });
      this.props.clearRoomLinkRequestSucceeded();
    }
  }

  connectAndFetchCurrentState() {
    this.props.clientConnect(this.props.playerID, this.props.roomID);
    if (this.props.roomID) {
      this.props.fetchRoom(this.props.roomID);
    }
    this.props.fetchCurrentPlayer();
  }

  checkPlayerInRoom() {
    if (this.props.connected && this.props.room && this.props.playerID && !this.props.room.playerIDs.includes(this.props.playerID)) {
      console.log('Joining room...');
      this.props.joinRoom(this.props.playerID, this.props.roomID);
    }
  }

  cancelConnectionInterval() {
    if (this.state.connectionIntervalID !== null) {
      if (this.state.disconnected && !toast.isActive(CONNECTED_TOAST_ID)) {
        toast({
          id: CONNECTED_TOAST_ID,
          position: 'top',
          title: 'Successfully connected to server.',
          status: 'success',
          isClosable: true,
        });
      }
      clearInterval(this.state.connectionIntervalID);
      this.setState({connectionIntervalID: null, disconnected: false});
    }
  }

  getPlayer(playerID) {
    if (this.props.players.hasOwnProperty(playerID)) {
      return this.props.players[playerID];
    }
    if (this.props.spectators.hasOwnProperty(playerID)) {
      return this.props.spectators[playerID];
    }
    return null;
  }

  openAdminDashboard() {
    this.setState({showAdminDashboard: true});
  }

  openEpisodeBrowser() {
    this.setState({showEpisodeBrowser: true});
  }

  openKickPlayerDialog(playerID) {
    this.setState({kickPlayerID: playerID, showKickPlayerDialog: true});
  }

  openPlayerEditor(onClose = null) {
    this.setState({
      onPlayerEditorClose: (onClose === null || (typeof onClose === 'function') ? onClose : null),
      showPlayerEditor: true,
    });
  }

  openPlayerStats() {
    this.setState({showPlayerStats: true});
  }

  closeAdminDashboard() {
    this.setState({showAdminDashboard: false});
  }

  closeEpisodeBrowser() {
    this.setState({showEpisodeBrowser: false});
  }

  closeKickPlayerDialog() {
    this.setState({kickPlayerID: null, showKickPlayerDialog: false});
  }

  closePlayerEditor() {
    this.setState({showPlayerEditor: false});
    if (this.state.onPlayerEditorClose) {
      this.state.onPlayerEditorClose();
      this.setState({onPlayerEditorClose: null});
    }
  }

  closePlayerStats() {
    this.setState({showPlayerStats: false});
  }

  render() {
    const allowJoin = (Object.values(this.props.players).filter(player => player.active).length < MAX_PLAYERS_PER_GAME);
    const isAdmin = ADMIN_PLAYER_IDS.has(this.props.playerID);
    const urlSearchParams = new URLSearchParams(window.location.search);
    let roomCode;
    if (urlSearchParams.has('code')) {
      roomCode = urlSearchParams.get('code');
    }
    const modals = {
      adminDashboard: {
        open: this.openAdminDashboard,
        close: this.closeAdminDashboard,
      },
      episodeBrowser: {
        open: this.openEpisodeBrowser,
        close: this.closeEpisodeBrowser,
      },
      kickPlayerDialog: {
        open: this.openKickPlayerDialog,
        close: this.closeKickPlayerDialog,
      },
      playerEditor: {
        open: this.openPlayerEditor,
        close: this.closePlayerEditor,
      },
      playerStats: {
        open: this.openPlayerStats,
        close: this.closePlayerStats,
      },
    };
    return (
      <React.Fragment>
        <Router>
          <Switch>
            <Route exact path="/">
              {this.props.room ?
                <Redirect to={`/p/${this.props.room.roomCode}`}/> :
                <Home isAdmin={isAdmin} roomCode={roomCode} modals={modals} toast={toast} {...this.props} />}
            </Route>
            <Route path="/p/:roomCode">
              <Room allowJoin={allowJoin} isAdmin={isAdmin} modals={modals} toast={toast} {...this.props} />
            </Route>
          </Switch>
        </Router>
        {this.state.showAdminDashboard && <AdminDashboard modals={modals} {...this.props} />}
        {this.state.showEpisodeBrowser && <EpisodeBrowser modals={modals} {...this.props} />}
        {this.state.showKickPlayerDialog && <KickPlayerDialog player={this.getPlayer(this.state.kickPlayerID)}
                                                              roomID={this.props.roomID}
                                                              modals={modals}
                                                              kickPlayer={this.props.kickPlayer} />}
        {this.state.showPlayerEditor && <PlayerEditor modals={modals} {...this.props} />}
        {this.state.showPlayerStats && <PlayerStatistics modals={modals} {...this.props} />}
      </React.Fragment>
    );
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
