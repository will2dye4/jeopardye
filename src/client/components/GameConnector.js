import React from 'react';
import { connect } from 'react-redux';
import {
  buzzIn,
  changePlayerName,
  clientConnect,
  createNewPlayer,
  dismissActiveClue,
  fetchCurrentGame,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  joinGame,
  markClueAsInvalid,
  selectClue,
  skipActiveClue,
  startSpectating,
  stopSpectating,
  submitAnswer,
  submitWager,
  updateGameSettings,
  websocketConnect,
} from '../actions/action_creators';
import Game from './game/Game';
import Lobby from './lobby/Lobby';
import PlayerEditor from './player/PlayerEditor';

function mapStateToProps(state) {
  let players = {};
  let spectators = {};
  Object.entries(state.players).forEach(([playerID, player]) => {
    if (player.spectating) {
      spectators[playerID] = player;
    } else {
      players[playerID] = player;
    }
  });
  return {...state, players: players, spectators: spectators};
}

const actionCreators = {
  buzzIn,
  changePlayerName,
  clientConnect,
  createNewPlayer,
  dismissActiveClue,
  fetchCurrentGame,
  fetchGame,
  fetchNewGame,
  fetchPlayer,
  joinGame,
  markClueAsInvalid,
  selectClue,
  skipActiveClue,
  startSpectating,
  stopSpectating,
  submitAnswer,
  submitWager,
  updateGameSettings,
  websocketConnect,
};

class Connector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showPlayerEditor: !props.playerID,
    };
    this.closePlayerEditor = this.closePlayerEditor.bind(this);
    this.openPlayerEditor = this.openPlayerEditor.bind(this);
  }

  componentDidMount() {
    if (!this.props.connected) {
      console.log('Opening websocket connection...');
      this.props.websocketConnect();
    }

    if (this.props.playerID) {
      this.props.fetchPlayer(this.props.playerID);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((!prevProps.connected && this.props.connected && this.props.playerID) ||
        (!prevProps.playerID && this.props.playerID && this.props.connected)) {
      console.log('Establishing connection to server...');
      this.connectAndFetchCurrentGame();
    }
    if (prevProps.connected && !this.props.connected && this.props.playerID) {
      /* TODO - show message to user? */
      console.log('Websocket connection lost. Attempting to reconnect...');
      this.connectAndFetchCurrentGame();
    }
  }

  connectAndFetchCurrentGame() {
    this.props.clientConnect(this.props.playerID);
    this.props.fetchCurrentGame();
  }

  openPlayerEditor() {
    this.setState({showPlayerEditor: true});
  }

  closePlayerEditor() {
   this.setState({showPlayerEditor: false});
  }

  render() {
    const playerEditor = {
      open: this.openPlayerEditor,
      close: this.closePlayerEditor,
    };
    let content;
    if (this.props.game) {
      content = <Game playerEditor={playerEditor} {...this.props} />;
    } else {
      content = <Lobby playerEditor={playerEditor} {...this.props} />;
    }
    return (
      <React.Fragment>
        {content}
        {this.state.showPlayerEditor && <PlayerEditor playerEditor={playerEditor} {...this.props} />}
      </React.Fragment>
    )
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
