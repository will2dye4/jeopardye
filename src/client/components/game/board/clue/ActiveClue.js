import React from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';
import ActiveClueButtons from './ActiveClueButtons';

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

  handleClick(event) {
    const invalidIcon = document.getElementById('invalid-icon');
    const skipIcon = document.getElementById('skip-icon');
    if ((event.target === invalidIcon || event.target.parentNode === invalidIcon) &&
        this.props.playersMarkingClueInvalid.indexOf(this.props.gameState.playerID) === -1) {
      this.props.markClueAsInvalid(this.props.gameState.gameID, this.props.gameState.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
    } else if (event.target === skipIcon || event.target.parentNode === skipIcon) {
      this.props.skipActiveClue(event);
    } else if (this.props.revealAnswer) {
      this.props.dismissActiveClue();
    } else if (this.props.allowAnswers) {
      this.props.buzzIn(this.props.gameState.gameID, this.props.gameState.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
      this.props.timerRef.current.pause();
    }
  }

  render() {
    let containerClasses = 'active-clue-container';
    if (this.props.showClueAnimation) {
      containerClasses += ' animate__animated animate__zoomIn';
    }
    if (this.props.allowAnswers || this.props.revealAnswer) {
      containerClasses += ' hover-pointer';
    }

    const board = document.getElementById('board');
    const width = (board ? board.offsetWidth : '100%');
    const height = (board ? board.offsetHeight : '100%');

    let content;
    if (this.props.showDailyDoubleWager) {
      content = <Image src="/images/daily_double.jpg" alt="Daily Double" w={width} h={height} objectFit="cover" />;
    } else {
      content = (
        <React.Fragment>
          <Box className="active-clue" p={5}>{this.state.text}</Box>
          <ActiveClueButtons {...this.props} />
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
