import React from 'react';
import { connect } from 'react-redux';
import { dismissActiveClue, fetchGame, joinGame, selectClue, buzzIn, submitAnswer, websocketConnect, websocketDisconnect } from '../actions/action_creators';
import Game from './game/Game';

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {dismissActiveClue, fetchGame, joinGame, selectClue, buzzIn, submitAnswer, websocketConnect, websocketDisconnect};

class Connector extends React.Component {
  render() {
    return <Game {...this.props} />;
  }

  componentDidMount() {
    this.props.fetchGame();
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
