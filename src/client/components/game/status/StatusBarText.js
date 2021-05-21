import React from 'react';

const BELL_EMOJI = '\uD83D\uDD14';
const CHECK_MARK_EMOJI = '\u2705';
const CROSS_MARK_EMOJI = '\u274C';
const TIMER_CLOCK_EMOJI = '\u23F2';

const EMOJI_NAME_TO_EMOJI = {
  'bell': BELL_EMOJI,
  'check_mark': CHECK_MARK_EMOJI,
  'cross_mark': CROSS_MARK_EMOJI,
  'timer_clock': TIMER_CLOCK_EMOJI,
}

class StatusBarText extends React.Component {
  getAppearance() {
    if (this.props.status.hasOwnProperty('appearance')) {
      return this.props.status.appearance;
    }
    return null;
  }

  getTextClasses() {
    switch (this.getAppearance()) {
      case 'action':
      case 'attention':
      case 'correct':
        return 'fw-bold animate__animated animate__pulse animate__infinite';
      default:
        return '';
    }
  }

  getEmoji() {
    if (this.props.status.hasOwnProperty('emoji')) {
      return EMOJI_NAME_TO_EMOJI[this.props.status.emoji];
    }
    switch (this.getAppearance()) {
      case 'correct':
        return CHECK_MARK_EMOJI;
      case 'incorrect':
        return CROSS_MARK_EMOJI;
      default:
        return null;
    }
  }

  render() {
    let text = (this.getAppearance() === null ? this.props.status : this.props.status.text);
    const emoji = this.getEmoji();
    if (emoji) {
      text = `${emoji} ${text}`;
    }
    return <div className={this.getTextClasses() + ' fs-2'}>{text}</div>;
  }
}

export default StatusBarText;
