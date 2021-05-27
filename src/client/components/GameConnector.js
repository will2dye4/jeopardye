import React from 'react';
import { connect } from 'react-redux';
import {
  buzzIn,
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
import {DEFAULT_PLAYER_ID} from "../../constants.mjs";

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {
  buzzIn,
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
    return (this.props.game ? <Game {...this.props} /> : <Lobby {...this.props} />);
  }

  componentDidMount() {
    if (!localStorage.getItem('playerID')) {
      localStorage.setItem('playerID', DEFAULT_PLAYER_ID);
    }
    const playerID = localStorage.getItem('playerID');
    this.props.fetchPlayer(playerID);

    this.props.fetchCurrentGame();
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
