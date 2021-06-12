import React from 'react';
import { connect } from 'react-redux';
import { createStandaloneToast } from '@chakra-ui/react';
import {
  buzzIn,
  changePlayerName,
  clearCurrentGame,
  clearError,
  clientConnect,
  createNewPlayer,
  dismissActiveClue,
  fetchCurrentGame,
  fetchCurrentPlayer,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  joinGame,
  markClueAsInvalid,
  markPlayerAsReadyForNextRound,
  selectClue,
  startSpectating,
  stopSpectating,
  submitAnswer,
  submitWager,
  updateGameSettings,
  voteToSkipClue,
  websocketConnect,
} from '../actions/action_creators';
import { MAX_PLAYERS_PER_GAME } from '../../constants.mjs';
import JEOPARDYE_THEME from '../theme';
import Game from './game/Game';
import Lobby from './lobby/Lobby';
import PlayerEditor from './player/PlayerEditor';
import PlayerStatistics from './player/stats/PlayerStatistics';

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

function mapStateToProps(state) {
  let players = {};
  let spectators = {};
  Object.entries(state.players).forEach(([playerID, player]) => {
    if (player.active) {
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
  dismissActiveClue,
  fetchCurrentGame,
  fetchCurrentPlayer,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  joinGame,
  markClueAsInvalid,
  markPlayerAsReadyForNextRound,
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
      showPlayerEditor: !props.playerID,
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

    if (this.props.playerID) {
      this.props.fetchCurrentPlayer();
    }
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
  }

  connectAndFetchCurrentState() {
    this.props.clientConnect(this.props.playerID);
    this.props.fetchCurrentGame();
    this.props.fetchCurrentPlayer();
  }

  openPlayerEditor() {
    this.setState({showPlayerEditor: true});
  }

  openPlayerStats() {
    this.setState({showPlayerStats: true});
  }

  closePlayerEditor() {
   this.setState({showPlayerEditor: false});
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
    let content;
    if (this.props.game) {
      content = <Game allowJoin={allowJoin} playerEditor={playerEditor} playerStats={playerStats} {...this.props} />;
    } else {
      content = <Lobby allowJoin={allowJoin} playerEditor={playerEditor} playerStats={playerStats} {...this.props} />;
    }
    return (
      <React.Fragment>
        {content}
        {this.state.showPlayerEditor && <PlayerEditor playerEditor={playerEditor} {...this.props} />}
        {this.state.showPlayerStats && <PlayerStatistics playerStats={playerStats} {...this.props} />}
      </React.Fragment>
    )
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
