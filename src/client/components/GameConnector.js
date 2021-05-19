import React from 'react';
import { connect } from 'react-redux';
import {
  buzzIn,
  dismissActiveClue,
  fetchGame,
  joinGame,
  revealAnswer,
  selectClue,
  setPlayer,
  submitAnswer,
  submitWager,
  websocketConnect,
  websocketDisconnect,
} from '../actions/action_creators';
import Game from './game/Game';

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {
  buzzIn,
  dismissActiveClue,
  fetchGame,
  joinGame,
  revealAnswer,
  selectClue,
  setPlayer,
  submitAnswer,
  submitWager,
  websocketConnect,
  websocketDisconnect,
};

class Connector extends React.Component {
  render() {
    return <Game {...this.props} />;
  }

  componentDidMount() {
    this.props.fetchGame();
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
