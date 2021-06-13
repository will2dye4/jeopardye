import React from 'react';
import { Text } from '@chakra-ui/react';
import { Emoji, EMOJI_NAME_TO_EMOJI } from '../../../../constants.mjs';

class StatusBarText extends React.Component {
  getAppearance() {
    if (this.props.status.hasOwnProperty('appearance')) {
      return this.props.status.appearance;
    }
    return null;
  }

  getEmoji() {
    if (this.props.status.hasOwnProperty('emoji')) {
      return EMOJI_NAME_TO_EMOJI[this.props.status.emoji];
    }
    switch (this.getAppearance()) {
      case 'action':
        return Emoji.EXCLAMATION_MARK;
      case 'correct':
        return Emoji.CHECK_MARK;
      case 'incorrect':
        return Emoji.CROSS_MARK;
      default:
        return null;
    }
  }

  render() {
    const appearance = this.getAppearance();
    const animate = (appearance === 'action' || appearance === 'attention' || (appearance === 'correct' && this.props.gameState.playerHasControl));
    const fontWeight = (animate ? 'bold' : 'normal');
    const classes = 'status-text' + (animate ? ' animate__animated animate__pulse animate__infinite' : '');
    const emoji = this.getEmoji();
    const text = (this.props.status.hasOwnProperty('text') ? this.props.status.text : this.props.status);
    return <Text className={classes} fontSize="3xl" fontWeight={fontWeight}>{emoji} {text}</Text>;
  }
}

export default StatusBarText;
