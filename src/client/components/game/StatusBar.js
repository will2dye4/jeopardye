import React from 'react';
import { DEFAULT_PLAYER_ID, ENTER_KEY_CODE } from '../../../constants.mjs';

class StatusBar extends React.Component {
  handleSubmit() {
    const answer = document.getElementById('answer-input').value;
    this.props.submitAnswer(this.props.gameID, DEFAULT_PLAYER_ID, this.props.activeClue.categoryID, this.props.activeClue.clueID, answer);
  }

  handleKeyUp(event) {
    if (event.keyCode === ENTER_KEY_CODE) {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  render() {
    const colorClasses = this.props.action ? 'bg-success' : 'bg-light text-dark';
    const classes = 'card mt-3 rounded-pill user-select-none ' + colorClasses;
    let bodyClasses = 'card-body';
    let content;
    if (this.props.activeClue && this.props.playerAnswering === DEFAULT_PLAYER_ID) {
      bodyClasses += ' d-flex justify-content-center';
      content = (
        <div className="row w-75">
          <div className="col p-2">
            <label htmlFor="answer-input" className="form-label">What is ...</label>
          </div>
          <div className="col-8">
            <input id="answer-input" type="text" className="form-control form-control-lg w-100" autoFocus={true}
                   onKeyUp={(event) => this.handleKeyUp(event)} />
          </div>
          <div className="col p-1">
            <button type="submit" className="btn btn-primary"
                    onClick={() => this.handleSubmit()}>
              Submit
            </button>
          </div>
        </div>
      );
    } else {
      content = this.props.text;
    }
    return (
      <div className={classes}>
        <div className={bodyClasses}>{content}</div>
      </div>
    );
  }
}

export default StatusBar;
