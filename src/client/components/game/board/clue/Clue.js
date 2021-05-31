import React from 'react';
import { Box } from '@chakra-ui/react';

class Clue extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (!this.props.clue.played) {
      this.props.onClick(this);
    }
  }

  render() {
    let classes = 'clue-border';
    let text = <br />;
    if (!this.props.clue.played && this.props.clue.value) {
      if (this.props.gameState.playerHasControl) {
        classes += ' selectable-clue hover-pointer';
      }
      text = `$${this.props.clue.value}`;
    }
    return (
      <Box className="clue" userSelect="none" onClick={this.handleClick}>
        <Box className={classes} py={1}>{text}</Box>
      </Box>
    );
  }
}

export default Clue;
