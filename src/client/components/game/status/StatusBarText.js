import React from 'react';
import { Text } from '@chakra-ui/react';

const BELL_EMOJI = '\uD83D\uDD14';
const CHECK_MARK_EMOJI = '\u2705';
const CROSS_MARK_EMOJI = '\u274C';
const EXCLAMATION_MARK_EMOJI = '\u2757';
const HOURGLASS_EMOJI = '\u23F3';
const QUESTION_MARK_EMOJI = '\u2753';
const TIMER_CLOCK_EMOJI = '\u23F2';

const EMOJI_NAME_TO_EMOJI = {
  'bell': BELL_EMOJI,
  'check_mark': CHECK_MARK_EMOJI,
  'cross_mark': CROSS_MARK_EMOJI,
  'exclamation': EXCLAMATION_MARK_EMOJI,
  'hourglass': HOURGLASS_EMOJI,
  'question': QUESTION_MARK_EMOJI,
  'timer_clock': TIMER_CLOCK_EMOJI,
}

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
        return EXCLAMATION_MARK_EMOJI;
      case 'correct':
        return CHECK_MARK_EMOJI;
      case 'incorrect':
        return CROSS_MARK_EMOJI;
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
