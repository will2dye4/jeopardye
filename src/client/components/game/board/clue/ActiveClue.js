import React from 'react';
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
    const skipIcon = document.getElementById('skip-icon');
    if (event.target === skipIcon || event.target.parentNode === skipIcon) {
      this.props.skipActiveClue(event);
    } else if (this.props.revealAnswer) {
      this.props.dismissActiveClue();
    } else if (this.props.allowAnswers) {
      this.props.buzzIn(this.props.gameState.gameID, this.props.gameState.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
      this.props.timerRef.current.pause();
    }
  }

  render() {
    let containerClasses = 'align-items-center current-clue-container row user-select-none';
    if (this.props.showClueAnimation) {
      containerClasses += ' animate__animated animate__zoomIn';
    }
    if (this.props.allowAnswers || this.props.revealAnswer) {
      containerClasses += ' hover-pointer';
    }

    const board = document.getElementById('board');
    const style = {width: board.offsetWidth * 1.02, height: board.offsetHeight};

    let content;
    if (this.props.showDailyDoubleWager) {
      content = <img src="/images/daily_double.jpg" alt="Daily Double" style={{...style, objectFit: 'cover'}} />;
    } else {
      content = (
        <React.Fragment>
          <div className="col-12 current-clue p-5 text-center text-uppercase">{this.state.text}</div>
          <ActiveClueButtons {...this.props} />
        </React.Fragment>
      );
    }

    return (
      <div className={containerClasses} style={style} onClick={this.handleClick}>
        {content}
      </div>
    );
  }
}

export default ActiveClue;
