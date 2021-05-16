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

  handleClick() {
    if (this.props.reveal) {
      this.props.dismiss();
    } else if (this.props.allowAnswers) {
      this.props.buzzIn(this.props.gameID, this.props.playerID, this.props.clue.categoryID, this.props.clue.clueID);
      this.props.timerRef.current.pause();
    }
  }

  render() {
    let containerClasses = 'align-items-center current-clue-container row user-select-none animate__animated animate__zoomIn';
    const clueClasses = 'col-12 current-clue p-5 text-center text-uppercase';
    let buttons = [];
    if (this.props.allowAnswers) {
      buttons.push(<FontAwesomeIcon key="fast-forward" className="hover-pointer" icon={faFastForward} onClick={(event) => this.props.skipActiveClue(event)} />);
    }
    if (this.props.allowAnswers || this.props.reveal) {
      containerClasses += ' hover-pointer';
    }
    const board = document.getElementById('board');
    return (
      <div className={containerClasses} style={{width: board.offsetWidth * 1.02, height: board.offsetHeight}}
           onClick={() => this.handleClick()}>
        <div className={clueClasses}>{this.state.text}</div>
        <div className="current-clue-buttons mb-2 position-absolute">
          {buttons}
        </div>
      </div>
    );
  }
}

export default ActiveClue;
