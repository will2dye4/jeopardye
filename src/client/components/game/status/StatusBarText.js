import React from 'react';

const CHECK_MARK_EMOJI = '\u2705';
const CROSS_MARK_EMOJI = '\u274c';

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
      case 'correct':
        return 'fw-bold animate__animated animate__pulse animate__infinite';
      default:
        return '';
    }
  }

  getEmoji() {
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
