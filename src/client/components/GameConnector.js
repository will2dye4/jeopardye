import React from 'react';
import { connect } from 'react-redux';
import {
  buzzIn,
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
  websocketDisconnect,
} from '../actions/action_creators';
import Game from './game/Game';
import Lobby from './lobby/Lobby';
import PlayerEditor from './player/PlayerEditor';

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {
  buzzIn,
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
  websocketDisconnect,
};

class Connector extends React.Component {
  render() {
    if (!this.props.player) {
      return <PlayerEditor {...this.props} />;
    }
    if (!this.props.game) {
      return <Lobby {...this.props} />;
    }
    return <Game {...this.props} />;
  }

  componentDidMount() {
    const playerID = localStorage.getItem('playerID');
    if (playerID) {
      this.props.fetchPlayer(playerID);
    }

    this.props.fetchCurrentGame();
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
