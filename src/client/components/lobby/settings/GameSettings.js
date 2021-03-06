import React from 'react';
import { Badge, Box, Button, Flex, Heading, Progress } from '@chakra-ui/react';
import { DailyDoubleSettings, MAX_NUM_ROUNDS } from '../../../../constants.mjs';
import { GameSettings as Settings } from '../../../../models/game.mjs';
import { range } from '../../../../utils.mjs';
import { getPlayerName } from '../../../reducers/game_reducer';
import Card from '../../common/card/Card';
import GameSetting from './GameSetting';
import RadioToggleGroup from '../../common/form/RadioToggleGroup';
import ToggleSwitch from '../../common/form/ToggleSwitch';

const NUM_ROUNDS_OPTIONS = range(MAX_NUM_ROUNDS).map(i => i + 1);
const DAILY_DOUBLE_OPTIONS = Object.entries(DailyDoubleSettings).map(([value, label]) => { return {label, value}; });

class GameSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dailyDoubles: props.gameSettings.dailyDoubles,
      finalJeopardye: false, /* TODO - revert once Final Jeopardye is implemented: props.gameSettings.finalJeopardye, */
      numRounds: props.gameSettings.numRounds,
    };
    this.createNewGame = this.createNewGame.bind(this);
    this.onDailyDoublesChanged = this.onDailyDoublesChanged.bind(this);
    this.onFinalJeopardyeChanged = this.onFinalJeopardyeChanged.bind(this);
    this.onNumRoundsChanged = this.onNumRoundsChanged.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.gameSettings !== this.props.gameSettings) {
      this.setState({
        dailyDoubles: this.props.gameSettings.dailyDoubles,
        finalJeopardye: this.props.gameSettings.finalJeopardye,
        numRounds: this.props.gameSettings.numRounds,
      });
    }

    if (prevProps.gameStarting && !this.props.gameStarting && !this.props.game &&
        this.props.playerID === this.props.room?.hostPlayerID) {
      this.props.createNewGameFailed(this.props.roomID);
    }
  }

  updateGameSettings(numRounds, dailyDoubles, finalJeopardye) {
    this.props.updateGameSettings(new Settings(this.props.roomID, numRounds, dailyDoubles, finalJeopardye));
  }

  onDailyDoublesChanged(event) {
    const dailyDoubles = event.target.value;
    this.setState({dailyDoubles: dailyDoubles});
    this.updateGameSettings(this.state.numRounds, dailyDoubles, this.state.finalJeopardye);
  }

  onFinalJeopardyeChanged() {
    /* TODO - uncomment this once Final Jeopardye is implemented on the frontend
    const finalJeopardye = !this.state.finalJeopardye;
    this.setState({finalJeopardye: finalJeopardye});
    this.updateGameSettings(this.state.numRounds, this.state.dailyDoubles, finalJeopardye);
    */
  }

  onNumRoundsChanged(event) {
    const numRounds = parseInt(event.target.value);
    this.setState({numRounds: numRounds});
    this.updateGameSettings(numRounds, this.state.dailyDoubles, this.state.finalJeopardye);
  }

  createNewGame() {
    const playerIDs = Object.keys(this.props.players);
    const gameSettings = new Settings(this.props.roomID, this.state.numRounds, this.state.dailyDoubles, this.state.finalJeopardye, playerIDs);
    this.props.fetchNewGame(gameSettings);
  }

  render() {
    if (this.props.gameStarting) {
      return (
        <Card className="game-settings">
          <Box className="game-starting" textAlign="center">
            <Heading>A new game is starting, please wait...</Heading>
            <Progress hasStripe isAnimated borderRadius="md" colorScheme="jeopardyeBlue" size="lg" mx={8} mt={10} value={100} />
          </Box>
        </Card>
      );
    }
    const disabled = (this.props.playerID !== this.props.room?.hostPlayerID);
    const startGameDisabled = (disabled || Object.keys(this.props.players).length === 0);
    const hostName = (this.props.room ? getPlayerName(this.props.room.hostPlayerID) : 'host');
    return (
      <Card className="game-settings" px={8} py={6}>
        <Heading mb={5} textAlign="center">Game Settings</Heading>
        <GameSetting label="Number of Rounds">
          <RadioToggleGroup name="num-rounds" currentValue={this.state.numRounds} onChange={this.onNumRoundsChanged}
                            options={NUM_ROUNDS_OPTIONS} disabled={disabled} />
        </GameSetting>
        <GameSetting label="Daily Doubles">
          <RadioToggleGroup name="daily-doubles" currentValue={this.state.dailyDoubles} onChange={this.onDailyDoublesChanged}
                            options={DAILY_DOUBLE_OPTIONS} disabled={disabled} />
        </GameSetting>
        <GameSetting label="Final Jeopardye">
          <ToggleSwitch name="final-jeopardye" checked={this.state.finalJeopardye} disabled={disabled}
                        onChange={this.onFinalJeopardyeChanged} />
          <Badge colorScheme="purple" ml={4} userSelect="none">Coming Soon</Badge>
        </GameSetting>
        <Flex justify="center" mt={5} mb={3}>
          {disabled ?
            <Heading size="lg">Waiting for {hostName} to start a new game...</Heading> :
            <Button colorScheme="jeopardyeBlue" size="lg" disabled={startGameDisabled} onClick={this.createNewGame}>Start New Game</Button>
          }
        </Flex>
      </Card>
    );
  }
}

export default GameSettings;
