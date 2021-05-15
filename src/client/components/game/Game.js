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
      status = {
        color: 'action',
        text: `Game started. Let's play the ${round} round.`,
      };
    }
    this.state = {
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: !!props.activeClue,
      status: status,
      timerRef: React.createRef(),
    };
  }

  componentDidMount() {
    if (!localStorage.getItem('playerID')) {
      localStorage.setItem('playerID', DEFAULT_PLAYER_ID);
      localStorage.setItem('playerName', DEFAULT_PLAYER_ID);
    }
    const playerID = localStorage.getItem('playerID');
    const playerName = localStorage.getItem('playerName') || playerID;
    this.props.setPlayer({playerID: playerID, name: playerName});

    document.addEventListener('keyup', function handleKeyUp(event) {
      if ((event.key === ' ' || event.key === 'Enter') && this.state.showActiveClue) {
        if (this.state.allowAnswers && !this.props.playerAnswering) {
          event.preventDefault();
          this.props.buzzIn(this.props.game.gameID, this.props.player.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
          this.state.timerRef.current.pause();
        } else if (this.state.revealAnswer) {
          event.preventDefault();
          this.dismissActiveClue();
        }
      }
    }.bind(this));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('New game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }
    if (!prevProps.connected && this.props.connected && this.props.game) {
      console.log('Websocket connection successful. Joining game...');
      this.props.joinGame(this.props.game.gameID, this.props.player);
      const round = (this.props.game.currentRound === Rounds.SINGLE ? 'first' : 'second');
      this.setState({
        status: {
          color: 'action',
          text: `Game started. Let's play the ${round} round.`,
        },
      });
    }
    if (!prevProps.prevAnswer && this.props.prevAnswer) {
      if (this.props.prevAnswer.correct) {
        this.setState({
          allowAnswers: false,
          revealAnswer: false,
          showActiveClue: false,
          status: {
            color: 'correct',
            text: 'Correct! Well done. Choose again.',
          },
        });
        this.state.timerRef.current.reset();
      } else {
        this.setState({
          allowAnswers: false,
          status: {
            color: 'incorrect',
            text: 'Sorry, no.',
          },
        });
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
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: false,
      status: {
        color: 'action',
        text: 'Choose another clue.',
      },
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
    this.props.selectClue(this.props.game.gameID, this.props.player.playerID, clue.categoryID, clue.clueID);
    this.setState({status: {text: status}});
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
    const playerID = (this.props.player ? this.props.player.playerID : null);
    return (
      <div id="game" className="game m-4">
        <CountdownTimer ref={this.state.timerRef}
                        seconds="10"
                        onTimeStarted={() => this.setState({allowAnswers: true})}
                        onTimeElapsed={() => this.revealAnswer()} />
        <Board gameID={this.props.game.gameID}
               playerID={playerID}
               categories={this.props.board.categories}
               handleClueClick={(clue) => this.handleClueClick(clue)}
               buzzIn={this.props.buzzIn}
               dismissActiveClue={() => this.dismissActiveClue()}
               activeClue={this.props.activeClue}
               {...this.state} />
        <StatusBar gameID={this.props.game.gameID}
                   playerID={playerID}
                   activeClue={this.props.activeClue}
                   playerAnswering={this.props.playerAnswering}
                   submitAnswer={this.props.submitAnswer}
                   status={this.state.status} />
        <div className="d-flex justify-content-center podium-container">
          {podiums}
        </div>
      </div>
    );
  }
}

export default Game;
