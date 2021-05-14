import React from 'react';
import { DEFAULT_PLAYER_ID } from '../../../../constants.mjs';

class ActiveClue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.reveal ? props.clue.answer : props.clue.question,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.reveal && this.props.reveal) {
      this.setState({text: this.props.clue.answer});
      this.props.timerRef.current.reset();
    }
  }

  handleClick() {
    if (this.props.reveal) {
      this.props.dismiss();
    } else if (this.props.allowAnswers) {
      this.props.buzzIn(this.props.gameID, DEFAULT_PLAYER_ID, this.props.clue.categoryID, this.props.clue.clueID);
      this.props.timerRef.current.pause();
    }
  }

  render() {
    const containerClasses = 'align-items-center current-clue-container row user-select-none animate__animated animate__zoomIn';
    const clueClasses = 'col-12 current-clue p-5 text-center text-uppercase';
    const board = document.getElementById('board');
    return (
      <div className={containerClasses} style={{width: board.offsetWidth * 1.02, height: board.offsetHeight}}>
        <div className={clueClasses} onClick={() => this.handleClick()}>{this.state.text}</div>
      </div>
    );
  }
}

export default ActiveClue;
