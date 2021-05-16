import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFastForward } from '@fortawesome/free-solid-svg-icons';

class ActiveClue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.reveal ? props.clue.answer : props.clue.question,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.reveal && this.props.reveal) {
      this.setState({text: this.props.clue.answer});
      this.props.timerRef.current.reset();
    }
  }

  handleClick(event) {
    const skipIcon = document.getElementById('skip-icon');
    if (event.target === skipIcon || event.target.parentNode === skipIcon) {
      this.props.skipActiveClue(event);
    } else if (this.props.reveal) {
      this.props.dismiss();
    } else if (this.props.allowAnswers) {
      this.props.buzzIn(this.props.gameID, this.props.playerID, this.props.clue.categoryID, this.props.clue.clueID);
      this.props.timerRef.current.pause();
    }
  }

  render() {
    let containerClasses = 'align-items-center current-clue-container row user-select-none';
    if (this.props.showAnimation) {
      containerClasses += ' animate__animated animate__zoomIn';
    }
    if (this.props.allowAnswers || this.props.reveal) {
      containerClasses += ' hover-pointer';
    }

    const board = document.getElementById('board');
    const style = {width: board.offsetWidth * 1.02, height: board.offsetHeight};

    let content;
    if (this.props.showDailyDouble) {
      content = <img src="/images/daily_double.jpg" alt="Daily Double" style={{...style, objectFit: 'cover'}} />;
    } else {
      const clueClasses = 'col-12 current-clue p-5 text-center text-uppercase';
      let buttons = [];
      if (this.props.allowAnswers) {
        const skipIcon = <FontAwesomeIcon id="skip-icon"
                                          key="skip"
                                          icon={faFastForward}
                                          className="hover-pointer current-clue-button"
                                          title="Skip this clue" />;
        buttons.push(skipIcon);
      }
      content = (
        <React.Fragment>
          <div className={clueClasses}>{this.state.text}</div>
          <div className="current-clue-buttons mb-2 position-absolute">
            {buttons}
          </div>
        </React.Fragment>
      );
    }

    return (
      <div className={containerClasses} style={style} onClick={(event) => this.handleClick(event)}>
        {content}
      </div>
    );
  }
}

export default ActiveClue;
