import React from 'react';

const CHECK_MARK_EMOJI = '\u2705';
const CROSS_MARK_EMOJI = '\u274c';

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

  getAppearance() {
    if (this.props.status.hasOwnProperty('appearance')) {
      return this.props.status.appearance;
    }
    return null;
  }

  getColorClasses() {
    switch (this.getAppearance()) {
      case 'action':
        return 'alert-primary';
      case 'correct':
        return 'alert-success';
      case 'incorrect':
        return 'alert-danger';
      default:
        return 'alert-secondary text-dark';
    }
  }

  getTextClasses() {
    switch (this.getAppearance()) {
      case 'action':
      case 'correct':
        return 'fw-bold animate__animated animate__pulse animate__infinite';
      default:
        return '';
    }
  }

  getEmoji() {
    switch (this.getAppearance()) {
      case 'correct':
        return CHECK_MARK_EMOJI;
      case 'incorrect':
        return CROSS_MARK_EMOJI;
      default:
        return null;
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
      let text = (this.getAppearance() === null ? this.props.status : this.props.status.text);
      const emoji = this.getEmoji();
      if (emoji) {
        text = `${emoji} ${text}`;
      }
      content = <div className={this.getTextClasses() + ' fs-2'}>{text}</div>;
    }
    return (
      <div className={classes}>
        <div className={bodyClasses}>{content}</div>
      </div>
    );
  }
}

export default StatusBar;
