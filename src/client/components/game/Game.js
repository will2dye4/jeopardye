import React from 'react';
import { Box, Text, createStandaloneToast } from '@chakra-ui/react';
import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  DAILY_DOUBLE_MINIMUM_WAGER,
  MAX_PLAYERS_PER_GAME,
} from '../../../constants.mjs';
import { formatList, getUnplayedClues, isDailyDouble } from '../../../utils.mjs';
import {
  getBuzzInMessage,
  getCorrectAnswerMessage,
  getEndOfRoundMessage,
  getIncorrectAnswerMessage,
  getLastClueMessage,
  getSelectClueMessage,
  getTimeElapsedMessage,
  getWaitingForBuzzMessage,
} from '../../messages';
import JEOPARDYE_THEME from '../../theme';
import { markClueAsInvalid, playSound, speakAnswer, speakClue } from '../../utils';
import './Game.css';
import Bold from '../common/Bold';
import Board from './board/Board';
import CountdownTimer from './CountdownTimer';
import Podiums from './podium/Podiums';
import RoundSummary from './summary/RoundSummary';
import StatusBar from './status/StatusBar';

const DISMISS_CLUE_DELAY_MILLIS = 5000;
const SHOW_CLUE_DELAY_MILLIS = 1000;

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showActiveClue: !!props.activeClue,
      showClueAnimation: !!props.activeClue,
      showDailyDoubleWager: false,
      showRoundSummary: false,
      status: this.getInitialStatus(props),
      timerKey: Date.now(),
      timerRef: React.createRef(),
    };
    this.dismissActiveClue = this.dismissActiveClue.bind(this);
    this.handleClueClick = this.handleClueClick.bind(this);
    this.markActiveClueAsInvalid = this.markActiveClueAsInvalid.bind(this);
    this.revealAnswer = this.revealAnswer.bind(this);
    this.voteToSkipActiveClue = this.voteToSkipActiveClue.bind(this);
  }

  componentDidMount() {
    this.checkPlayerInGame();

    document.addEventListener('keyup', function handleKeyUp(event) {
      if (this.playerIsSpectating()) {
        return;
      }
      const key = event.key.toLowerCase();
      if ((key === ' ' || key === 'enter') && this.state.showActiveClue) {
        if (this.props.allowAnswers && !this.props.playerAnswering) {
          event.preventDefault();
          this.props.buzzIn(this.props.game.gameID, this.props.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
        }
      } else if (this.state.showActiveClue && !this.props.revealAnswer && !this.props.playerAnswering && !this.state.showDailyDoubleWager) {
        if (key === 's' && this.props.playersVotingToSkipClue.indexOf(this.props.playerID) === -1) {
          console.log('Voting to skip the current clue...');
          event.preventDefault();
          this.voteToSkipActiveClue();
        } else if (key === 'i' && this.props.playersMarkingClueInvalid.indexOf(this.props.playerID) === -1) {
          console.log('Marking the current clue as invalid...');
          event.preventDefault();
          this.markActiveClueAsInvalid();
        }
      }
    }.bind(this));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('Game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }

    this.checkPlayerInGame();

    if (!prevProps.activeClue && this.props.activeClue) {
      const dailyDouble = this.isActiveDailyDouble();
      const showWager = dailyDouble && this.playerHasControl();

      let newState = {showClueAnimation: true};
      if (showWager) {
        newState.showDailyDoubleWager = true;
      } else if (dailyDouble) {
        newState.status = {
          emoji: 'hourglass',
          text: `Waiting for ${this.getPlayerName(this.props.playerInControl)} to wager...`,
        };
      } else {
        newState.status = {
          emoji: 'question',
          text: (
            <React.Fragment>
              Playing <Bold>{this.props.activeClue.category}</Bold> for <Bold>${this.props.activeClue.value}</Bold> ...
            </React.Fragment>
          ),
        };
      }
      this.setState(newState);

      setTimeout(function() {
        this.setState({showActiveClue: true});
        if (showWager) {
          this.getTimerRef()?.startResponseTimer(true);  /* start wager timer */
        } else if (!dailyDouble) {
          this.getTimerRef()?.startWaitingPeriod();
          speakClue(this.props.activeClue);
        }
      }.bind(this), SHOW_CLUE_DELAY_MILLIS);

      if (dailyDouble) {
        playSound('/audio/daily_double.m4a');
      }
    }

    if (!prevProps.prevAnswer && this.props.prevAnswer) {
      this.getTimerRef()?.resetResponseTimer();
      const isCurrentPlayer = (this.props.prevAnswer.playerID === this.props.playerID);
      const playerName = this.getPlayerName(this.props.prevAnswer.playerID);
      if (this.props.prevAnswer.correct) {
        const tookControl = this.props.playerInControl !== prevProps.playerInControl;
        this.handleCorrectAnswer(isCurrentPlayer, tookControl, playerName);
      } else {
        this.handleIncorrectAnswer(isCurrentPlayer, false, playerName);
      }
      if (!isCurrentPlayer) {
        const { playerID, answer, correct, value } = this.props.prevAnswer;
        const prefix = (correct ? '+' : '-');
        const amount = `${prefix}$${value.toLocaleString()}`;
        const title = (
          <React.Fragment>
            {this.getPlayerName(playerID)} answered "{answer.trim()}" (<Text as="span" whiteSpace="nowrap">{amount}</Text>)
          </React.Fragment>
        );
        toast({
          position: 'top',
          title: title,
          status: correct ? 'success' : 'error',
          isClosable: true,
        });
      }
    } else if (!prevProps.revealAnswer && this.props.revealAnswer) {
      const isCurrentPlayer = (this.isActiveDailyDouble() && this.playerHasControl());
      this.revealAnswer(isCurrentPlayer);
    }

    if (!prevProps.currentWager && this.props.currentWager) {
      if (this.playerHasControl()) {
        this.setState({showDailyDoubleWager: false});
        this.getTimerRef()?.resetResponseTimer();
        this.getTimerRef()?.startCountdown();
      } else {
        this.setStatus({
          emoji: 'hourglass',
          text: `Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer for $${this.props.currentWager.toLocaleString()}...`,
        });
      }
      speakClue(this.props.activeClue);
    }

    if (!prevProps.playerAnswering && this.props.playerAnswering && !this.isActiveDailyDouble()) {
      this.getTimerRef()?.pause();
      if (this.playerHasControl()) {
        this.getTimerRef()?.startResponseTimer();
      } else {
        this.setStatus({
          emoji: "hourglass",
          text: `Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer...`,
        });
      }
    }

    if (!prevProps.allowAnswers && this.props.allowAnswers) {
      const spectating = this.playerIsSpectating();
      let status;
      if (!spectating && this.props.activeClue.playersAttempted.indexOf(this.props.playerID) === -1) {
        status = {
          appearance: 'action',
          emoji: 'bell',
          text: getBuzzInMessage(this.props.activeClue.category),
        };
      } else {
        status = {
          emoji: 'hourglass',
          text: getWaitingForBuzzMessage(spectating),
        };
      }
      this.setStatus(status);
      this.getTimerRef()?.startCountdown();
    }

    if (!prevProps.responseTimerElapsed && this.props.responseTimerElapsed) {
      if (this.state.showDailyDoubleWager) {
        /* TODO - only do this for the player in control? */
        this.props.submitWager(this.props.game.gameID, this.props.playerID, this.props.activeClue.categoryID,
                               this.props.activeClue.clueID, DAILY_DOUBLE_MINIMUM_WAGER);
      } else {
        let playerID;
        if (this.isActiveDailyDouble()) {
          playerID = this.props.playerInControl;
        } else {
          const playersAttempted = this.props.activeClue.playersAttempted;
          playerID = playersAttempted[playersAttempted.length - 1];
        }
        const isCurrentPlayer = (playerID === this.props.playerID);
        const playerName = this.getPlayerName(playerID);
        this.handleIncorrectAnswer(isCurrentPlayer, true, playerName);
      }
    }

    if (this.props.game && prevProps.players !== this.props.players &&
        Object.keys(this.props.players).length > Object.keys(prevProps.players).length) {
      let newPlayers = [];
      Object.entries(this.props.players).forEach(([playerID, player]) => {
        if (playerID !== this.props.playerID && !prevProps.players.hasOwnProperty(playerID)) {
          newPlayers.push(player.name);
        }
      });
      if (newPlayers.length) {
        toast({
          position: 'top',
          title: `${formatList(newPlayers)} joined the game.`,
          status: 'info',
          isClosable: true,
        });
      }
    }

    if (this.props.game && prevProps.playersVotingToSkipClue !== this.props.playersVotingToSkipClue &&
        this.props.playersVotingToSkipClue.length > prevProps.playersVotingToSkipClue.length &&
        this.props.playersVotingToSkipClue.length !== Object.keys(this.props.players).length) {
      let newVoters = [];
      this.props.playersVotingToSkipClue.forEach(playerID => {
        if (prevProps.playersVotingToSkipClue.indexOf(playerID) === -1) {
          const name = (playerID === this.props.playerID ? 'You' : this.getPlayerName(playerID));
          newVoters.push(name);
        }
      });
      if (newVoters.length) {
        toast({
          position: 'top',
          title: `${formatList(newVoters)} voted to skip this clue.`,
          status: 'info',
          isClosable: true,
        });
      }
    }

    if (this.props.game && prevProps.playersMarkingClueInvalid !== this.props.playersMarkingClueInvalid &&
      this.props.playersMarkingClueInvalid.length > prevProps.playersMarkingClueInvalid.length) {
      let newPlayers = [];
      this.props.playersMarkingClueInvalid.forEach(playerID => {
        if (prevProps.playersMarkingClueInvalid.indexOf(playerID) === -1) {
          const name = (playerID === this.props.playerID ? 'You' : this.getPlayerName(playerID));
          newPlayers.push(name);
        }
      });
      if (newPlayers.length) {
        toast({
          position: 'top',
          title: `${formatList(newPlayers)} marked this clue as invalid.`,
          status: 'info',
          isClosable: true,
        });
      }
    }

    if (!prevProps.roundSummary && this.props.roundSummary) {
      setTimeout(function() {
        this.setState({showRoundSummary: true});
      }.bind(this), DISMISS_CLUE_DELAY_MILLIS);
    }

    if (prevProps.roundSummary && !this.props.roundSummary) {
      this.setState({showRoundSummary: false});
    }
  }

  checkPlayerInGame() {
    if (this.props.game && this.props.playerID && this.props.game.playerIDs.indexOf(this.props.playerID) === -1) {
      if (Object.keys(this.props.players).length >= MAX_PLAYERS_PER_GAME) {
        console.log('Game is full. Becoming a spectator.');
        this.props.startSpectating(this.props.playerID);
      }
      console.log('Joining game...');
      this.props.joinGame(this.props.game.gameID, this.props.playerID);
    }
  }

  setStatus(status) {
    this.setState({status: status});
  }

  playerHasControl() {
    if (this.props.playerID) {
      if (this.props.playerAnswering) {
        return (this.props.playerAnswering === this.props.playerID);
      }
      if (this.props.playerInControl) {
        return (this.props.playerInControl === this.props.playerID);
      }
    }
    return false;
  }

  playerIsSpectating() {
    return (!this.props.playerID || !this.props.players.hasOwnProperty(this.props.playerID));
  }

  getPlayerName(playerID) {
    return this.props.players[playerID]?.name;
  }

  getTimerRef() {
    if (!this.state.timerRef.current) {
      console.log('Replacing timer key');
      this.setState({timerKey: Date.now()});
    }
    return this.state.timerRef.current;
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
    const playerName = this.getPlayerName(this.props.playerInControl);
    let status;
    if (isNewGame) {
      status = `Game started. ${playerName} will start the ${props.game.currentRound} Jeopardye round.`;
    } else {
      status = `Joined existing game in the ${props.game.currentRound} Jeopardye round.`;
      if (playerHasControl) {
        status += ` It's your turn!`;
      } else {
        status += ` It's ${playerName}'s turn.`;
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
    if (!isCurrentPlayer) {
      speakAnswer(this.props.prevAnswer.clue.answer);
    }
    this.getTimerRef()?.reset();
    this.checkForLastClue(isCurrentPlayer, true);
  }

  handleIncorrectAnswer(isCurrentPlayer, timeElapsed, playerName) {
    const dailyDouble = this.isActiveDailyDouble();
    const spectating = this.playerIsSpectating();
    let status;
    if (isCurrentPlayer || dailyDouble) {
      const response = (timeElapsed ? getTimeElapsedMessage(isCurrentPlayer, playerName) : getIncorrectAnswerMessage(isCurrentPlayer, playerName));
      status = {
        appearance: 'incorrect',
        text: response,
      };
    } else if (!spectating && this.props.activeClue.playersAttempted.indexOf(this.props.playerID) === -1) {
      status = {
        appearance: 'action',
        emoji: 'bell',
        text: getBuzzInMessage(this.props.activeClue.category),
      };
    } else {
      status = getWaitingForBuzzMessage(spectating);
    }
    this.setState({
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: status,
    });
    if (!isCurrentPlayer && !dailyDouble && timeElapsed) {
      const amount = this.props.activeClue.value;
      toast({
        position: 'top',
        title: getTimeElapsedMessage(false, playerName, amount),
        status: 'error',
        isClosable: true,
      });
    }
    if (dailyDouble) {
      this.getTimerRef()?.reset();
      this.revealAnswer(isCurrentPlayer, false, false);
    } else {
      this.getTimerRef()?.resume(this.props.answerDelayMillis);
    }
  }

  checkForLastClue(isCurrentPlayer, prevAnswerCorrect = false) {
    const appearance = (isCurrentPlayer ? (prevAnswerCorrect ? 'correct' : 'incorrect') : 'default');
    const unplayedClues = getUnplayedClues(this.props.board, 2);
    if (unplayedClues.length === 0) {
      this.setStatus({
        appearance: appearance,
        text: getEndOfRoundMessage(isCurrentPlayer, prevAnswerCorrect, this.props.game.currentRound),
      });
    } else if (unplayedClues.length === 1) {
      this.setStatus({
        appearance: appearance,
        text: getLastClueMessage(isCurrentPlayer, prevAnswerCorrect),
      });
      if (this.playerHasControl()) {
        const clue = {...unplayedClues[0]};
        clue.category = this.props.board.categories[clue.categoryID].name;
        setTimeout(function() {
          this.handleClueClick(clue);
        }.bind(this), SHOW_CLUE_DELAY_MILLIS);
      }
    }
  }

  revealAnswer(isCurrentPlayer, playBuzzerSound = true, setStatus = true) {
    if (playBuzzerSound) {
      playSound('/audio/timer_elapsed.mp3');
    }
    let status;
    let emoji = 'timer_clock';
    if (setStatus) {
      if (this.props.playersVotingToSkipClue.length === Object.keys(this.props.players).length) {
        emoji = 'skip_forward';
        status = 'Everyone voted to skip this clue.';
      } else if (isCurrentPlayer) {
        status = getTimeElapsedMessage(this.getPlayerName(this.props.playerID));
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
      newState.status = {
        emoji: emoji,
        text: status,
      };
    }
    this.setState(newState);
    speakAnswer(this.props.activeClue.answer, SHOW_CLUE_DELAY_MILLIS);
    setTimeout(this.dismissActiveClue, DISMISS_CLUE_DELAY_MILLIS);
  }

  dismissActiveClue() {
    const playerName = this.getPlayerName(this.props.playerInControl);
    const playerHasControl = this.playerHasControl();
    const timeElapsed = !this.props.prevAnswer;
    const dailyDouble = isDailyDouble(this.props.board, this.props.prevAnswer?.clueID);
    const isCurrentPlayer = (playerHasControl && !dailyDouble && !timeElapsed && this.props.prevAnswer.playerID === this.props.playerID);
    let status;
    if (playerHasControl) {
      status = {
        appearance: 'action',
        text: getSelectClueMessage(playerName),
      };
    } else {
      status = {
        emoji: 'hourglass',
        text: `Waiting for ${playerName} to select another clue...`,
      };
    }
    this.setState({
      showActiveClue: false,
      showClueAnimation: false,
      showDailyDoubleWager: false,
      status: status,
    });
    this.getTimerRef()?.reset();
    this.props.dismissActiveClue();
    this.checkForLastClue(isCurrentPlayer, this.props.prevAnswer?.correct);
  }

  handleClueClick(clue) {
    if (this.playerHasControl()) {
      this.props.selectClue(this.props.game.gameID, this.props.playerID, clue.categoryID, clue.clueID);
    }
  }

  markActiveClueAsInvalid(event) {
    if (event) {
      event.stopPropagation();
    }
    markClueAsInvalid(this.props.activeClue.clueID).then(response => {
      if (response.ok) {
        this.props.markClueAsInvalid(this.props.game.gameID, this.props.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
      }
    });
  }

  voteToSkipActiveClue(event) {
    if (event) {
      event.stopPropagation();
    }
    this.props.voteToSkipClue(this.props.game.gameID, this.props.playerID, this.props.activeClue.categoryID, this.props.activeClue.clueID);
  }

  render() {
    const gameState = {
      gameID: this.props.game?.gameID,
      currentRound: this.props.game?.currentRound,
      categories: this.props.board?.categories,
      isDailyDouble: (this.props.board && this.props.activeClue ? this.isActiveDailyDouble() : false),
      playerID: this.props.playerID,
      playerScore: this.props.players[this.props.playerID]?.score || 0,
      playerHasControl: this.playerHasControl(),
      playerIsSpectating: this.playerIsSpectating(),
    };
    return (
      <Box id="game" className="game" p={6}>
        <CountdownTimer gameState={gameState}
                        key={this.state.timerKey}
                        ref={this.state.timerRef}
                        activeClue={this.props.activeClue} />
        <Board gameState={gameState}
               activeClue={this.props.activeClue}
               currentWager={this.props.currentWager}
               allowAnswers={this.props.allowAnswers}
               revealAnswer={this.props.revealAnswer}
               buzzIn={this.props.buzzIn}
               playersMarkingClueInvalid={this.props.playersMarkingClueInvalid}
               playersVotingToSkipClue={this.props.playersVotingToSkipClue}
               playerAnswering={this.props.playerAnswering}
               handleClueClick={this.handleClueClick}
               markActiveClueAsInvalid={this.markActiveClueAsInvalid}
               voteToSkipActiveClue={this.voteToSkipActiveClue}
               {...this.state} />
        <StatusBar gameState={gameState} {...this.props} {...this.state} />
        <Podiums gameState={gameState} {...this.props} />
        {this.state.showRoundSummary && <RoundSummary gameState={gameState} {...this.props} />}
      </Box>
    );
  }
}

export default Game;
