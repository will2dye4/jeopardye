import React from 'react';
import { connect } from 'react-redux';
import { fetchBoard } from './data/action_creators';
import Game from './Game';

function mapStateToProps(state) {
  return {...state};
}

const actionCreators = {fetchBoard,};

class Connector extends React.Component {
  render() {
    return <Game {...this.props} />;
  }

  componentDidMount() {
    this.props.fetchBoard();
  }
}

export const GameConnector = connect(mapStateToProps, actionCreators)(Connector);
