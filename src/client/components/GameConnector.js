import React from 'react';
import { connect } from 'react-redux';
import {
  buzzIn,
  changePlayerName,
  clientConnect,
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
  websocketConnect,
} from '../actions/action_creators';
import Game from './game/Game';
import Lobby from './lobby/Lobby';
import PlayerEditor from './player/PlayerEditor';
import { PLAYER_ID_KEY } from '../../constants.mjs';

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {
  buzzIn,
  changePlayerName,
  clientConnect,
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
  websocketConnect,
};

class Connector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showPlayerEditor: !props.player,
    };
    this.closePlayerEditor = this.closePlayerEditor.bind(this);
    this.showPlayerEditor = this.showPlayerEditor.bind(this);
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

  showPlayerEditor() {
    this.setState({showPlayerEditor: true});
  }

  closePlayerEditor() {
   this.setState({showPlayerEditor: false});
  }

  render() {
    if (!this.props.player || this.state.showPlayerEditor) {
      return <PlayerEditor onSubmit={this.closePlayerEditor} {...this.props} />;
    }
    if (!this.props.game) {
      return <Lobby showPlayerEditor={this.showPlayerEditor} {...this.props} />;
    }
    return <Game {...this.props} />;
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
