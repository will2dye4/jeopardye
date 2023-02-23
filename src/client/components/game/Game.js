import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  DEFAULT_COUNTDOWN_SECONDS,
  FINAL_ROUND_COUNTDOWN_SECONDS,
  GAME_HISTORY_SCROLL_KEY,
  GAME_HISTORY_SIDE_KEY,
  GAME_HISTORY_SIZE_KEY,
  MAX_PLAYERS_PER_GAME,
  Rounds,
  WAGER_COUNTDOWN_SECONDS,
} from '../../../constants.mjs';
import {
  EventContext,
  formatList,
  getCountdownTimeInMillis,
  getUnplayedClues,
  getUnrevealedClues,
  hasMoreRounds,
  isDailyDouble,
} from '../../../utils.mjs';
import {
  getBuzzInMessage,
  getCorrectAnswerMessage,
  getEndOfRoundMessage,
  getIncorrectAnswerMessage,
  getLastClueMessage,
  getSelectClueMessage,
  getStartOfRoundMessage,
  getTimeElapsedMessage,
  getWaitingForBuzzMessage,
} from '../../messages';
import { getPlayerName } from '../../reducers/game_reducer';
import { isLocalStorageSettingEnabled, playSound, speakAnswer, speakClue } from '../../utils';
import './Game.css';
import Bold from '../common/Bold';
import Board from './board/Board';
import CountdownTimer from './CountdownTimer';
import EpisodeInfo from './episode/EpisodeInfo';
import GameHistory from './history/GameHistory';
import Podiums from './podium/Podiums';
import RoundSummary from './summary/RoundSummary';
import StatusBar from './status/StatusBar';

const BUZZER_LOCKOUT_DELAY_MILLIS = 1000;
const DISMISS_CLUE_DELAY_MILLIS = 5000;
const SHOW_CLUE_DELAY_MILLIS = 1000;

const BUZZER_LOCKED_OUT_TOAST_ID = 'buzzer-locked-out';

