import React from 'react';
import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  CORRECT_RESPONSES_KEEP_CONTROL,
  CORRECT_RESPONSES_TAKE_CONTROL,
  DEFAULT_PLAYER_ID,
  INCORRECT_RESPONSES,
  PLAYER_PLACEHOLDER,
  Rounds,
} from '../../../constants.mjs';
import { isDailyDouble, randomChoice } from '../../../utils.mjs';
import { getUnplayedClues, playSound } from '../../utils';
import './Game.css';
import Board from './board/Board';
import CountdownTimer from './CountdownTimer';
import Podium from './Podium';
import StatusBar from './StatusBar';

const SHOW_CLUE_DELAY_MILLIS = 500;

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: !!props.activeClue,
      showClueAnimation: !!props.activeClue,
      showDailyDoubleWager: false,
      status: this.getInitialStatus(props),
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
      const key = event.key.toLowerCase();
      if ((key === ' ' || key === 'enter') && this.state.showActiveClue) {
        if (this.state.allowAnswers && !this.props.playerAnswering) {
          event.preventDefault();
          this.props.buzzIn(this.props.game.gameID, this.props.player.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
          this.state.timerRef.current.pause();
        } else if (this.state.revealAnswer) {
          event.preventDefault();
          this.dismissActiveClue();
        }
      } else if (key === 's' && this.state.showActiveClue && !this.state.revealAnswer && !this.props.playerAnswering && !this.state.showDailyDoubleWager) {
        console.log('Skipping the current clue...');
        event.preventDefault();
        this.revealAnswer();
      }
    }.bind(this));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('Game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }
    if (!prevProps.connected && this.props.connected && this.props.game) {
      console.log('Websocket connection successful. Joining game...');
      this.props.joinGame(this.props.game.gameID, this.props.player);
      this.setState({status: this.getInitialStatus()});
    }
    if (!prevProps.prevAnswer && this.props.prevAnswer) {
      if (this.props.prevAnswer.correct) {
        const tookControl = this.props.playerInControl !== prevProps.playerInControl;
        this.handleCorrectAnswer(tookControl);
      } else {
        const dailyDouble = isDailyDouble(this.props.board, this.props.prevAnswer.clueID);
        this.handleIncorrectAnswer(dailyDouble);
      }
    }
    if (!prevProps.currentWager && this.props.currentWager) {
      this.setState({showDailyDoubleWager: false});
      this.state.timerRef.current.start();
    }
  }

  getInitialStatus(props = null) {
    if (!props) {
      props = this.props;
    }
    if (!props.game) {
      return 'Creating a new game, please wait ...';
    }
    const round = (props.game.currentRound === Rounds.SINGLE ? 'first' : 'second');
    const isNewGame = (getUnplayedClues(props.board).length === CATEGORIES_PER_ROUND * CLUES_PER_CATEGORY);
    const playerToAct = (props.playerInControl === props.player.playerID);
    let status;
    if (isNewGame) {
      status = `Game started. Let's play the ${round} round.`;
    } else {
      status = `Joined existing game in the ${round} round.`;
    }
    if (playerToAct) {
      status += ` It's your turn!`;
    }
    return {
      appearance: (playerToAct ? 'action' : 'default'),
      text: status,
    };
  }

  handleCorrectAnswer(tookControl) {
    const responses = (tookControl ? CORRECT_RESPONSES_TAKE_CONTROL : CORRECT_RESPONSES_KEEP_CONTROL);
    const response = randomChoice(responses).replaceAll(PLAYER_PLACEHOLDER, this.props.player.name);
    this.setState({
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: false,
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: {
        appearance: 'correct',
        text: response,
      },
    });
    this.state.timerRef.current.reset();
    this.checkForLastClue(true);
  }

  handleIncorrectAnswer(dailyDouble) {
    const response = randomChoice(INCORRECT_RESPONSES).replaceAll(PLAYER_PLACEHOLDER, this.props.player.name);
    this.setState({
      allowAnswers: false,  /* TODO - only set this to false for the player who answered incorrectly */
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: {
        appearance: 'incorrect',
        text: response,
      },
    });
    if (dailyDouble) {
      this.state.timerRef.current.reset();
      this.revealAnswer(false, false);
    } else {
      this.state.timerRef.current.resume();
    }
  }

  checkForLastClue(prevAnswerCorrect = false) {
    let unplayedClues = getUnplayedClues(this.props.board, 2);
    if (unplayedClues.length === 1) {
      let clue = {...unplayedClues[0]};
      clue.category = this.props.board.categories[clue.categoryID].name;
      let status = 'And now the last clue ...';
      if (prevAnswerCorrect) {
        status = {
          appearance: 'correct',
          text: 'Correct! And now the last clue ...',
        };
      }
      this.setState({status: status});
      if (this.props.player.playerID === this.props.playerInControl) {
        setTimeout(function() {
          this.handleClueClick(clue);
        }.bind(this), SHOW_CLUE_DELAY_MILLIS);
      }
    }
  }

  revealAnswer(playBuzzerSound = true, setStatus = true) {
    if (playBuzzerSound) {
      playSound('/audio/timer_elapsed.mp3');
    }
    let status;
    if (setStatus) {
      if (isDailyDouble(this.props.board, this.props.activeClue.clueID)) {
        status = 'Sorry, you didn\'t answer in time.';
      } else {
        status = 'Time\'s up! No one buzzed in quickly enough.';  /* TODO - show a different message if anyone buzzed in */
      }
    }
    let newState = {
      allowAnswers: false,
      revealAnswer: true,
      showClueAnimation: false,
      showDailyDoubleWager: false,
    };
    if (status) {
      newState.status = status;
    }
    this.setState(newState);
    this.props.revealAnswer();
  }

  dismissActiveClue() {
    this.setState({
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: false,
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: {
        appearance: 'action',
        text: 'Choose another clue.',
      },
    });
    this.state.timerRef.current.reset();
    this.props.dismissActiveClue();
    this.checkForLastClue();
  }

  handleClueClick(clue) {
    let status = (
      <React.Fragment>
        Playing <span className="fw-bold">{clue.category}</span> for <span className="fw-bold">${clue.value}</span> ...
      </React.Fragment>
    );
    this.props.selectClue(this.props.game.gameID, this.props.player.playerID, clue.categoryID, clue.clueID);

    const dailyDouble = isDailyDouble(this.props.board, clue.clueID);
    this.setState({
      showClueAnimation: true,
      showDailyDoubleWager: isDailyDouble(this.props.board, clue.clueID),
      status: status,
    });

    setTimeout(function() {
      this.setState({showActiveClue: true});
      if (!dailyDouble) {
        this.state.timerRef.current.start();
      }
    }.bind(this), SHOW_CLUE_DELAY_MILLIS);

    if (dailyDouble) {
      playSound('/audio/daily_double.m4a');
    }
  }

  skipActiveClue(event) {
    event.stopPropagation();
    this.revealAnswer();
  }

  render() {
    const gameState = {
      gameID: this.props.game?.gameID,
      currentRound: this.props.game?.currentRound,
      categories: this.props.board?.categories,
      isDailyDouble: (this.props.board && this.props.activeClue ? isDailyDouble(this.props.board, this.props.activeClue.clueID) : false),
      playerID: this.props.player?.playerID,
      playerScore: this.props.players[this.props.player?.playerID]?.score,
    };
    const podiums = Object.values(this.props.players).map(player => {
      const active = (player.playerID === this.props.playerAnswering);
      return <Podium key={player.playerID} name={player.name} score={player.score} active={active} />
    });
    return (
      <div id="game" className="game m-4">
        <CountdownTimer ref={this.state.timerRef}
                        seconds="10"
                        onTimeStarted={() => this.setState({allowAnswers: !gameState.isDailyDouble})}
                        onTimeElapsed={() => this.revealAnswer()} />
        <Board gameState={gameState}
               activeClue={this.props.activeClue}
               buzzIn={this.props.buzzIn}
               dismissActiveClue={() => this.dismissActiveClue()}
               handleClueClick={(clue) => this.handleClueClick(clue)}
               skipActiveClue={(event) => this.skipActiveClue(event)}
               {...this.state} />
        <StatusBar gameState={gameState} {...this.props} {...this.state} />
        <div className="d-flex justify-content-center podium-container">
          {podiums}
        </div>
      </div>
    );
  }
}

export default Game;
