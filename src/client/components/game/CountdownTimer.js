import React from 'react';

class CountdownTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      finished: false,
      running: false,
      waiting: false,
      interval: props.seconds * 10,
      updater: null,
      value: 100,
    };
  }

  start() {
    if (!this.state.finished) {
      this.setState({waiting: true});
      const delay = (10 + Math.random()) * 1000;  // random delay between 10 and 11 seconds
      setTimeout(function() {
        const updater = setInterval(function() {
          const newValue = this.state.value - 1;
          const finished = (newValue <= 0);
          this.setState({finished: finished, running: !finished, value: newValue});
          if (finished) {
            this.cancelUpdater();
            if (this.props.onTimeElapsed) {
              this.props.onTimeElapsed();
            }
          }
        }.bind(this), this.state.interval);

        this.setState({
          running: true,
          waiting: false,
          updater: updater,
        });
        if (this.props.onTimeStarted) {
          this.props.onTimeStarted();
        }
      }.bind(this), delay);
    }
  }

  reset() {
    this.setState({
      finished: false,
      running: false,
      value: 100,
    });
    this.cancelUpdater();
  }

  cancelUpdater() {
    if (this.state.updater !== null) {
      clearInterval(this.state.updater);
      this.setState({updater: null});
    }
  }

  render() {
    let secondsRemaining, value;
    let classes = 'fs-5 progress-bar';
    if (this.state.waiting) {
      classes += ' bg-warning text-dark progress-bar-striped progress-bar-animated';
      secondsRemaining = 'Waiting...'
      value = 100;
    } else if (this.state.running) {
      classes += ' fw-bold bg-danger';
      secondsRemaining = Math.ceil(this.state.value * this.props.seconds / 100);
      value = this.state.value;
    } else {
      classes += ' bg-danger';
      value = 0;
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
