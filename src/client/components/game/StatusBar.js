import React from 'react';

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
    const defaultClasses = 'alert-secondary text-dark';
    if (typeof this.props.status === 'string') {
      return defaultClasses;
    }
    switch (this.props.status.color) {
      case 'action':
        return 'alert-primary';
      case 'correct':
        return 'alert-success';
      case 'incorrect':
        return 'alert-danger';
      default:
        return defaultClasses;
    }
  }

  getTextClasses() {
    const defaultClasses = '';
    if (typeof this.props.status === 'string') {
      return defaultClasses;
    }
    switch (this.props.status.color) {
      case 'action':
      case 'correct':
        return 'fw-bold animate__animated animate__pulse animate__infinite';
      default:
        return defaultClasses;
    }
  }

  render() {
    const classes = 'card mt-3 rounded-pill status-bar user-select-none ' + this.getColorClasses();
    let bodyClasses = 'card-body text-center';
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
      bodyClasses += ' m-2';
      const text = (typeof this.props.status === 'string' ? this.props.status : this.props.status.text);
      content = <div className={this.getTextClasses()}>{text}</div>;
    }
    return (
      <div className={classes}>
        <div className={bodyClasses}>{content}</div>
      </div>
    );
  }
}

export default StatusBar;
