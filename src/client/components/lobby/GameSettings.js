import React from 'react';
import { range } from '../../../utils.mjs';

const DEFAULT_NUM_ROUNDS = 2;
const MAX_NUM_ROUNDS = 3;

const DAILY_DOUBLE_CHOICES = {
  NONE: 'None',
  NORMAL: 'Normal',
  DOUBLE: 'Double',
  QUADRUPLE: 'Quadruple',
}
const DEFAULT_DAILY_DOUBLES = DAILY_DOUBLE_CHOICES.NORMAL;

const DEFAULT_FINAL_JEOPARDYE = true;

class GameSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dailyDoubles: DEFAULT_DAILY_DOUBLES,
      finalJeopardye: DEFAULT_FINAL_JEOPARDYE,
      numRounds: DEFAULT_NUM_ROUNDS,
    };
    this.onDailyDoublesChanged = this.onDailyDoublesChanged.bind(this);
    this.onFinalJeopardyeChanged = this.onFinalJeopardyeChanged.bind(this);
    this.onNumRoundsChanged = this.onNumRoundsChanged.bind(this);
  }

  onDailyDoublesChanged(event) {
    this.setState({dailyDoubles: event.target.value});
  }

  onFinalJeopardyeChanged() {
    this.setState({finalJeopardye: !this.state.finalJeopardye});
  }

  onNumRoundsChanged(event) {
    this.setState({numRounds: parseInt(event.target.value)});
  }

  render() {
    return (
      <div className="card">
        <div className="card-body px-5 py-4">
          <h1 className="fw-bold text-center">Game Settings</h1>
          <div className="row my-5">
            <div className="col col-4 my-1">
              <div className="form-label fw-bold">Number of Rounds</div>
            </div>
            <div className="col">
              {range(MAX_NUM_ROUNDS).map(i => {
                const numRounds = i + 1;
                const id = `rounds-${numRounds}`;
                return (
                  <React.Fragment key={numRounds}>
                    <input type="radio"
                           className="btn-check"
                           name="num-rounds"
                           autoComplete="off"
                           id={id}
                           value={numRounds}
                           checked={this.state.numRounds === numRounds}
                           onChange={this.onNumRoundsChanged} />
                    <label className="btn btn-outline-primary num-rounds" htmlFor={id}>{numRounds}</label>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <div className="row my-5">
            <div className="col col-4 my-1">
              <div className="form-label fw-bold">Daily Doubles</div>
            </div>
            <div className="col">
              {Object.entries(DAILY_DOUBLE_CHOICES).map(([key, label]) => {
                const id = `daily-doubles-${label.toLowerCase()}`;
                return (
                  <React.Fragment key={key}>
                    <input type="radio"
                           className="btn-check"
                           name="daily-doubles"
                           autoComplete="off"
                           id={id}
                           value={label}
                           checked={this.state.dailyDoubles === label}
                           onChange={this.onDailyDoublesChanged} />
                    <label className="btn btn-outline-primary daily-doubles" htmlFor={id}>{label}</label>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <div className="row my-5">
            <div className="col col-4 my-1">
              <label className="form-label fw-bold" htmlFor="final-jeopardye">Final Jeopardye</label>
            </div>
            <div className="col">
              <div className="final-jeopardye-switch form-check form-switch">
                <input type="checkbox" className="form-check-input" name="final-jeopardye" id="final-jeopardye"
                       checked={this.state.finalJeopardye} onChange={this.onFinalJeopardyeChanged} />
                <div className="px-2 pt-1">{this.state.finalJeopardye ? 'On' : 'Off'}</div>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-center mt-5 mb-3">
            {/* TODO: give feedback that a game is being created when the button is clicked */}
            <button type="button" className="btn btn-primary btn-lg" onClick={this.props.fetchGame}>Start New Game</button>
          </div>
        </div>
      </div>
    );
  }
}

export default GameSettings;
