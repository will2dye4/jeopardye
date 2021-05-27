import React from 'react';
import {
  DailyDoubleSettings,
  DEFAULT_DAILY_DOUBLE_SETTING,
  DEFAULT_FINAL_JEOPARDYE,
  DEFAULT_NUM_ROUNDS,
  MAX_NUM_ROUNDS
} from '../../../../constants.mjs';
import { range } from '../../../../utils.mjs';
import GameSetting from './GameSetting';
import RadioToggleButton from './RadioToggleButton';
import ToggleSwitch from './ToggleSwitch';

class GameSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dailyDoubles: DEFAULT_DAILY_DOUBLE_SETTING,
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
      <div className="card game-settings">
        <div className="card-body px-5 py-4">
          <h1 className="fw-bold text-center">Game Settings</h1>
          <GameSetting label="Number of Rounds">
            {range(MAX_NUM_ROUNDS).map(i => i + 1).map(numRounds =>
              <RadioToggleButton itemKey={numRounds} value={numRounds} currentValue={this.state.numRounds}
                                 name="num-rounds" label={numRounds} onChange={this.onNumRoundsChanged} />
            )}
          </GameSetting>
          <GameSetting label="Daily Doubles">
            {Object.entries(DailyDoubleSettings).map(([key, label]) =>
              <RadioToggleButton itemKey={key} value={label} currentValue={this.state.dailyDoubles}
                                 name="daily-doubles" label={label} onChange={this.onDailyDoublesChanged} />
            )}
          </GameSetting>
          <GameSetting label="Final Jeopardye">
            <ToggleSwitch name="final-jeopardye" checked={this.state.finalJeopardye} onChange={this.onFinalJeopardyeChanged} />
          </GameSetting>
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
