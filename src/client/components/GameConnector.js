import React from 'react';
import { connect } from 'react-redux';
import { PLAYER_ID_KEY } from '../../constants.mjs';
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
  submitAnswer,
  submitWager,
  updateGameSettings,
  websocketConnect,
} from '../actions/action_creators';
import Game from './game/Game';
import Lobby from './lobby/Lobby';
import PlayerEditor from './player/PlayerEditor';

function mapStateToProps(state) {
  return {...state};
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
  submitAnswer,
  submitWager,
  updateGameSettings,
  websocketConnect,
};

class Connector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showPlayerEditor: !props.player,
    };
    this.closePlayerEditor = this.closePlayerEditor.bind(this);
    this.openPlayerEditor = this.openPlayerEditor.bind(this);
  }

  componentDidMount() {
    if (!this.props.connected) {
      console.log('Opening websocket connection...');
      this.props.websocketConnect();
    }

    const playerID = localStorage.getItem(PLAYER_ID_KEY);
    if (playerID) {
      this.props.fetchPlayer(playerID);
    }

    this.props.fetchCurrentGame();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((!prevProps.connected && this.props.connected && this.props.player) ||
        (!prevProps.player && this.props.player && this.props.connected)) {
      console.log('Establishing connection to server...');
      this.props.clientConnect(this.props.player.playerID);
    }
    if (prevProps.connected && !this.props.connected && this.props.player) {
      /* TODO - show message to user? */
      console.log('Websocket connection lost. Attempting to reconnect...');
      this.props.clientConnect(this.props.player.playerID);
    }
    if (!prevProps.player && this.props.player) {
      this.closePlayerEditor();
    }
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
