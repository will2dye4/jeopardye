import React from 'react';
import { getWagerRange } from '../../../utils.mjs';

const CHECK_MARK_EMOJI = '\u2705';
const CROSS_MARK_EMOJI = '\u274c';

class StatusBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      answerInputValue: '',
      wagerInputValue: '',
      invalidWager: false,
    };
  }

  handleInputChange(event) {
    if (event.target === document.getElementById('answer-input')) {
      this.setState({answerInputValue: event.target.value});
    } else if (event.target === document.getElementById('wager-input')) {
      this.setState({wagerInputValue: event.target.value});
    }
  }

  handleSubmit() {
    const answer = this.state.answerInputValue;
    this.props.submitAnswer(this.props.gameID, this.props.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID, answer);
    this.setState({answerInputValue: ''});
  }

  handleSubmitWager() {
    const [minWager, maxWager] = this.getWagerRange();
    const inputValue = document.getElementById('wager-input').value;
    const wager = parseInt(inputValue.replaceAll(/[$,]/g, '').replace(/\.\d*$/, ''));
    if (isNaN(wager) || wager < minWager || wager > maxWager) {
      this.setState({invalidWager: true});
    } else {
      this.props.submitWager(this.props.gameID, this.props.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID, wager);
      this.setState({wagerInputValue: '', invalidWager: false});
    }
  }

  handleKeyUp(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.target === document.getElementById('answer-input')) {
        this.handleSubmit();
      } else if (event.target === document.getElementById('wager-input')) {
        this.handleSubmitWager();
      }
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

  getWagerRange() {
    return getWagerRange(this.props.currentRound, this.props.playerScore);
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
            <input id="answer-input" type="text" value={this.state.answerInputValue} className="form-control form-control-lg w-100"
                   autoFocus={true} onChange={event => this.handleInputChange(event)}
                   onKeyUp={event => this.handleKeyUp(event)} />
          </div>
          <div className="col p-1">
            <button type="submit" className="btn btn-primary" onClick={() => this.handleSubmit()}>
              Submit
            </button>
          </div>
        </div>
      );
    } else if (this.props.activeClue && this.props.playerInControl === this.props.playerID && this.props.isDailyDouble && this.props.showWager) {
      bodyClasses += ' d-flex justify-content-center';
      const category = this.props.activeClue.category;
      const [minWager, maxWager] = this.getWagerRange().map(value => value.toLocaleString());
      let inputClasses = 'form-control form-control-lg w-100';
      if (this.state.invalidWager) {
        inputClasses += ' is-invalid';
      }
      content = (
        <div className="row w-100">
          <div className="col-8 p-2">
            <label htmlFor="wager-input" className="form-label">
              Enter your wager in the category <span className="fw-bold">{category}</span> (${minWager} &ndash; ${maxWager}):
            </label>
          </div>
          <div className="col">
            <input id="wager-input" type="text" value={this.state.wagerInputValue} className={inputClasses}
                   autoFocus={true} onChange={event => this.handleInputChange(event)}
                   onKeyUp={event => this.handleKeyUp(event)}/>
          </div>
          <div className="col p-1">
            <button type="submit" className="btn btn-primary" onClick={() => this.handleSubmitWager()}>
              Wager
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
