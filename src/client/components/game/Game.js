import React from 'react';
import { Box } from '@chakra-ui/react';
import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  DAILY_DOUBLE_MINIMUM_WAGER,
} from '../../../constants.mjs';
import { isDailyDouble } from '../../../utils.mjs';
import { getCorrectAnswerMessage, getIncorrectAnswerMessage, getTimeElapsedMessage } from '../../messages';
import { getUnplayedClues, markClueAsInvalid, playSound, speakClue } from '../../utils';
import './Game.css';
import Board from './board/Board';
import CountdownTimer from './CountdownTimer';
import Podiums from './podium/Podiums';
import StatusBar from './status/StatusBar';

const SHOW_CLUE_DELAY_MILLIS = 500;

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showActiveClue: !!props.activeClue,
      showClueAnimation: !!props.activeClue,
      showDailyDoubleWager: false,
      status: this.getInitialStatus(props),
      timerRef: React.createRef(),
    };
    this.dismissActiveClue = this.dismissActiveClue.bind(this);
    this.handleClueClick = this.handleClueClick.bind(this);
    this.revealAnswer = this.revealAnswer.bind(this);
    this.skipActiveClue = this.skipActiveClue.bind(this);
  }

  componentDidMount() {
    if (this.props.game && !this.props.connected) {
      console.log('Opening websocket connection...');
      this.props.websocketConnect();
    }

    document.addEventListener('keyup', function handleKeyUp(event) {
      const key = event.key.toLowerCase();
      if ((key === ' ' || key === 'enter') && this.state.showActiveClue) {
        if (this.props.allowAnswers && !this.props.playerAnswering) {
          event.preventDefault();
          this.props.buzzIn(this.props.game.gameID, this.props.player.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
        } else if (this.props.revealAnswer) {
          event.preventDefault();
          this.dismissActiveClue();
        }
      } else if (this.state.showActiveClue && !this.props.revealAnswer && !this.props.playerAnswering && !this.state.showDailyDoubleWager) {
        if (key === 's') {
          console.log('Skipping the current clue...');
          event.preventDefault();
          this.skipActiveClue();
        } else if (key === 'i' && this.props.playersMarkingClueInvalid.indexOf(this.props.player?.playerID) === -1) {
          event.preventDefault();
          markClueAsInvalid(this.props.activeClue.clueID).then(response => {
            if (response.ok) {
              this.props.markClueAsInvalid(this.props.game.gameID, this.props.player.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
            }
          });
        }
      }
    }.bind(this));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('Game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }

    if (this.props.game && this.props.player && !this.props.players.hasOwnProperty(this.props.player.playerID)) {
      console.log('Joining game...');
      this.props.joinGame(this.props.game.gameID, this.props.player);
    }

    if (!prevProps.activeClue && this.props.activeClue) {
      const dailyDouble = this.isActiveDailyDouble();
      const showWager = dailyDouble && this.playerHasControl();

      let newState = {showClueAnimation: true};
      if (showWager) {
        newState.showDailyDoubleWager = true;
      } else if (dailyDouble) {
        newState.status = `Waiting for ${this.getPlayerName(this.props.playerInControl)} to wager...`;
      } else {
        newState.status = (
          <React.Fragment>
            Playing <span className="fw-bold">{this.props.activeClue.category}</span> for <span className="fw-bold">${this.props.activeClue.value}</span> ...
          </React.Fragment>
        );
      }
      this.setState(newState);

      setTimeout(function() {
        this.setState({showActiveClue: true});
        if (showWager) {
          this.state.timerRef.current.startResponseTimer(true);  /* start wager timer */
        } else if (!dailyDouble) {
          this.state.timerRef.current.startWaitingPeriod();
          speakClue(this.props.activeClue);
        }
      }.bind(this), SHOW_CLUE_DELAY_MILLIS);

      if (dailyDouble) {
        playSound('/audio/daily_double.m4a');
      }
    }

    if (!prevProps.prevAnswer && this.props.prevAnswer) {
      this.state.timerRef.current.resetResponseTimer();
      const isCurrentPlayer = (this.props.prevAnswer.playerID === this.props.player.playerID);
      const playerName = this.getPlayerName(this.props.prevAnswer.playerID);
      if (this.props.prevAnswer.correct) {
        const tookControl = this.props.playerInControl !== prevProps.playerInControl;
        this.handleCorrectAnswer(isCurrentPlayer, tookControl, playerName);
      } else {
        this.handleIncorrectAnswer(isCurrentPlayer, false, playerName);
      }
    } else if (!prevProps.revealAnswer && this.props.revealAnswer) {
      const isCurrentPlayer = (this.isActiveDailyDouble() && this.playerHasControl());
      this.revealAnswer(isCurrentPlayer);
    }

    if (!prevProps.currentWager && this.props.currentWager) {
      if (this.playerHasControl()) {
        this.setState({showDailyDoubleWager: false});
        this.state.timerRef.current.resetResponseTimer();
        this.state.timerRef.current.startCountdown();
      } else {
        this.setStatus(`Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer for $${this.props.currentWager.toLocaleString()}...`);
      }
      speakClue(this.props.activeClue);
    }

    if (!prevProps.playerAnswering && this.props.playerAnswering && !this.isActiveDailyDouble()) {
      this.state.timerRef.current.pause();
      if (this.playerHasControl()) {
        this.state.timerRef.current.startResponseTimer();
      } else {
        this.setStatus(`Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer...`);
      }
    }

    if (!prevProps.allowAnswers && this.props.allowAnswers) {
      this.setStatus({
        appearance: 'action',
        emoji: 'bell',
        text: `Buzz in if you know the answer in ${this.props.activeClue.category}!`,
      });
      this.state.timerRef.current.startCountdown();
    }

    if (!prevProps.responseTimerElapsed && this.props.responseTimerElapsed) {
      if (this.state.showDailyDoubleWager) {
        this.props.submitWager(this.props.game.gameID, this.props.player.playerID,
                               this.props.activeClue.categoryID, this.props.activeClue.clueID, DAILY_DOUBLE_MINIMUM_WAGER);
      } else {
        const playersAttempted = this.props.activeClue.playersAttempted;
        const playerID = playersAttempted[playersAttempted.length - 1];
        const isCurrentPlayer = (playerID === this.props.player.playerID);
        const playerName = this.getPlayerName(playerID);
        this.handleIncorrectAnswer(isCurrentPlayer, true, playerName);
      }
    }
  }

  setStatus(status) {
    this.setState({status: status});
  }

  playerHasControl() {
    if (this.props.player) {
      const playerID = this.props.player.playerID;
      if (this.props.playerAnswering) {
        return (this.props.playerAnswering === playerID);
      }
      if (this.props.playerInControl) {
        return (this.props.playerInControl === playerID);
      }
    }
    return false;
  }

  getPlayerName(playerID) {
    return this.props.players[playerID]?.name;
  }

  isActiveDailyDouble() {
    return (!!this.props.board && !!this.props.activeClue && isDailyDouble(this.props.board, this.props.activeClue.clueID));
  }

  getInitialStatus(props = null) {
    if (!props) {
      props = this.props;
    }
    if (!props.game) {
      return 'Creating a new game, please wait ...';
    }
    const isNewGame = (getUnplayedClues(props.board).length === CATEGORIES_PER_ROUND * CLUES_PER_CATEGORY);
    const playerHasControl = this.playerHasControl();
    let status;
    if (isNewGame) {
      status = `Game started. ${this.getPlayerName(this.props.playerInControl)} will start the ${props.game.currentRound} Jeopardye round.`;
    } else {
      status = `Joined existing game in the ${props.game.currentRound} Jeopardye round.`;
      if (playerHasControl) {
        status += ` It's your turn!`;
      }
    }
    return {
      appearance: (playerHasControl ? 'action' : 'default'),
      text: status,
    };
  }

  handleCorrectAnswer(isCurrentPlayer, tookControl, playerName) {
    const response = getCorrectAnswerMessage(isCurrentPlayer, tookControl, playerName);
    this.setState({
      showActiveClue: false,
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: {
        appearance: 'correct',
        text: response,
      },
    });
    this.state.timerRef.current.reset();
    this.checkForLastClue(isCurrentPlayer);
  }

  handleIncorrectAnswer(isCurrentPlayer, timeElapsed, playerName) {
    let newState = {
      showClueAnimation: false,
      showDailyDoubleWager: false,
    };
    if (isCurrentPlayer) {
      const response = (timeElapsed ? getTimeElapsedMessage(playerName) : getIncorrectAnswerMessage(playerName));
      newState.status = {
        appearance: 'incorrect',
        text: response,
      };
    }
    this.setState(newState);
    if (this.isActiveDailyDouble()) {
      this.state.timerRef.current.reset();
      this.revealAnswer(isCurrentPlayer, false, false);
    } else {
      this.state.timerRef.current.resume(this.props.answerDelayMillis);
    }
  }

  checkForLastClue(prevAnswerCorrect = false) {
    let unplayedClues = getUnplayedClues(this.props.board, 2);
    if (unplayedClues.length === 0) {
      this.setState({status: `That's the end of the ${this.props.game.currentRound} Jeopardye round.`});
    } else if (unplayedClues.length === 1) {
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
      if (this.playerHasControl()) {
        setTimeout(function() {
          this.handleClueClick(clue);
        }.bind(this), SHOW_CLUE_DELAY_MILLIS * 2);
      }
    }
  }

  revealAnswer(isCurrentPlayer, playBuzzerSound = true, setStatus = true) {
    if (playBuzzerSound) {
      playSound('/audio/timer_elapsed.mp3');
    }
    let status;
    if (setStatus) {
      if (isCurrentPlayer) {
        status = getTimeElapsedMessage(this.getPlayerName(this.props.player.playerID));
      } else if (this.props.activeClue.playersAttempted.length > 0) {
        status = 'Time\'s up! Looks like no one got this one right.';
      } else {
        status = 'Time\'s up! No one buzzed in quickly enough.';
      }
    }
    let newState = {
      showClueAnimation: false,
      showDailyDoubleWager: false,
    };
    if (status) {
      newState.status = status;
    }
    this.setState(newState);
  }

  dismissActiveClue() {
    let status;
    if (this.playerHasControl()) {
      status = {
        appearance: 'action',
        text: 'Choose another clue.',
      };
    } else {
      status = `Waiting for ${this.getPlayerName(this.props.playerInControl)} to select another clue...`;
    }
    this.setState({
      showActiveClue: false,
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: status,
    });
    this.state.timerRef.current.reset();
    this.props.dismissActiveClue();
    this.checkForLastClue();
  }

  handleClueClick(clue) {
    this.props.selectClue(this.props.game.gameID, this.props.player.playerID, clue.categoryID, clue.clueID);
  }

  skipActiveClue(event) {
    if (event) {
      event.stopPropagation();
    }
    this.props.skipActiveClue();
  }

  render() {
    const gameState = {
      gameID: this.props.game?.gameID,
      currentRound: this.props.game?.currentRound,
      categories: this.props.board?.categories,
      isDailyDouble: (this.props.board && this.props.activeClue ? this.isActiveDailyDouble() : false),
      playerID: this.props.player?.playerID,
      playerScore: this.props.players[this.props.player?.playerID]?.score,
      playerHasControl: this.playerHasControl(),
    };
    return (
      <Box id="game" className="game" p={6}>
        <CountdownTimer gameState={gameState}
                        ref={this.state.timerRef}
                        activeClue={this.props.activeClue} />
        <Board gameState={gameState}
               activeClue={this.props.activeClue}
               allowAnswers={this.props.allowAnswers}
               revealAnswer={this.props.revealAnswer}
               buzzIn={this.props.buzzIn}
               markClueAsInvalid={this.props.markClueAsInvalid}
               playersMarkingClueInvalid={this.props.playersMarkingClueInvalid}
               dismissActiveClue={this.dismissActiveClue}
               handleClueClick={this.handleClueClick}
               skipActiveClue={this.skipActiveClue}
               {...this.state} />
        <StatusBar gameState={gameState} {...this.props} {...this.state} />
        <Podiums {...this.props} />
      </Box>
    );
  }
}

export default Game;
