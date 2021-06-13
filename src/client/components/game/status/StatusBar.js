import React from 'react';
import { Flex } from '@chakra-ui/react';
import { getWagerRange } from '../../../../utils.mjs';
import Bold from '../../common/Bold';
import Card from '../../common/card/Card';
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
      document.getElementById('answer-input')?.focus();
    }
  }

  getAppearance() {
    if (this.props.status.hasOwnProperty('appearance')) {
      return this.props.status.appearance;
    }
    return null;
  }

  getColor() {
    const appearance = ((this.shouldShowAnswerInput() || this.shouldShowWagerInput()) ? 'action' : this.getAppearance());
    switch (appearance) {
      case 'action':
        return 'blue.100';
      case 'attention':
        return 'yellow.200';
      case 'correct':
        return 'green.200';
      case 'incorrect':
        return 'red.200';
      default:
        return 'gray.200';
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
    let content;
    if (this.shouldShowAnswerInput() || this.shouldShowWagerInput()) {
      if (this.shouldShowAnswerInput()) {
        let labelSize = 'sm';
        let label;
        if (this.props.currentWager) {
          label = (
            <React.Fragment>For <Bold>${this.props.currentWager.toLocaleString()}</Bold>: What is ...</React.Fragment>
          );
          labelSize = 'md';
        } else {
          label = 'What is ...';
        }
        content = <StatusBarInput id="answer-input"
                                  label={label}
                                  labelSize={labelSize}
                                  validate={this.validateAnswer}
                                  onSubmit={this.handleSubmitAnswer} />;
      } else {
        const category = this.props.activeClue.category;
        const [minWager, maxWager] = this.getWagerRange().map(value => value.toLocaleString());
        const label = (
          <React.Fragment>
            Enter your wager in the category <Bold>{category}</Bold> (${minWager} &ndash; ${maxWager}):
          </React.Fragment>
        );
        content = <StatusBarInput id="wager-input"
                                  label={label}
                                  labelSize="lg"
                                  leftElement="$"
                                  submitText="Wager"
                                  validate={this.validateWager}
                                  onSubmit={this.handleSubmitWager} />;
      }
    } else {
      content = <StatusBarText {...this.props} />;
    }
    return (
      <Card borderRadius="full" bg={this.getColor()} color="black" mt={5} py={2} userSelect="none">
        <Flex justify="center">{content}</Flex>
      </Card>
    );
  }
}

export default StatusBar;
