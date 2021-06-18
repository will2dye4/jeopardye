import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { createStandaloneToast } from '@chakra-ui/react';
import {
  buzzIn,
  changePlayerName,
  clearCurrentGame,
  clearError,
  clientConnect,
  createNewPlayer,
  createNewRoom,
  dismissActiveClue,
  fetchCurrentPlayer,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  fetchRoom,
  joinGame,
  joinRoom,
  joinRoomWithCode,
  markClueAsInvalid,
  markPlayerAsReadyForNextRound,
  selectClue,
  setRoomCode,
  startSpectating,
  stopSpectating,
  submitAnswer,
  submitWager,
  updateGameSettings,
  voteToSkipClue,
  websocketConnect,
} from '../actions/action_creators';
import { MAX_PLAYERS_PER_GAME } from '../../constants.mjs';
import { getPlayerName } from '../reducers/game_reducer';
import JEOPARDYE_THEME from '../theme';
import Home from './home/Home';
import PlayerEditor from './player/PlayerEditor';
import PlayerStatistics from './player/stats/PlayerStatistics';
import Room from './Room';

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
  buzzIn,
  changePlayerName,
  clearCurrentGame,
  clearError,
  clientConnect,
  createNewPlayer,
  createNewRoom,
  dismissActiveClue,
  fetchCurrentPlayer,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  fetchRoom,
  joinGame,
  joinRoom,
  joinRoomWithCode,
  markClueAsInvalid,
  markPlayerAsReadyForNextRound,
  selectClue,
  setRoomCode,
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
      onPlayerEditorClose: null,
      showPlayerEditor: false,
      showPlayerStats: false,
    };
    this.closePlayerEditor = this.closePlayerEditor.bind(this);
    this.closePlayerStats = this.closePlayerStats.bind(this);
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
      /* TODO - show message to user? */
      console.log('Websocket connection lost. Attempting to reconnect...');
      this.connectAndFetchCurrentState();
    }

    if (!prevProps.roomID && this.props.roomID) {
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

  openPlayerEditor(onClose = null) {
    this.setState({
      onPlayerEditorClose: (onClose === null || (typeof onClose === 'function') ? onClose : null),
      showPlayerEditor: true,
    });
  }

  openPlayerStats() {
    this.setState({showPlayerStats: true});
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
    const allowJoin = (Object.keys(this.props.players).length < MAX_PLAYERS_PER_GAME);
    const playerEditor = {
      open: this.openPlayerEditor,
      close: this.closePlayerEditor,
    };
    const playerStats = {
      open: this.openPlayerStats,
      close: this.closePlayerStats,
    };
    return (
      <React.Fragment>
        <Router>
          <Switch>
            <Route exact path="/">
              {this.props.room ?
                <Redirect to={`/p/${this.props.room.roomCode}`} /> :
                <Home playerEditor={playerEditor} {...this.props} />}
            </Route>
            <Route path="/p/:roomCode">
              <Room allowJoin={allowJoin} playerEditor={playerEditor} playerStats={playerStats} {...this.props} />
            </Route>
          </Switch>
        </Router>
        {this.state.showPlayerEditor && <PlayerEditor playerEditor={playerEditor} {...this.props} />}
        {this.state.showPlayerStats && <PlayerStatistics playerStats={playerStats} {...this.props} />}
      </React.Fragment>
    );
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
