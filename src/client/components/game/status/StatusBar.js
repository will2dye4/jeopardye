import React from 'react';
import { getWagerRange } from '../../../../utils.mjs';
import StatusBarInput from './StatusBarInput';
import StatusBarText from './StatusBarText';

class StatusBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmitAnswer = this.handleSubmitAnswer.bind(this);
    this.handleSubmitWager = this.handleSubmitWager.bind(this);
    this.validateAnswer = this.validateAnswer.bind(this);
    this.validateWager = this.validateWager.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.currentWager && this.props.currentWager) {
      document.getElementById('answer-input').focus();
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
      case 'attention':
        return 'alert-warning';
      case 'correct':
        return 'alert-success';
      case 'incorrect':
        return 'alert-danger';
      default:
        return 'alert-secondary text-dark';
    }
  }

  getWagerRange() {
    return getWagerRange(this.props.gameState.currentRound, this.props.gameState.playerScore);
  }

  validateAnswer(answer) {
    return (answer !== '');
  }

  handleSubmitAnswer(answer) {
    this.props.submitAnswer(this.props.gameState.gameID, this.props.gameState.playerID,
                            this.props.activeClue.categoryID, this.props.activeClue.clueID, answer);
  }

  parseWager(inputValue) {
    return parseInt(inputValue.replaceAll(/[$,]/g, '').replace(/\.\d*$/, ''));
  }

  validateWager(inputValue) {
    const wager = this.parseWager(inputValue);
    const [minWager, maxWager] = this.getWagerRange();
    return !(isNaN(wager) || wager < minWager || wager > maxWager);
  }

  handleSubmitWager(inputValue) {
    const wager = this.parseWager(inputValue);
    this.props.submitWager(this.props.gameState.gameID, this.props.gameState.playerID,
                           this.props.activeClue.categoryID, this.props.activeClue.clueID, wager);
  }

  shouldShowAnswerInput() {
    return (this.props.activeClue && this.props.playerAnswering === this.props.gameState.playerID);
  }

  shouldShowWagerInput() {
    return (this.props.activeClue && this.props.playerInControl === this.props.gameState.playerID &&
            this.props.gameState.isDailyDouble && this.props.showDailyDoubleWager);
  }

  render() {
    const classes = 'card mt-3 rounded-pill status-bar user-select-none ' + this.getColorClasses();
    let bodyClasses = 'card-body text-center';
    let content;
    if (this.shouldShowAnswerInput() || this.shouldShowWagerInput()) {
      bodyClasses += ' d-flex justify-content-center';
      if (this.shouldShowAnswerInput()) {
        content = <StatusBarInput id="answer-input"
                                  label="What is ..."
                                  validate={this.validateAnswer}
                                  onSubmit={this.handleSubmitAnswer} />;
      } else {
        const category = this.props.activeClue.category;
        const [minWager, maxWager] = this.getWagerRange().map(value => value.toLocaleString());
        const label = (
          <React.Fragment>
            Enter your wager in the category <span className="fw-bold">{category}</span> (${minWager} &ndash; ${maxWager}):
          </React.Fragment>
        );
        content = <StatusBarInput id="wager-input"
                                  label={label}
                                  largeLabel={true}
                                  validate={this.validateWager}
                                  onSubmit={this.handleSubmitWager} />;
      }
    } else {
      content = <StatusBarText {...this.props} />;
    }
    return (
      <div className={classes}>
        <div className={bodyClasses}>{content}</div>
      </div>
    );
  }
}

export default StatusBar;
