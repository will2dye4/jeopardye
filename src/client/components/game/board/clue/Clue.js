import React from 'react';
import { Box } from '@chakra-ui/react';
import { formatDate } from '../../../../../utils.mjs';
import { isSafari } from '../../../../utils';

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
    const isActiveClue = (this.props.clue.clueID === this.props.activeClue?.clueID);
    const fontWeight = (isSafari() ? 'bold' : 'normal');
    let classes = 'clue-border';
    let text = <br />;
    let title;
    if ((!this.props.clue.played && this.props.clue.value) || isActiveClue) {
      if (isActiveClue) {
        classes += ' selected-clue';
      } else if (!this.props.activeClue && this.props.gameState.playerHasControl) {
        classes += ' selectable-clue hover-pointer';
      }
      text = `$${this.props.clue.value}`;
      title = (this.props.clue.airDate ? `Aired ${formatDate(this.props.clue.airDate)}` : 'Unknown air date');
    } else if (this.props.clue.unrevealed) {
      title = 'This clue was not revealed during the show.';
    }
    return (
      <Box className="clue" fontWeight={fontWeight} userSelect="none" onClick={this.handleClick}>
        <Box className={classes} py={1} title={title}>{text}</Box>
      </Box>
    );
  }
}

export default Clue;
