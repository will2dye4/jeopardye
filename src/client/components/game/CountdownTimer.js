import React from 'react';
import { getCountdownTimeInMillis } from '../../../utils.mjs';
import { DEFAULT_COUNTDOWN_SECONDS, WAGER_COUNTDOWN_SECONDS } from '../../../constants.mjs';

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
        if (this.props.onResponseTimeElapsed) {
          this.props.onResponseTimeElapsed();
        }
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
    let secondsRemaining, value;
    let classes = 'fs-5 progress-bar';
    if (timer.waiting) {
      classes += ' bg-warning text-dark progress-bar-striped progress-bar-animated';
      secondsRemaining = 'Waiting...'
      value = 100;
    } else {
      const answering = (this.state.showResponseTimer || this.props.gameState.isDailyDouble);
      classes += ' bg-' + (answering ? 'danger' : 'purple');
      if (timer.running || timer.paused) {
        classes += ' fw-bold';
        secondsRemaining = Math.ceil(timer.value * timer.seconds / 100);
        if (secondsRemaining > 1) {
          let verb = 'Buzz';
          if (timer.wagering) {
            verb = 'Wager';
          } else if (answering) {
            verb = 'Answer';
          }
          secondsRemaining = `${verb} in ${secondsRemaining}`;
        }
        value = timer.value;
      } else {
        value = 0;
      }
    }
    return (
      <div className="countdown-timer progress mb-3 user-select-none">
        <div className={classes} style={{width: `${value}%`}} role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
          {secondsRemaining}
        </div>
      </div>
    );
  }
}

export default CountdownTimer;
