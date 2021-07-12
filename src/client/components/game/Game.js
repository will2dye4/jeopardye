import React from 'react';
import { Box, Text, createStandaloneToast } from '@chakra-ui/react';
import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  GAME_HISTORY_SCROLL_KEY,
  GAME_HISTORY_SIDE_KEY,
  GAME_HISTORY_SIZE_KEY,
  MAX_PLAYERS_PER_GAME,
} from '../../../constants.mjs';
import { EventContext, formatList, getUnplayedClues, hasMoreRounds, isDailyDouble } from '../../../utils.mjs';
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
import JEOPARDYE_THEME from '../../theme';
import { isLocalStorageSettingEnabled, markClueAsInvalid, playSound, speakAnswer, speakClue } from '../../utils';
import './Game.css';
import Bold from '../common/Bold';
import Board from './board/Board';
import CountdownTimer from './CountdownTimer';
import GameHistory from './history/GameHistory';
import Podiums from './podium/Podiums';
import RoundSummary from './summary/RoundSummary';
import StatusBar from './status/StatusBar';
import {getPlayerName} from "../../reducers/game_reducer";

const DISMISS_CLUE_DELAY_MILLIS = 5000;
const SHOW_CLUE_DELAY_MILLIS = 1000;

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gameHistoryScroll: (localStorage.getItem(GAME_HISTORY_SCROLL_KEY) ? isLocalStorageSettingEnabled(GAME_HISTORY_SCROLL_KEY) : true),
      gameHistorySide: localStorage.getItem(GAME_HISTORY_SIDE_KEY) || 'right',
      gameHistorySize: localStorage.getItem(GAME_HISTORY_SIZE_KEY) || 'xs',
      showActiveClue: !!props.activeClue,
      showClueAnimation: !!props.activeClue,
      showDailyDoubleWager: false,
      showGameHistory: false,
      showRoundSummary: !!props.roundSummary,
      status: this.getInitialStatus(props),
      timerKey: Date.now(),
      timerRef: React.createRef(),
    };
    this.closeGameHistory = this.closeGameHistory.bind(this);
    this.dismissActiveClue = this.dismissActiveClue.bind(this);
    this.handleClueClick = this.handleClueClick.bind(this);
    this.markActiveClueAsInvalid = this.markActiveClueAsInvalid.bind(this);
    this.openGameHistory = this.openGameHistory.bind(this);
    this.revealAnswer = this.revealAnswer.bind(this);
    this.toggleGameHistoryScroll = this.toggleGameHistoryScroll.bind(this);
    this.toggleGameHistorySide = this.toggleGameHistorySide.bind(this);
    this.toggleGameHistorySize = this.toggleGameHistorySize.bind(this);
    this.voteToSkipActiveClue = this.voteToSkipActiveClue.bind(this);
  }

  componentDidMount() {
    this.checkPlayerInGame();

    document.addEventListener('keyup', function handleKeyUp(event) {
      const spectating = this.playerIsSpectating();
      const key = event.key.toLowerCase();
      if ((key === ' ' || key === 'enter') && this.state.showActiveClue && !spectating) {
        if (this.props.allowAnswers && !this.props.playerAnswering) {
          event.preventDefault();
          this.props.buzzIn(EventContext.fromProps(this.props));
        }
      } /*else if (this.state.showActiveClue && !this.props.revealAnswer && !this.props.playerAnswering && !this.state.showDailyDoubleWager && !spectating) {
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
          this.props.playerStats.open();
        }
      }*/
    }.bind(this));
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
      const playerID = this.props.prevAnswer.context.playerID;
      const isCurrentPlayer = (playerID === this.props.playerID);
      const playerName = this.getPlayerName(playerID);
      if (this.props.prevAnswer.correct) {
        const tookControl = this.props.playerInControl !== prevProps.playerInControl;
        this.handleCorrectAnswer(isCurrentPlayer, tookControl, playerName);
      } else {
        this.handleIncorrectAnswer(isCurrentPlayer, false, playerName);
      }
      if (!isCurrentPlayer) {
        const { answer, correct, value } = this.props.prevAnswer;
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
          emoji: 'hourglass',
          text: `Waiting for ${this.getPlayerName(this.props.playerAnswering)} to answer...`,
        });
      }
    }

    if (!prevProps.allowAnswers && this.props.allowAnswers) {
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
      this.setStatus(status);
      this.getTimerRef()?.startCountdown();
    }

    if (!prevProps.responseTimerElapsed && this.props.responseTimerElapsed) {
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
      if (Object.keys(this.props.players).length === this.props.game.playerIDs.length && this.state.status.text === 'Loading...') {
        this.setStatus(this.getInitialStatus());
      }
    } else if (this.props.game && prevProps.players !== this.props.players &&
      Object.keys(this.props.players).length < Object.keys(prevProps.players).length) {
      let leavingPlayers = [];
      let spectatingPlayers = [];
      Object.entries(prevProps.players).forEach(([playerID, player]) => {
        if (playerID !== this.props.playerID && !this.props.players.hasOwnProperty(playerID)) {
          if (this.props.spectators.hasOwnProperty(playerID)) {
            spectatingPlayers.push(player.name);
          } else {
            leavingPlayers.push(player.name);
          }
        }
      });
      if (leavingPlayers.length) {
        toast({
          position: 'top',
          title: `${formatList(leavingPlayers)} left the game.`,
          status: 'info',
          isClosable: true,
        });
      }
      if (spectatingPlayers.length) {
        toast({
          position: 'top',
          title: `${formatList(spectatingPlayers)} started spectating.`,
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
        if (!prevProps.playersVotingToSkipClue.includes(playerID)) {
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
        if (!prevProps.playersMarkingClueInvalid.includes(playerID)) {
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

    if (this.props.hostOverride && this.props.hostOverride !== prevProps.hostOverride) {
      if (!this.playerIsHost()) {
        const { value } = this.props.hostOverride;
        const { playerID } = this.props.hostOverride.context;
        const hostName = (this.props.room ? getPlayerName(this.props.room.hostPlayerID) : 'Host');
        const playerName = (playerID === this.props.playerID ? 'your' : `${getPlayerName(playerID)}'s`);
        const toastID = `${playerName}-${value}`;
        if (!toast.isActive(toastID)) {
          toast({
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
  }

  getEventContext(clue) {
    return new EventContext(this.props.roomID, this.props.game.gameID, this.props.playerID, clue?.categoryID, clue?.clueID);
  }

  checkPlayerInGame() {
    if (this.props.connected && this.props.game && this.props.playerID && !this.props.game.playerIDs.includes(this.props.playerID)) {
      if (Object.keys(this.props.players).length >= MAX_PLAYERS_PER_GAME) {
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
    let appearance = 'default';
    let status;
     if (props.roundSummary) {
      status = getEndOfRoundMessage(false, false, props.roundSummary.round, props.roundSummary.gameOver);
    } else if (Object.keys(props.players).length < props.game.playerIDs.length) {
      status = 'Loading...';
    } else {
      const isNewRound = (getUnplayedClues(props.board).length === CATEGORIES_PER_ROUND * CLUES_PER_CATEGORY);
      const playerHasControl = this.playerHasControl();
      const playerName = props.players[props.playerInControl]?.name;
      status = getStartOfRoundMessage(props.game.currentRound, isNewRound, playerHasControl, playerName);
      if (playerHasControl) {
        appearance = 'action';
      }
    }
    return {
      appearance: appearance,
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
    this.getTimerRef()?.reset();
    this.setState(newState);
    speakAnswer(this.props.activeClue.answer, SHOW_CLUE_DELAY_MILLIS);
    setTimeout(this.dismissActiveClue, DISMISS_CLUE_DELAY_MILLIS);
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
    this.getTimerRef()?.reset();
    this.props.dismissActiveClue();
    this.checkForLastClue(isCurrentPlayer, this.props.prevAnswer?.correct);
  }

  handleClueClick(clue) {
    if (this.playerHasControl()) {
      this.props.selectClue(this.getEventContext(clue));
    }
  }

  markActiveClueAsInvalid(event) {
    if (event) {
      event.stopPropagation();
    }
    markClueAsInvalid(this.props.activeClue.clueID).then(response => {
      if (response.ok) {
        this.props.markClueAsInvalid(EventContext.fromProps(this.props));
      }
    });
  }

  voteToSkipActiveClue(event) {
    if (event) {
      event.stopPropagation();
    }
    this.props.voteToSkipClue(EventContext.fromProps(this.props));
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

  render() {
    const gameHistory = {
      open: this.openGameHistory,
      close: this.closeGameHistory,
      scroll: this.state.gameHistoryScroll,
      side: this.state.gameHistorySide,
      size: this.state.gameHistorySize,
      toggleScroll: this.toggleGameHistoryScroll,
      toggleSide: this.toggleGameHistorySide,
      toggleSize: this.toggleGameHistorySize,
    };
    const gameState = {
      roomID: this.props.roomID,
      gameID: this.props.game?.gameID,
      currentRound: this.props.game?.currentRound,
      categories: this.props.board?.categories,
      isDailyDouble: (this.props.board && this.props.activeClue ? this.isActiveDailyDouble() : false),
      playerID: this.props.playerID,
      playerScore: this.props.players[this.props.playerID]?.score || 0,
      playerHasControl: this.playerHasControl(),
      playerIsHost: this.playerIsHost(),
      playerIsOwner: (!!this.props.playerID && !!this.props.room && this.props.playerID === this.props.room.ownerPlayerID),
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
        <Podiums gameHistory={gameHistory} gameState={gameState} {...this.props} />
        {this.state.showGameHistory && <GameHistory gameHistory={gameHistory} gameState={gameState} {...this.props} />}
        {this.state.showRoundSummary && <RoundSummary gameState={gameState} {...this.props} />}
      </Box>
    );
  }
}

export default Game;
