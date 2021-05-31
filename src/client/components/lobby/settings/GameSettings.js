import React from 'react';
import { Box, Button, Flex, Heading, Progress } from '@chakra-ui/react';
import {
  DailyDoubleSettings,
  DEFAULT_DAILY_DOUBLE_SETTING,
  DEFAULT_FINAL_JEOPARDYE,
  DEFAULT_NUM_ROUNDS,
  MAX_NUM_ROUNDS
} from '../../../../constants.mjs';
import { GameSettings as Settings } from '../../../../models/game.mjs';
import { range } from '../../../../utils.mjs';
import Card from '../../common/card/Card';
import GameSetting from './GameSetting';
import RadioToggleGroup from './RadioToggleGroup';
import ToggleSwitch from './ToggleSwitch';

const NUM_ROUNDS_OPTIONS = range(MAX_NUM_ROUNDS).map(i => i + 1);
const DAILY_DOUBLE_OPTIONS = Object.entries(DailyDoubleSettings).map(([value, label]) => { return {label, value}; });

class GameSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      creatingGame: false,
      dailyDoubles: DEFAULT_DAILY_DOUBLE_SETTING,
      finalJeopardye: DEFAULT_FINAL_JEOPARDYE,
      numRounds: DEFAULT_NUM_ROUNDS,
    };
    this.createNewGame = this.createNewGame.bind(this);
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

  createNewGame() {
    this.setState({creatingGame: true});
    const playerIDs = Object.keys(this.props.players);
    const gameSettings = new Settings(this.state.numRounds, this.state.dailyDoubles, this.state.finalJeopardye, playerIDs);
    this.props.fetchNewGame(gameSettings);
  }

  render() {
    if (this.state.creatingGame) {
      return (
        <Card className="game-settings">
          <Box className="game-starting" textAlign="center">
            <Heading>A new game is starting, please wait...</Heading>
            <Progress hasStripe isAnimated borderRadius="md" colorScheme="jeopardyBlue" size="lg" mx={8} mt={10} value={100} />
          </Box>
        </Card>
      );
    }
    return (
      <Card className="game-settings" px={8} py={6}>
        <Heading mb={5} textAlign="center">Game Settings</Heading>
        <GameSetting label="Number of Rounds">
          <RadioToggleGroup name="num-rounds" currentValue={this.state.numRounds} onChange={this.onNumRoundsChanged}
                            options={NUM_ROUNDS_OPTIONS} />
        </GameSetting>
        <GameSetting label="Daily Doubles">
          <RadioToggleGroup name="daily-doubles" currentValue={this.state.dailyDoubles} onChange={this.onDailyDoublesChanged}
                            options={DAILY_DOUBLE_OPTIONS} />
        </GameSetting>
        <GameSetting label="Final Jeopardye">
          <ToggleSwitch name="final-jeopardye" checked={this.state.finalJeopardye} onChange={this.onFinalJeopardyeChanged} />
        </GameSetting>
        <Flex justify="center" mt={5} mb={3}>
          <Button colorScheme="jeopardyBlue" size="lg" onClick={this.createNewGame}>Start New Game</Button>
        </Flex>
      </Card>
    );
  }
}

export default GameSettings;
