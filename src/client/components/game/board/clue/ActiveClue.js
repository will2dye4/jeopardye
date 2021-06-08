import React from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';
import ActiveClueButtons from './ActiveClueButtons';

const LONG_CLUE_LENGTH_THRESHOLD = 150;
const EXTRA_LONG_CLUE_LENGTH_THRESHOLD = LONG_CLUE_LENGTH_THRESHOLD + 60;

class ActiveClue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.revealAnswer ? props.activeClue.answer : props.activeClue.question,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.revealAnswer && this.props.revealAnswer) {
      this.setState({text: this.props.activeClue.answer});
      this.props.timerRef.current.reset();
    }
  }

  allowBuzz() {
    return (this.props.allowAnswers && !this.props.playerAnswering && !this.props.gameState.playerIsSpectating &&
            this.props.activeClue.playersAttempted.indexOf(this.props.gameState.playerID) === -1);
  }

  handleClick(event) {
    const invalidIcon = document.getElementById('invalid-icon');
    const skipIcon = document.getElementById('skip-icon');
    if (event.target === invalidIcon || event.target.parentNode === invalidIcon) {
      if (this.props.playersMarkingClueInvalid.indexOf(this.props.gameState.playerID) === -1) {
        this.props.markActiveClueAsInvalid(event);
      }
    } else if (event.target === skipIcon || event.target.parentNode === skipIcon) {
      if (this.props.playersVotingToSkipClue.indexOf(this.props.gameState.playerID) === -1) {
        this.props.voteToSkipActiveClue(event);
      }
    } else if (this.allowBuzz()) {
      this.props.buzzIn(this.props.gameState.gameID, this.props.gameState.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
      this.props.timerRef.current.pause();
    }
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

    let content;
    if (this.props.gameState.isDailyDouble && !this.props.currentWager && !this.props.revealAnswer) {
      content = <Image src="/images/daily_double.jpg" alt="Daily Double" w={width} h={height} objectFit="cover" />;
    } else {
      let classes = 'active-clue';
      if (this.state.text.length > EXTRA_LONG_CLUE_LENGTH_THRESHOLD) {
        classes += ' active-clue-xs';
      } else if (this.state.text.length > LONG_CLUE_LENGTH_THRESHOLD) {
        classes += ' active-clue-sm';
      }
      content = (
        <React.Fragment>
          <Box className={classes} p={5}>{this.state.text}</Box>
          {!this.props.gameState.playerIsSpectating && <ActiveClueButtons {...this.props} />}
        </React.Fragment>
      );
    }

    return (
      <Flex align="center" justify="center" className={containerClasses} w={width} h={height} userSelect="none"
            onClick={this.handleClick}>
        {content}
      </Flex>
    );
  }
}

export default ActiveClue;
