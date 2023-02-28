import React from 'react';
import { Box, Flex, Image, Text } from '@chakra-ui/react';
import { formatDate } from '../../../../../utils.mjs';
import { getPlayerName } from '../../../../reducers/game_reducer';
import ActiveClueButtons from './ActiveClueButtons';
import ActiveClueLabel from './ActiveClueLabel';

const LONG_CLUE_LENGTH_THRESHOLD = 150;
const EXTRA_LONG_CLUE_LENGTH_THRESHOLD = LONG_CLUE_LENGTH_THRESHOLD + 60;

class ActiveClue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: this.getText(props),
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.revealAnswer && this.props.revealAnswer) {
      this.setState({text: this.props.activeClue.answer});
    }

    if (this.props.gameState.isFinalRound && ((!prevProps.activeClue?.played && this.props.activeClue?.played) ||
        (prevProps.playerAnswering !== this.props.playerAnswering) || (prevProps.prevAnswer !== this.props.prevAnswer))) {
      this.setState({text: this.getText()});
    }
  }

  getText(props) {
    if (!props) {
      props = this.props;
    }
    if (props.gameState.isFinalRound) {
      if (props.playerAnswering) {
        const { answer, correct, value } = props.prevAnswer || {};
        const playerName = getPlayerName(props.playerAnswering);
        const label = (answer?.trim()?.length > 0 ? `${playerName} answered:` : `${playerName} did not submit an answer.`);
        const prefix = (correct ? '+' : '-');
        const amount = `${prefix}$${value.toLocaleString()}`;
        const color = (correct ? 'green.200' : 'red.300');
        return (
          <React.Fragment>
            <ActiveClueLabel minW="400px">{label}</ActiveClueLabel>
            <Text>{answer}</Text>
            <Text mt={3} whiteSpace="nowrap">
              <Text as="span" bg={color} borderRadius={10} fontFamily="Helvetica, sans-serif" fontSize="3xl" textColor="black" textShadow="none" px={6} py={3}>
                {amount}
              </Text>
            </Text>
          </React.Fragment>
        );
      }
      if (props.activeClue?.played) {
        if (props.revealAnswer) {
          return (
            <React.Fragment>
              <ActiveClueLabel minW="350px">Correct Response</ActiveClueLabel>
              {props.activeClue.answer}
            </React.Fragment>
          );
        }
        return (props.responseTimerElapsed ? '' : props.activeClue.question);
      }
      return (
        <React.Fragment>
          <ActiveClueLabel>Final Category</ActiveClueLabel>
          {props.gameState.categories[props.activeClue.categoryID].name}
        </React.Fragment>
      );
    } else {
      return props.revealAnswer ? props.activeClue.answer : props.activeClue.question;
    }
  }

  allowBuzz() {
    return (this.props.allowAnswers && !this.props.playerAnswering && !this.props.gameState.playerIsSpectating &&
            !this.props.gameState.isFinalRound && !this.props.activeClue.playersAttempted.includes(this.props.gameState.playerID));
  }

  handleClick(event) {
    const invalidIcon = document.getElementById('invalid-icon');
    const skipIcon = document.getElementById('skip-icon');
    if (event.target === invalidIcon || event.target.parentNode === invalidIcon) {
      if (!this.props.playersMarkingClueInvalid.includes(this.props.gameState.playerID)) {
        this.props.markActiveClueAsInvalid(event);
      }
    } else if (event.target === skipIcon || event.target.parentNode === skipIcon) {
      if (!this.props.playersVotingToSkipClue.includes(this.props.gameState.playerID)) {
        this.props.voteToSkipActiveClue(event);
      }
    } else if (!this.props.gameState.playerIsSpectating && !this.props.gameState.isFinalRound) {
      this.props.handleBuzz();
    }
  }

  getTitle() {
    const category = this.props.activeClue.category;
    const clueValue = this.props.currentWager || this.props.activeClue.value;
    const value = (this.props.gameState.isFinalRound ? '' : ` for $${clueValue.toLocaleString()}`);
    const airDate = (this.props.activeClue.airDate ? `aired ${formatDate(this.props.activeClue.airDate)}` : 'unknown air date');
    return `${category}${value} (${airDate})`;
  }

  render() {
    let containerClasses = 'active-clue-container';
    if (this.props.showClueAnimation) {
      containerClasses += ' animate__animated animate__zoomIn';
    }
    if (this.allowBuzz()) {
      containerClasses += ' hover-pointer';
    }

    const board = document.getElementById('board');
    const width = (board ? board.offsetWidth : '100%');
    const height = (board ? board.offsetHeight : '100%');

    let content, title;
    if (this.props.gameState.isDailyDouble && !this.props.currentWager && !this.props.revealAnswer) {
      content = <Image src="/images/daily_double.jpg" alt="Daily Double" w={width} h={height} objectFit="contain" />;
    } else {
      let classes = 'active-clue';
      if (this.state.text.length > EXTRA_LONG_CLUE_LENGTH_THRESHOLD) {
        classes += ' active-clue-xs';
      } else if (this.state.text.length > LONG_CLUE_LENGTH_THRESHOLD) {
        classes += ' active-clue-sm';
      }
      content = (
        <React.Fragment>
          <Box className={classes} p={5} whiteSpace="pre-wrap">{this.state.text}</Box>
          {!this.props.gameState.playerIsSpectating && !this.props.gameState.isFinalRound && <ActiveClueButtons {...this.props} />}
        </React.Fragment>
      );
      title = this.getTitle();
    }

    return (
      <Flex align="center" justify="center" className={containerClasses} w={width} h={height} userSelect="none"
            onClick={this.handleClick} title={title}>
        {content}
      </Flex>
    );
  }
}

export default ActiveClue;
