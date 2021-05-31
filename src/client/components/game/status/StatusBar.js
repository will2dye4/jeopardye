import React from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { getWagerRange } from '../../../../utils.mjs';
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
      document.getElementById('answer-input').focus();
    }
  }

  getAppearance() {
    if (this.props.status.hasOwnProperty('appearance')) {
      return this.props.status.appearance;
    }
    return null;
  }

  getColor() {
    switch (this.getAppearance()) {
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
        content = <StatusBarInput id="answer-input"
                                  label="What is ..."
                                  validate={this.validateAnswer}
                                  onSubmit={this.handleSubmitAnswer} />;
      } else {
        const category = this.props.activeClue.category;
        const [minWager, maxWager] = this.getWagerRange().map(value => value.toLocaleString());
        const label = (
          <React.Fragment>
            Enter your wager in the category <Text as="span" fontWeight="bold">{category}</Text> (${minWager} &ndash; ${maxWager}):
          </React.Fragment>
        );
        content = <StatusBarInput id="wager-input"
                                  label={label}
                                  largeLabel={true}
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
