import React from 'react';
import { connect } from 'react-redux';
import { fetchGame, joinGame, websocketConnect } from '../data/action_creators';
import Game from './Game';

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {fetchGame, joinGame, websocketConnect};

class Connector extends React.Component {
  render() {
    return <Game {...this.props} />;
  }

  componentDidMount() {
    this.props.fetchGame();
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
