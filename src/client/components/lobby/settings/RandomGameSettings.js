import React from 'react';
import { Badge } from '@chakra-ui/react';
import { DailyDoubleSettings, MAX_NUM_ROUNDS } from '../../../../constants.mjs';
import { range } from '../../../../utils.mjs';
import RadioToggleGroup from '../../common/form/RadioToggleGroup';
import ToggleSwitch from '../../common/form/ToggleSwitch';
import GameSetting from './GameSetting';

const NUM_ROUNDS_OPTIONS = range(MAX_NUM_ROUNDS).map(i => i + 1);
const DAILY_DOUBLE_OPTIONS = Object.entries(DailyDoubleSettings).filter(
  ([_, label]) => label !== DailyDoubleSettings.FROM_EPISODE).map(
  ([value, label]) => { return {label, value}; });

function RandomGameSettings(props) {
  return (
    <React.Fragment>
      <GameSetting label="Number of Rounds">
        <RadioToggleGroup name="num-rounds" currentValue={props.numRounds} onChange={props.onNumRoundsChanged}
                          options={NUM_ROUNDS_OPTIONS} disabled={props.disabled} />
      </GameSetting>
      <GameSetting label="Daily Doubles">
        <RadioToggleGroup name="daily-doubles" currentValue={props.dailyDoubles} onChange={props.onDailyDoublesChanged}
                          options={DAILY_DOUBLE_OPTIONS} disabled={props.disabled} />
      </GameSetting>
      <GameSetting label="Allow Unrevealed Clues">
        <ToggleSwitch name="allow-unrevealed-clues" checked={props.allowUnrevealedClues} disabled={props.disabled}
                      onChange={props.onAllowUnrevealedCluesChanged} />
      </GameSetting>
      <GameSetting label="Final Jeopardye">
        <ToggleSwitch name="final-jeopardye" checked={props.finalJeopardye} disabled={props.disabled}
                      onChange={props.onFinalJeopardyeChanged} />
        <Badge colorScheme="purple" ml={4} userSelect="none">Coming Eventually</Badge>
      </GameSetting>
    </React.Fragment>
  );
}

export default RandomGameSettings;
