import React from 'react';
import { faEyeLowVision } from '@fortawesome/free-solid-svg-icons';
import { Box, Flex } from '@chakra-ui/react';
import { formatDate } from '@dyesoft/alea-core';
import { isSafari } from '../../../../utils';
import Icon from '../../../common/Icon';

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
    const isContextual = this.props.clue.question?.match(/(heard|seen|shown) here/i);
    const borderColor = (this.props.activeClue && !this.props.showClueAnimation ? '#1D08A3' : 'white');
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
      <Box className="clue" border={`2px solid ${borderColor}`} fontWeight={fontWeight} position="relative" userSelect="none" onClick={this.handleClick}>
        <Box className={classes} py={1} title={title}>{text}</Box>
        {isContextual && !this.props.clue.played && (
          <Flex fontSize="sm" position="absolute" textColor="white" top={2} right={2}>
            <Icon id={`clue-contextual-icon-${this.props.clue.clueID}`} clickable={false} icon={faEyeLowVision}
                  title="This clue has missing context (audio, images, etc.)." />
          </Flex>
        )}
      </Box>
    );
  }
}

export default Clue;
