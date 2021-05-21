import React from 'react';

const DEFAULT_COUNTDOWN_SECONDS = 10;
const DAILY_DOUBLE_COUNTDOWN_SECONDS = 20;

const MIN_CLUE_READING_DELAY_SECONDS = 5;
const MAX_CLUE_READING_DELAY_SECONDS = 15;

const READING_SPEED_WORDS_PER_MINUTE = 130;
const READING_SPEED_SECONDS_PER_WORD = 60 / READING_SPEED_WORDS_PER_MINUTE;

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
    return (this.props.gameState.isDailyDouble ? DAILY_DOUBLE_COUNTDOWN_SECONDS : DEFAULT_COUNTDOWN_SECONDS);
  }

  getClueReadingDelay() {
    const question = this.props.activeClue?.question || '';
    const words = question.split(/[-\s]/);
    const readingSpeed = words.length * READING_SPEED_SECONDS_PER_WORD;
    const seconds = Math.ceil(Math.min(Math.max(readingSpeed, MIN_CLUE_READING_DELAY_SECONDS), MAX_CLUE_READING_DELAY_SECONDS));
    return (seconds + Math.random()) * 1000;
  }

  getUpdater() {
    const interval = this.getCountdownTimeInSeconds() * 10;
    return setInterval(function() {
      const newValue = this.state.value - 1;
      const finished = (newValue <= 0);
      this.setState({finished: finished, running: !finished, value: newValue});
      if (finished) {
        this.cancelUpdater();
        if (this.props.onTimeElapsed) {
          this.props.onTimeElapsed();
        }
      }
    }.bind(this), interval);
  }

  getResponseTimeUpdater() {
    const interval = DEFAULT_COUNTDOWN_SECONDS * 10;
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
    this.setState({
      seconds: this.getCountdownTimeInSeconds(),
      running: true,
      waiting: false,
      updater: this.getUpdater(),
    });
    if (this.props.onTimeStarted) {
      this.props.onTimeStarted();
    }
  }

  start() {
    if (!this.state.finished) {
      if (this.props.gameState.isDailyDouble) {
        this.startCountdown();
      } else {
        this.setState({waiting: true});
        setTimeout(this.startCountdown, this.getClueReadingDelay());
      }
    }
  }

  startResponseTimer(wagering = false) {
    if (!this.state.responseTimer.finished) {
      this.setState({
        responseTimer: {
          ...this.state.responseTimer,
          running: true,
          wagering: wagering,
          updater: this.getResponseTimeUpdater(),
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

  resume() {
    if (!this.state.waiting && !this.state.finished && this.state.paused) {
      this.resetResponseTimer();
      this.setState({
        running: true,
        paused: false,
        updater: this.getUpdater(),
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
