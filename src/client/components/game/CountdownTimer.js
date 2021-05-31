import React from 'react';
import { getCountdownTimeInMillis } from '../../../utils.mjs';
import { DEFAULT_COUNTDOWN_SECONDS, WAGER_COUNTDOWN_SECONDS } from '../../../constants.mjs';
import { Progress, ProgressLabel } from '@chakra-ui/react';

function newTimerState() {
  return {
    finished: false,
    paused: false,
    running: false,
    waiting: false,
    seconds: DEFAULT_COUNTDOWN_SECONDS,
    updater: null,
    value: 100,
  };
}

class CountdownTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...newTimerState(),
      responseTimer: newTimerState(),
      showResponseTimer: false,
    };
    this.startCountdown = this.startCountdown.bind(this);
  }

  getCountdownTimeInSeconds() {
    return getCountdownTimeInMillis(this.props.gameState.isDailyDouble) / 1000;
  }

  getUpdater() {
    const interval = this.getCountdownTimeInSeconds() * 10;
    return setInterval(function() {
      const newValue = this.state.value - 1;
      const finished = (newValue <= 0);
      this.setState({finished: finished, running: !finished, value: newValue});
      if (finished) {
        this.cancelUpdater();
      }
    }.bind(this), interval);
  }

  getResponseTimeUpdater(seconds) {
    const interval = seconds * 10;
    return setInterval(function() {
      const newValue = this.state.responseTimer.value - 1;
      const finished = (newValue <= 0);
      this.setState({
        responseTimer: {
          ...this.state.responseTimer,
          finished: finished,
          running: !finished,
          value: newValue,
        },
      });
      if (finished) {
        this.cancelResponseTimeUpdater();
      }
    }.bind(this), interval);
  }

  startCountdown() {
    if (!this.state.finished) {
      this.setState({
        seconds: this.getCountdownTimeInSeconds(),
        running: true,
        waiting: false,
        updater: this.getUpdater(),
      });
    }
  }

  startWaitingPeriod() {
    if (!this.state.finished) {
      this.setState({waiting: true});
    }
  }

  startResponseTimer(wagering = false) {
    const seconds = (wagering ? WAGER_COUNTDOWN_SECONDS : DEFAULT_COUNTDOWN_SECONDS);
    if (!this.state.responseTimer.finished) {
      this.setState({
        responseTimer: {
          ...this.state.responseTimer,
          seconds: seconds,
          running: true,
          wagering: wagering,
          updater: this.getResponseTimeUpdater(seconds),
        },
        showResponseTimer: true,
      });
    }
  }

  pause() {
    if (this.state.running && !this.state.paused) {
      this.setState({
        running: false,
        paused: true,
      });
      this.cancelUpdater();
    }
  }

  resume(remainingDelayMillis) {
    if (!this.state.waiting && !this.state.finished && this.state.paused) {
      const newValue = (remainingDelayMillis / (this.getCountdownTimeInSeconds() * 1000)) * 100;
      this.resetResponseTimer();
      this.setState({
        running: true,
        paused: false,
        updater: this.getUpdater(),
        value: newValue,
      });
    }
  }

  reset() {
    this.resetResponseTimer();
    this.cancelUpdater();
    this.setState({
      finished: false,
      running: false,
      paused: false,
      value: 100,
    });
  }

  resetResponseTimer() {
    this.cancelResponseTimeUpdater();
    this.setState({
      responseTimer: {
        ...this.state.responseTimer,
        finished: false,
        running: false,
        wagering: false,
        value: 100,
      },
      showResponseTimer: false,
    });
  }

  cancelUpdater() {
    if (this.state.updater !== null) {
      clearInterval(this.state.updater);
      this.setState({updater: null});
    }
  }

  cancelResponseTimeUpdater() {
    if (this.state.responseTimer.updater !== null) {
      clearInterval(this.state.responseTimer.updater);
      this.setState({
        responseTimer: {
          ...this.state.responseTimer,
          updater: null,
        },
      });
    }
  }

  render() {
    const timer = (this.state.showResponseTimer ? this.state.responseTimer : this.state);
    let label, value;
    let color = 'green';
    let fontColor = 'white';
    let animated = false;
    if (timer.waiting) {
      animated = true;
      label = 'Waiting...'
      value = 100;
    } else {
      const answering = (this.state.showResponseTimer || this.props.gameState.isDailyDouble);
      color = (answering ? 'red' : 'purple');
      if (timer.running || timer.paused) {
        let verb = 'Buzz';
        if (timer.wagering) {
          verb = 'Wager';
        } else if (answering) {
          verb = 'Answer';
        }
        const secondsRemaining = Math.ceil(timer.value * timer.seconds / 100);
        label = `${verb} in ${secondsRemaining}`;
        value = timer.value;
        if (value < 52) {
          fontColor = 'black';
        }
      } else {
        value = 0;
      }
    }
    return (
      <Progress hasStripe={animated} isAnimated={animated} borderRadius="md" colorScheme={color} mb={3} height={30} value={value}>
        <ProgressLabel className="user-select-none" color={fontColor} fontSize="md" fontWeight="extrabold">{label}</ProgressLabel>
      </Progress>
    );
  }
}

export default CountdownTimer;
