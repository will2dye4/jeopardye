import React from 'react';
import {getCLS} from "web-vitals";

class StatusBar extends React.Component {
  handleSubmit() {
    const answer = document.getElementById('answer-input').value;
    this.props.submitAnswer(this.props.gameID, this.props.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID, answer);
  }

  handleKeyUp(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  getColorClasses() {
    const defaultClasses = 'bg-light text-dark';
    if (typeof this.props.status === 'string') {
      return defaultClasses;
    }
    switch (this.props.status.color) {
      case 'success':
        return 'bg-success';
      default:
        return defaultClasses;
    }
  }

  render() {
    const classes = 'card mt-3 rounded-pill user-select-none ' + this.getColorClasses();
    let bodyClasses = 'card-body';
    let content;
    if (this.props.activeClue && this.props.playerAnswering === this.props.playerID) {
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
      content = (typeof this.props.status === 'string' ? this.props.status : this.props.status.text);
    }
    return (
      <div className={classes}>
        <div className={bodyClasses}>{content}</div>
      </div>
    );
  }
}

export default StatusBar;