const LOADING_STATUS = 'Loading...';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buzzerLockedOut: false,
      gameHistoryScroll: (localStorage.getItem(GAME_HISTORY_SCROLL_KEY) ? isLocalStorageSettingEnabled(GAME_HISTORY_SCROLL_KEY) : true),
      gameHistorySide: localStorage.getItem(GAME_HISTORY_SIDE_KEY) || 'right',
      gameHistorySize: localStorage.getItem(GAME_HISTORY_SIZE_KEY) || 'xs',
      showActiveClue: !!props.activeClue,
      showClueAnimation: !!props.activeClue && props.game?.currentRound !== Rounds.FINAL,
      showDailyDoubleWager: false,
      showEpisodeInfo: false,
      showGameHistory: false,
      showRoundSummary: !!props.roundSummary,
      status: this.getInitialStatus(props),
      /* timers */
      defaultTimerPaused: false,
      defaultTimerRunning: false,
      defaultTimerWaiting: false,
      defaultTimerSeconds: DEFAULT_COUNTDOWN_SECONDS,
      defaultTimerUpdater: null,
      defaultTimerValue: 100,
      responseTimerPaused: false,
      responseTimerRunning: false,
      responseTimerWagering: false,
      responseTimerWaiting: false,
      responseTimerSeconds: DEFAULT_COUNTDOWN_SECONDS,
      responseTimerUpdater: null,
      responseTimerValue: 100,
      showResponseTimer: false,
    };
    this.closeEpisodeInfo = this.closeEpisodeInfo.bind(this);
    this.closeGameHistory = this.closeGameHistory.bind(this);
    this.dismissActiveClue = this.dismissActiveClue.bind(this);
    this.handleBuzz = this.handleBuzz.bind(this);
    this.handleClueClick = this.handleClueClick.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.markActiveClueAsInvalid = this.markActiveClueAsInvalid.bind(this);
    this.openEpisodeInfo = this.openEpisodeInfo.bind(this);
    this.openGameHistory = this.openGameHistory.bind(this);
    this.revealAnswer = this.revealAnswer.bind(this);
    this.toggleGameHistoryScroll = this.toggleGameHistoryScroll.bind(this);
    this.toggleGameHistorySide = this.toggleGameHistorySide.bind(this);
    this.toggleGameHistorySize = this.toggleGameHistorySize.bind(this);
    this.voteToSkipActiveClue = this.voteToSkipActiveClue.bind(this);
  }

  componentDidMount() {
    this.checkPlayerInGame();
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('Game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }

    if ((prevProps.board !== this.props.board || prevProps.game !== this.props.game) && this.state.showRoundSummary) {
      this.setState({showRoundSummary: false, status: this.getInitialStatus()});
    }

    this.checkPlayerInGame();

    if (!prevProps.activeClue && this.props.activeClue) {
      if (this.isFinalRound()) {
        this.setState({showActiveClue: true});
        this.startWaitingPeriod();
      } else {
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
                Playing <Bold>{this.props.activeClue.category}</Bold> for <Bold>${this.props.activeClue.value.toLocaleString()}</Bold> ...
              </React.Fragment>
            ),
          };
        }
        this.setState(newState);

        setTimeout(function() {
          this.setState({showActiveClue: true});
          if (showWager) {
            this.startResponseTimer(true);  /* start wager timer */
          } else if (!dailyDouble) {
            this.startWaitingPeriod();
            speakClue(this.props.activeClue);
          }
        }.bind(this), SHOW_CLUE_DELAY_MILLIS);

        if (dailyDouble) {
          playSound('/audio/daily_double.m4a');
        }
      }
    }

    if (!prevProps.prevAnswer && this.props.prevAnswer) {
      const playerID = this.props.prevAnswer.context.playerID;
      const isCurrentPlayer = (playerID === this.props.playerID);
      if (isCurrentPlayer || !this.isFinalRound()) {
        this.resetResponseTimer();
      }
      if (this.isFinalRound()) {
        if (this.props.responseTimerElapsed) {
          this.resetTimer();
        } else if (isCurrentPlayer) {
          this.startWaitingPeriod();
        }
      }
      const playerName = this.getPlayerName(playerID);
      if (this.props.prevAnswer.correct) {
        const tookControl = this.props.playerInControl !== prevProps.playerInControl;
        this.handleCorrectAnswer(isCurrentPlayer, tookControl, playerName);
      } else {
        this.handleIncorrectAnswer(isCurrentPlayer, false, playerName);
      }
      if (!isCurrentPlayer && !this.isFinalRound()) {
        const { answer, correct, value } = this.props.prevAnswer;
        const prefix = (correct ? '+' : '-');
        const amount = `${prefix}$${value.toLocaleString()}`;
        const title = (
          <React.Fragment>
            {this.getPlayerName(playerID)} answered "{answer.trim()}" (<Text as="span" whiteSpace="nowrap">{amount}</Text>)
          </React.Fragment>
        );
        this.props.toast({
          position: 'top',
          title: title,
          status: correct ? 'success' : 'error',
          isClosable: true,
        });
      }
    } else if (!prevProps.revealAnswer && this.props.revealAnswer) {
      const isCurrentPlayer = (this.isActiveDailyDouble() && this.playerHasControl());
      const isFinalRound = this.isFinalRound();
      this.revealAnswer(isCurrentPlayer, !isFinalRound, !isFinalRound);
    }

    if (!prevProps.currentWager && this.props.currentWager && !this.isFinalRound()) {
      if (this.playerHasControl()) {
        this.setState({showDailyDoubleWager: false});
        this.resetResponseTimer();
        this.startCountdown();
      } else {
        this.setStatus({
          emoji: 'hourglass',
          text: `Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer for $${this.props.currentWager.toLocaleString()}...`,
        });
      }
      speakClue(this.props.activeClue);
    }

    if (!prevProps.playerAnswering && this.props.playerAnswering && !this.isActiveDailyDouble() && !this.isFinalRound()) {
      this.pauseTimer();
      if (this.playerHasControl()) {
        this.startResponseTimer();
      } else {
        this.setStatus({
          emoji: 'hourglass',
          text: `Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer...`,
        });
      }
    }

    if (!prevProps.allowAnswers && this.props.allowAnswers && !this.isFinalRound()) {
      const spectating = this.playerIsSpectating();
      let status;
      if (!spectating && !this.props.activeClue.playersAttempted.includes(this.props.playerID)) {
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
      if (this.state.buzzerLockedOut) {
        const unlockedStatus = status;
        setTimeout(function() {
          let newState = {buzzerLockedOut: false};
          if (this.props.activeClue && this.props.allowAnswers && !this.props.playerAnswering) {
            newState.status = unlockedStatus;
          }
          this.setState(newState);
        }.bind(this), BUZZER_LOCKOUT_DELAY_MILLIS);
        status = {
          appearance: 'incorrect',
          emoji: 'locked',
          text: 'Buzzer locked out.',
        };
      }
      this.setStatus(status);
      this.startCountdown();
    }

    if (!prevProps.responseTimerElapsed && this.props.responseTimerElapsed) {
      let playerID;
      if (this.isActiveDailyDouble()) {
        playerID = this.props.playerInControl;
      } else {
        const playersAttempted = this.props.activeClue?.playersAttempted || [];
        playerID = playersAttempted[playersAttempted.length - 1];
      }
      const isCurrentPlayer = (playerID === this.props.playerID);
      const playerName = this.getPlayerName(playerID);
      this.handleIncorrectAnswer(isCurrentPlayer, true, playerName);
    }

    if (this.props.game && prevProps.players !== this.props.players &&
        Object.keys(this.props.players).length > Object.keys(prevProps.players).length) {
      let newPlayers = [];
      let playerJoined = false;
      Object.entries(this.props.players).forEach(([playerID, player]) => {
        if (!prevProps.players.hasOwnProperty(playerID)) {
          if (playerID === this.props.playerID) {
            playerJoined = true;
          } else {
            newPlayers.push(player.name);
          }
        }
      });
      if (newPlayers.length) {
        this.props.toast({
          position: 'top',
          title: `${formatList(newPlayers.sort())} joined the game.`,
          status: 'info',
          isClosable: true,
        });
      }
      if (playerJoined && this.props.game?.currentRound === Rounds.FINAL) {
        this.setStatus(this.getInitialStatus());
      }
      if (this.state.status.text === LOADING_STATUS && this.props.players.hasOwnProperty(this.props.playerInControl)) {
        this.setStatus(this.getInitialStatus());
      }
    } else if (this.props.game && prevProps.players !== this.props.players &&
      Object.keys(this.props.players).length < Object.keys(prevProps.players).length) {
      let leavingPlayers = [];
      let spectatingPlayers = [];
      let playerSpectated = false;
      Object.entries(prevProps.players).forEach(([playerID, player]) => {
        if (!this.props.players.hasOwnProperty(playerID)) {
          if (playerID === this.props.playerID) {
            if (this.props.spectators.hasOwnProperty(playerID)) {
              playerSpectated = true;
            }
          } else {
            if (this.props.spectators.hasOwnProperty(playerID)) {
              spectatingPlayers.push(player.name);
            } else {
              leavingPlayers.push(player.name);
            }
          }
        }
      });
      if (leavingPlayers.length) {
        this.props.toast({
          position: 'top',
          title: `${formatList(leavingPlayers.sort())} left the game.`,
          status: 'info',
          isClosable: true,
        });
      }
      if (spectatingPlayers.length) {
        this.props.toast({
          position: 'top',
          title: `${formatList(spectatingPlayers)} started spectating.`,
          status: 'info',
          isClosable: true,
        });
      }
      if (playerSpectated && this.props.game?.currentRound === Rounds.FINAL) {
        this.setStatus(this.getInitialStatus());
      }
    }

    if (this.props.game && prevProps.playersVotingToSkipClue !== this.props.playersVotingToSkipClue &&
        this.props.playersVotingToSkipClue.length > prevProps.playersVotingToSkipClue.length &&
        this.props.playersVotingToSkipClue.length !== Object.keys(this.props.players).length) {
      let newVoters = [];
      this.props.playersVotingToSkipClue.forEach(playerID => {
        if (!prevProps.playersVotingToSkipClue.includes(playerID)) {
          const name = (playerID === this.props.playerID ? 'You' : this.getPlayerName(playerID));
          newVoters.push(name);
        }
      });
      if (newVoters.length) {
        this.props.toast({
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
        if (!prevProps.playersMarkingClueInvalid.includes(playerID)) {
          const name = (playerID === this.props.playerID ? 'You' : this.getPlayerName(playerID));
          newPlayers.push(name);
        }
      });
      if (newPlayers.length) {
        this.props.toast({
          position: 'top',
          title: `${formatList(newPlayers)} marked this clue as invalid.`,
          status: 'info',
          isClosable: true,
        });
      }
    }

    if (this.props.hostOverride && this.props.hostOverride !== prevProps.hostOverride) {
      if (!this.playerIsHost()) {
        const { value } = this.props.hostOverride;
        const { playerID } = this.props.hostOverride.context;
        const hostName = (this.props.room ? getPlayerName(this.props.room.hostPlayerID) : 'Host');
        const playerName = (playerID === this.props.playerID ? 'your' : `${getPlayerName(playerID)}'s`);
        const toastID = `${playerName}-${value}`;
        if (!this.props.toast.isActive(toastID)) {
          this.props.toast({
            id: toastID,
            position: 'top',
            title: `${hostName} overrode the server's decision on ${playerName} previous answer (+$${value.toLocaleString()}).`,
            status: 'info',
            isClosable: true,
          });
        }
      }
      this.props.clearHostOverride(this.props.hostOverride);
    }

    if (!prevProps.roundSummary && this.props.roundSummary) {
      const delay = (this.props.prevAnswer && this.props.prevAnswer.correct ? SHOW_CLUE_DELAY_MILLIS : DISMISS_CLUE_DELAY_MILLIS);
      setTimeout(function() {
        this.setState({showRoundSummary: true});
      }.bind(this), delay);
    }

    if (prevProps.roundSummary && !this.props.roundSummary) {
      this.setState({showRoundSummary: false});
    }

    if (!prevProps.playerInControlReassigned && this.props.playerInControlReassigned) {
      const playerName = (this.props.playerInControl === this.props.playerID ? 'You' : getPlayerName(this.props.playerInControl));
      const verb = (playerName === 'You' ? 'are' : 'is');
      this.props.toast({
        position: 'top',
        title: `${playerName} ${verb} now in control of the board.`,
        status: 'info',
        isClosable: true,
      });
      if (!this.props.activeClue) {
        this.setStatus(this.getInitialStatus());
      }
      this.props.clearPlayerInControlReassigned();
    }

    if (!prevProps.activeClue?.played && this.props.activeClue?.played && this.isFinalRound() && !this.playerIsSpectating()) {
      this.startResponseTimer();
    }

    if (this.isFinalRound() && (prevProps.currentWager !== this.props.currentWager || prevProps.roundSummary !== this.props.roundSummary ||
        prevProps.activeClue !== this.props.activeClue || prevProps.allowAnswers !== this.props.allowAnswers ||
        prevProps.responseTimerElapsed !== this.props.responseTimerElapsed)) {
      this.setStatus(this.getInitialStatus());
    }

    if (this.isFinalRound() && !prevProps.responseTimerElapsed && this.props.responseTimerElapsed) {
      this.resetTimer();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  getEventContext(clue) {
    return new EventContext(this.props.roomID, this.props.game.gameID, this.props.playerID, clue?.categoryID, clue?.clueID);
  }

  checkPlayerInGame() {
    if (this.props.connected && this.props.game && this.props.playerID && !this.props.game.playerIDs.includes(this.props.playerID)) {
      if (Object.values(this.props.players).filter(player => player.active).length >= MAX_PLAYERS_PER_GAME) {
        console.log('Game is full. Becoming a spectator.');
        this.props.startSpectating(this.props.roomID, this.props.playerID);
      }
      console.log('Joining game...');
      this.props.joinGame(this.getEventContext());
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

  playerIsHost() {
    return (!!this.props.playerID && !!this.props.room && this.props.playerID === this.props.room.hostPlayerID);
  }

  playerIsSpectating() {
    return (!this.props.playerID || !this.props.players.hasOwnProperty(this.props.playerID));
  }

  getPlayerName(playerID) {
    return this.props.players[playerID]?.name;
  }

  isActiveDailyDouble() {
    return (!!this.props.board && !!this.props.activeClue && isDailyDouble(this.props.board, this.props.activeClue.clueID));
  }

  isFinalRound() {
    return (this.props.game?.currentRound === Rounds.FINAL);
  }

  getInitialStatus(props = null) {
    if (!props) {
      props = this.props;
    }
    let appearance = 'default';
    let status;
    let waiting = false;
    if (props.roundSummary) {
      status = getEndOfRoundMessage(false, false, props.roundSummary.round, props.roundSummary.gameOver);
    } else if (props.game?.currentRound === Rounds.FINAL) {
      if (props.activeClue?.played && props.responseTimerElapsed) {
        status = `All the responses are in! Let's see how everyone did.`;
      } else if (this.playerIsSpectating() || props.players[props.playerID]?.score <= 0 ||
           (!props.activeClue?.played && props.currentWager?.hasOwnProperty(props.playerID)) ||
           (props.activeClue?.played && props.activeClue.playersAttempted.includes(props.playerID))) {
        waiting = true;
        let action;
        let waitingPlayers;
        if (props.activeClue?.played) {
          action = 'answer';
          waitingPlayers = Object.values(props.players).filter(player => props.players[player.playerID]?.score > 0 && !props.activeClue.playersAttempted.includes(player.playerID));
        } else {
          action = 'wager';
          waitingPlayers = Object.values(props.players).filter(player => props.players[player.playerID]?.score > 0 && !props.currentWager?.hasOwnProperty(player.playerID));
        }
        if (waitingPlayers.length > 2) {
          status = `Waiting for ${waitingPlayers.length} players to ${action}...`;
        } else if (waitingPlayers.length) {
          status = `Waiting for ${formatList(waitingPlayers.map(player => player.name))} to ${action}...`;
        } else {
          status = `Waiting for ${this.playerIsSpectating() ? '' : 'other '}players to ${action}...`;
        }
        if (props.players[props.playerID]?.score <= 0) {
          status = `You must have a positive score to play the final round. ${status}`;
        }
      } else {
        // If it's the final round, the status bar will show the input for wagering/answering the clue.
        status = LOADING_STATUS;
      }
    } else if (!props.players.hasOwnProperty(props.playerInControl)) {
      status = LOADING_STATUS;
    } else {
      const fullBoardSize = CATEGORIES_PER_ROUND * CLUES_PER_CATEGORY;
      const unplayedClueCount = getUnplayedClues(props.board).length;
      const isNewRound = (unplayedClueCount === fullBoardSize || fullBoardSize - unplayedClueCount === getUnrevealedClues(props.board).length);
      const playerHasControl = this.playerHasControl();
      const playerName = props.players[props.playerInControl]?.name;
      status = getStartOfRoundMessage(props.game.currentRound, isNewRound, playerHasControl, props.playerInControlReassigned, playerName);
      if (playerHasControl) {
        appearance = 'action';
      }
    }
    let newStatus = {
      appearance: appearance,
      text: status,
    };
    if (waiting) {
      newStatus.emoji = 'hourglass';
    }
    return newStatus;
  }

  handleCorrectAnswer(isCurrentPlayer, tookControl, playerName) {
    if (this.isFinalRound()) {
      this.setState({defaultTimerWaiting: false, responseTimerWaiting: false});
      return;
    }
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
    this.resetTimer();
    this.checkForLastClue(isCurrentPlayer, true);
  }

  handleIncorrectAnswer(isCurrentPlayer, timeElapsed, playerName) {
    if (this.isFinalRound()) {
      this.setState({defaultTimerWaiting: false, responseTimerWaiting: false});
      return;
    }
    const dailyDouble = this.isActiveDailyDouble();
    const spectating = this.playerIsSpectating();
    let status;
    if (isCurrentPlayer || dailyDouble) {
      const response = (timeElapsed ? getTimeElapsedMessage(isCurrentPlayer, playerName) : getIncorrectAnswerMessage(isCurrentPlayer, playerName));
      status = {
        appearance: 'incorrect',
        text: response,
      };
    } else if (!spectating && !this.props.activeClue.playersAttempted.includes(this.props.playerID)) {
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
      this.props.toast({
        position: 'top',
        title: getTimeElapsedMessage(false, playerName, amount),
        status: 'error',
        isClosable: true,
      });
    }
    if (dailyDouble) {
      this.resetTimer();
      this.revealAnswer(isCurrentPlayer, false, false);
    } else {
      this.resumeTimer(this.props.answerDelayMillis);
    }
  }

  checkForLastClue(isCurrentPlayer, prevAnswerCorrect = false) {
    const appearance = (isCurrentPlayer ? (prevAnswerCorrect ? 'correct' : 'incorrect') : 'default');
    const unplayedClues = getUnplayedClues(this.props.board, 2);
    if (unplayedClues.length === 0) {
      const gameOver = !hasMoreRounds(this.props.game);
      this.setStatus({
        appearance: appearance,
        text: getEndOfRoundMessage(isCurrentPlayer, prevAnswerCorrect, this.props.game.currentRound, gameOver),
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
      if (this.props.skippedClue) {
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
    this.resetTimer();
    this.setState(newState);
    speakAnswer(this.props.activeClue.answer, SHOW_CLUE_DELAY_MILLIS);
    if (!this.isFinalRound()) {
      setTimeout(this.dismissActiveClue, DISMISS_CLUE_DELAY_MILLIS);
    }
  }

  dismissActiveClue() {
    const playerName = this.getPlayerName(this.props.playerInControl);
    const playerHasControl = this.playerHasControl();
    const timeElapsed = !this.props.prevAnswer;
    const dailyDouble = isDailyDouble(this.props.board, this.props.prevAnswer?.context?.clueID);
    const isCurrentPlayer = (playerHasControl && !dailyDouble && !timeElapsed && this.props.prevAnswer?.context?.playerID === this.props.playerID);
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
    this.resetTimer();
    this.props.dismissActiveClue();
    this.checkForLastClue(isCurrentPlayer, this.props.prevAnswer?.correct);
  }

  handleBuzz(event) {
    if (!this.props.activeClue || this.props.playerAnswering || this.props.revealAnswer || this.state.buzzerLockedOut ||
        this.isActiveDailyDouble() || this.props.activeClue.playersAttempted.includes(this.props.playerID)) {
      return;
    }
    if (this.props.allowAnswers) {
      if (event) {
        event.preventDefault();
      }
      this.props.buzzIn(EventContext.fromProps(this.props));
    } else {
      /* buzzed too early - lock the player out temporarily */
      this.setState({buzzerLockedOut: true});
      if (!this.props.toast.isActive(BUZZER_LOCKED_OUT_TOAST_ID)) {
        this.props.toast({
          id: BUZZER_LOCKED_OUT_TOAST_ID,
          position: 'top',
          title: `You buzzed too early!`,
          status: 'error',
          isClosable: true,
        });
      }
    }
  }

  handleClueClick(clue) {
    if (this.playerHasControl()) {
      this.props.selectClue(this.getEventContext(clue));
    }
  }

  handleKeyUp(event) {
    if (this.props.game?.currentRound === Rounds.FINAL) {
      return;
    }
    const spectating = this.playerIsSpectating();
    const key = event.key.toLowerCase();
    if ((key === ' ' || key === 'enter') && this.state.showActiveClue && !spectating) {
      this.handleBuzz(event);
    } else if (this.state.showActiveClue && !this.props.revealAnswer && !this.props.playerAnswering && !this.state.showDailyDoubleWager && !spectating) {
      if (key === 's' && !this.props.playersVotingToSkipClue.includes(this.props.playerID)) {
        console.log('Voting to skip the current clue...');
        event.preventDefault();
        this.voteToSkipActiveClue();
      } else if (key === 'i' && !this.props.playersMarkingClueInvalid.includes(this.props.playerID)) {
        console.log('Marking the current clue as invalid...');
        event.preventDefault();
        this.markActiveClueAsInvalid();
      }
    } else if (this.props.playerAnswering !== this.props.playerID) {
      if (key === 'h') {
        console.log('Opening game history');
        event.preventDefault();
        this.openGameHistory();
      } else if (key === 't') {
        console.log('Opening player stats');
        event.preventDefault();
        this.props.modals.playerStats.open();
      }
    }
  }

  markActiveClueAsInvalid(event) {
    if (event) {
      event.stopPropagation();
    }
    this.props.markClueAsInvalid(EventContext.fromProps(this.props));
  }

  voteToSkipActiveClue(event) {
    if (event) {
      event.stopPropagation();
    }
    this.props.voteToSkipClue(EventContext.fromProps(this.props));
  }

  openEpisodeInfo() {
    this.setState({showEpisodeInfo: true});
  }

  closeEpisodeInfo() {
    this.setState({showEpisodeInfo: false});
  }

  openGameHistory() {
    this.setState({showGameHistory: true});
  }

  closeGameHistory() {
    this.setState({showGameHistory: false});
  }

  toggleGameHistoryScroll() {
    const scroll = !this.state.gameHistoryScroll;
    localStorage.setItem(GAME_HISTORY_SCROLL_KEY, scroll.toString());
    this.setState({gameHistoryScroll: scroll});
  }

  toggleGameHistorySide() {
    const side = (this.state.gameHistorySide === 'left' ? 'right' : 'left');
    localStorage.setItem(GAME_HISTORY_SIDE_KEY, side);
    this.setState({gameHistorySide: side});
  }

  toggleGameHistorySize() {
    const size = (this.state.gameHistorySize === 'xs' ? 'md' : 'xs');
    localStorage.setItem(GAME_HISTORY_SIZE_KEY, size);
    this.setState({gameHistorySize: size});
  }

  getCountdownTimeInSeconds() {
    return getCountdownTimeInMillis(this.isActiveDailyDouble()) / 1000;
  }

  getDefaultTimerUpdater(startingValue = 100) {
    const interval = this.getCountdownTimeInSeconds() * 10;
    let value = startingValue;
    return setInterval(function() {
      value -= 1;
      const finished = (value <= 0);
      this.setState({
        defaultTimerRunning: !finished,
        defaultTimerValue: value,
      });
      if (finished) {
        this.cancelDefaultTimerUpdater();
      }
    }.bind(this), interval);
  }

  getResponseTimerUpdater(seconds) {
    const interval = seconds * 10;
    return setInterval(function() {
      const newValue = this.state.responseTimerValue - 1;
      const finished = (newValue <= 0);
      this.setState({
        responseTimerRunning: !finished,
        responseTimerValue: newValue,
      });
      if (finished) {
        this.cancelResponseTimerUpdater();
      }
    }.bind(this), interval);
  }

  startCountdown() {
    this.setState({
      defaultTimerSeconds: this.getCountdownTimeInSeconds(),
      defaultTimerRunning: true,
      defaultTimerWaiting: false,
      defaultTimerUpdater: this.getDefaultTimerUpdater(),
      defaultTimerValue: 100,
    });
  }

  startWaitingPeriod() {
    this.setState({defaultTimerWaiting: true});
  }

  startResponseTimer(wagering = false) {
    const seconds = (wagering ? WAGER_COUNTDOWN_SECONDS : (this.isFinalRound() ? FINAL_ROUND_COUNTDOWN_SECONDS : DEFAULT_COUNTDOWN_SECONDS));
    this.setState({
      responseTimerSeconds: seconds,
      responseTimerRunning: true,
      responseTimerWagering: wagering,
      responseTimerUpdater: this.getResponseTimerUpdater(seconds),
      responseTimerValue: 100,
      showResponseTimer: true,
    });
  }

  pauseTimer() {
    if (this.state.defaultTimerRunning && !this.state.defaultTimerPaused) {
      this.setState({
        defaultTimerRunning: false,
        defaultTimerPaused: true,
      });
      this.cancelDefaultTimerUpdater();
    }
  }

  resumeTimer(remainingDelayMillis) {
    if (this.state.defaultTimerPaused && !this.state.defaultTimerWaiting) {
      const newValue = (remainingDelayMillis / (this.getCountdownTimeInSeconds() * 1000)) * 100;
      this.resetResponseTimer();
      this.setState({
        defaultTimerRunning: true,
        defaultTimerPaused: false,
        defaultTimerUpdater: this.getDefaultTimerUpdater(newValue),
        defaultTimerValue: newValue,
      });
    }
  }

  resetTimer() {
    this.resetResponseTimer();
    this.cancelDefaultTimerUpdater();
    this.setState({
      defaultTimerRunning: false,
      defaultTimerPaused: false,
      defaultTimerValue: 100,
    });
  }

  resetResponseTimer() {
    this.cancelResponseTimerUpdater();
    this.setState({
      responseTimerRunning: false,
      responseTimerWagering: false,
      responseTimerValue: 100,
      showResponseTimer: false,
    });
  }

  cancelDefaultTimerUpdater() {
    if (this.state.defaultTimerUpdater !== null) {
      clearInterval(this.state.defaultTimerUpdater);
      this.setState({defaultTimerUpdater: null});
    }
  }

  cancelResponseTimerUpdater() {
    if (this.state.responseTimerUpdater !== null) {
      clearInterval(this.state.responseTimerUpdater);
      this.setState({responseTimerUpdater: null});
    }
  }

  render() {
    const gameState = {
      roomID: this.props.roomID,
      gameID: this.props.game?.gameID,
      currentRound: this.props.game?.currentRound,
      isFinalRound: (this.props.game?.currentRound === Rounds.FINAL),
      categories: this.props.board?.categories,
      episodeMetadata: this.props.game?.episodeMetadata,
      isDailyDouble: (this.props.board && this.props.activeClue ? this.isActiveDailyDouble() : false),
      playerID: this.props.playerID,
      playerScore: this.props.players[this.props.playerID]?.score || 0,
      playerHasControl: this.playerHasControl(),
      playerIsAdmin: this.props.isAdmin,
      playerIsHost: this.playerIsHost(),
      playerIsOwner: (!!this.props.playerID && !!this.props.room && this.props.playerID === this.props.room.ownerPlayerID),
      playerIsSpectating: this.playerIsSpectating(),
    };
    const modals = {
      ...this.props.modals,
      episodeInfo: {
        open: this.openEpisodeInfo,
        close: this.closeEpisodeInfo,
      },
      gameHistory: {
        open: this.openGameHistory,
        close: this.closeGameHistory,
        scroll: this.state.gameHistoryScroll,
        side: this.state.gameHistorySide,
        size: this.state.gameHistorySize,
        toggleScroll: this.toggleGameHistoryScroll,
        toggleSide: this.toggleGameHistorySide,
        toggleSize: this.toggleGameHistorySize,
      },
    };
    let timer;
    if (this.state.showResponseTimer) {
      timer = {
        paused: this.state.responseTimerPaused,
        running: this.state.responseTimerRunning,
        wagering: this.state.responseTimerWagering,
        waiting: this.state.responseTimerWaiting,
        seconds: this.state.responseTimerSeconds,
        updater: this.state.responseTimerUpdater,
        value: this.state.responseTimerValue,
      };
    } else {
      timer = {
        paused: this.state.defaultTimerPaused,
        running: this.state.defaultTimerRunning,
        wagering: false,
        waiting: this.state.defaultTimerWaiting,
        seconds: this.state.defaultTimerSeconds,
        updater: this.state.defaultTimerUpdater,
        value: this.state.defaultTimerValue,
      };
    }
    return (
      <Box id="game" className="game" p={6}>
        <CountdownTimer gameState={gameState} activeClue={this.props.activeClue}
                        showResponseTimer={this.state.showResponseTimer} timer={timer} />
        <Board gameState={gameState}
               activeClue={this.props.activeClue}
               currentWager={this.props.currentWager}
               allowAnswers={this.props.allowAnswers}
               revealAnswer={this.props.revealAnswer}
               prevAnswer={this.props.prevAnswer}
               responseTimerElapsed={this.props.responseTimerElapsed}
               handleBuzz={this.handleBuzz}
               playersMarkingClueInvalid={this.props.playersMarkingClueInvalid}
               playersVotingToSkipClue={this.props.playersVotingToSkipClue}
               playerAnswering={this.props.playerAnswering}
               handleClueClick={this.handleClueClick}
               markActiveClueAsInvalid={this.markActiveClueAsInvalid}
               voteToSkipActiveClue={this.voteToSkipActiveClue}
               {...this.state} />
        <StatusBar {...this.props} {...this.state} gameState={gameState} />
        {/* NOTE: To override modals, it's important to pass modals={modals} AFTER {...this.props} below! */}
        <Podiums {...this.props} gameState={gameState} modals={modals} />
        {this.state.showEpisodeInfo && <EpisodeInfo {...this.props} gameState={gameState} modals={modals} />}
        {this.state.showGameHistory && <GameHistory {...this.props} gameState={gameState} modals={modals} />}
        {this.state.showRoundSummary && <RoundSummary {...this.props} gameState={gameState} />}
      </Box>
    );
  }
}

export default Game;
