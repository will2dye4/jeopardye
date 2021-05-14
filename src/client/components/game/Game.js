import React from 'react';
import { DEFAULT_PLAYER_ID, Rounds } from '../../../constants.mjs';
import { playSound } from '../../utils';
import './Game.css';
import Board from './board/Board';
import CountdownTimer from './CountdownTimer';
import Podium from './Podium';
import StatusBar from './StatusBar';

const SHOW_CLUE_DELAY_MILLIS = 500;

class Game extends React.Component {
  constructor(props) {
    super(props);
    let status = 'Loading...';
    if (props.game) {
      const round = (props.game.currentRound === Rounds.SINGLE ? 'first' : 'second');
      status = `Game started. Let's play the ${round} round.`;
    }
    this.state = {
      playerToAct: !!props.game,
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: !!props.activeClue,
      status: status,
      timerRef: React.createRef(),
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('New game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }
    if (!prevProps.connected && this.props.connected && this.props.game) {
      console.log('Websocket connection successful. Joining game...');
      this.props.joinGame(this.props.game.gameID, DEFAULT_PLAYER_ID, DEFAULT_PLAYER_ID);
      const round = (this.props.game.currentRound === Rounds.SINGLE ? 'first' : 'second');
      this.setState({status: `Game started. Let's play the ${round} round.`, playerToAct: true});
    }
    if (!prevProps.prevAnswer && this.props.prevAnswer) {
      if (this.props.prevAnswer.correct) {
        this.setState({
          playerToAct: true,
          allowAnswers: false,
          revealAnswer: false,
          showActiveClue: false,
          status: 'Correct! Well done. Choose again.',
        });
        this.state.timerRef.current.reset();
      } else {
        this.setState({status: 'Sorry, no.'});
        this.state.timerRef.current.resume();
      }
    }
  }

  revealAnswer() {
    playSound(' https://www.soundboard.com/mediafiles/mt/MTMxOTQ5Nzc4MTMxOTcx_FJGXeSZhwls.mp3');
    this.setState({
      allowAnswers: false,
      revealAnswer: true,
      status: 'Time\'s up! No one buzzed in quickly enough.',
    });
  }

  dismissActiveClue() {
    this.setState({
      playerToAct: true,
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: false,
      status: 'Choose another clue.',
    });
    this.state.timerRef.current.reset();
    this.props.dismissActiveClue();
  }

  handleClueClick(clue) {
    let status = (
      <React.Fragment>
        Playing <span className="fw-bold">{clue.category}</span> for <span className="fw-bold">${clue.value}</span>...
      </React.Fragment>
    );
    this.props.selectClue(this.props.game.gameID, DEFAULT_PLAYER_ID, clue.categoryID, clue.clueID);
    this.setState({
      playerToAct: false,
      status: status,
    });
    setTimeout(function() {
      this.setState({
        showActiveClue: true,
      });
      this.state.timerRef.current.start();
    }.bind(this), SHOW_CLUE_DELAY_MILLIS);
  }

  render() {
    if (!this.props.game) {
      return (<div className="alert alert-primary fs-3 m-5 text-center" role="alert">Creating a new game, please wait...</div>);
    }
    const podiums = Object.values(this.props.players).map(player => {
      const active = (player.playerID === this.props.playerAnswering);
      return <Podium key={player.playerID} name={player.name} score={player.score} active={active} />
    });
    return (
      <div id="game" className="game m-4">
        <CountdownTimer ref={this.state.timerRef}
                        seconds="10"
                        onTimeStarted={() => this.setState({allowAnswers: true})}
                        onTimeElapsed={() => this.revealAnswer()} />
        <Board gameID={this.props.game.gameID}
               categories={this.props.board.categories}
               handleClueClick={(clue) => this.handleClueClick(clue)}
               buzzIn={this.props.buzzIn}
               dismissActiveClue={() => this.dismissActiveClue()}
               activeClue={this.props.activeClue}
               {...this.state} />
        <StatusBar gameID={this.props.game.gameID}
                   activeClue={this.props.activeClue}
                   playerAnswering={this.props.playerAnswering}
                   submitAnswer={this.props.submitAnswer}
                   action={this.state.playerToAct}
                   text={this.state.status} />
        <div className="d-flex justify-content-center podium-container">
          {podiums}
        </div>
      </div>
    );
  }
}

export default Game;
