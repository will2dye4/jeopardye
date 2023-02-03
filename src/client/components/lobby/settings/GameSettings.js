import React from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Progress,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { EARLIEST_EPISODE_DATE, GameDateSelectionModes, GameSettingModes } from '../../../../constants.mjs';
import { GameSettings as Settings } from '../../../../models/game.mjs';
import { parseISODateString } from '../../../../utils.mjs';
import { getPlayerName } from '../../../reducers/game_reducer';
import Card from '../../common/card/Card';
import RandomGameSettings from './RandomGameSettings';
import ByDateGameSettings from './ByDateGameSettings';

class GameSettings extends React.Component {
  constructor(props) {
    super(props);

    let season;
    if (props.seasonSummaries) {
      season = props.seasonSummaries[props.seasonSummaries.length - 1];
    }

    let seasonNumber;
    if (props.gameSettings.seasonNumber) {
      seasonNumber = props.gameSettings.seasonNumber;
    } else if (season) {
      seasonNumber = season.seasonNumber;
    } else {
      seasonNumber = '';
    }

    let startDate;
    if (props.gameSettings.startDate) {
      startDate = props.gameSettings.startDate;
    } else if (season) {
      startDate = parseISODateString(season.seasonStartDate);
    } else {
      startDate = EARLIEST_EPISODE_DATE;
    }

    let endDate;
    if (props.gameSettings.endDate) {
      endDate = props.gameSettings.endDate;
    } else if (season) {
      endDate = parseISODateString(season.seasonEndDate);
    } else {
      endDate = EARLIEST_EPISODE_DATE;
    }

    this.state = {
      mode: GameSettingModes.BY_DATE,

      dateSelectionMode: GameDateSelectionModes.SEASON,
      maxDate: (season ? parseISODateString(season.seasonEndDate) : EARLIEST_EPISODE_DATE),
      endDate: endDate,
      endDateRef: React.createRef(),
      startDate: startDate,
      startDateRef: React.createRef(),
      selectedSeason: seasonNumber,

      dailyDoubles: props.gameSettings.dailyDoubles,
      finalJeopardye: false, /* TODO - revert once Final Jeopardye is implemented: props.gameSettings.finalJeopardye, */
      numRounds: props.gameSettings.numRounds,
    };

    this.createNewGame = this.createNewGame.bind(this);
    this.onModeChanged = this.onModeChanged.bind(this);
    this.onDailyDoublesChanged = this.onDailyDoublesChanged.bind(this);
    this.onFinalJeopardyeChanged = this.onFinalJeopardyeChanged.bind(this);
    this.onNumRoundsChanged = this.onNumRoundsChanged.bind(this);
    this.onDateSelectionModeChanged = this.onDateSelectionModeChanged.bind(this);
    this.onEndDateChanged = this.onEndDateChanged.bind(this);
    this.onStartDateChanged = this.onStartDateChanged.bind(this);
    this.onSeasonChanged = this.onSeasonChanged.bind(this);
    this.onSeasonNumberChanged = this.onSeasonNumberChanged.bind(this);
  }

  componentDidMount() {
    this.props.fetchSeasonSummaries();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.gameSettings !== this.props.gameSettings) {
      if (this.props.gameSettings.mode === GameSettingModes.BY_DATE) {
        let newState = {
          mode: this.props.gameSettings.mode,
          dateSelectionMode: (this.props.gameSettings.seasonNumber ? GameDateSelectionModes.SEASON : GameDateSelectionModes.DATE_RANGE),
          endDate: this.props.gameSettings.endDate,
        };
        if (this.props.gameSettings.seasonNumber) {
          newState.selectedSeason = this.props.gameSettings.seasonNumber;
        }
        if (this.props.gameSettings.startDate) {
          newState.startDate = this.props.gameSettings.startDate;
        }
        if (this.props.gameSettings.endDate) {
          newState.endDate = this.props.gameSettings.endDate;
        }
        this.setState(newState);
      } else {
        this.setState({
          mode: this.props.gameSettings.mode,
          dailyDoubles: this.props.gameSettings.dailyDoubles,
          finalJeopardye: this.props.gameSettings.finalJeopardye,
          numRounds: this.props.gameSettings.numRounds,
        });
      }
    }

    if (prevProps.gameStarting && !this.props.gameStarting && !this.props.game &&
        this.props.playerID === this.props.room?.hostPlayerID) {
      this.props.createNewGameFailed(this.props.roomID);
    }

    if (!prevProps.seasonSummaries && this.props.seasonSummaries && !this.state.selectedSeason) {
      const season = this.props.seasonSummaries[this.props.seasonSummaries.length - 1];
      this.setState({
        maxDate: parseISODateString(season.seasonEndDate),
      });
      this.onSeasonNumberChanged(season.seasonNumber);
    }
  }

  updateGameSettings(mode, newSettings) {
    let settings;
    if (mode === GameSettingModes.BY_DATE) {
      const dateSelectionMode = (newSettings.hasOwnProperty('mode') ? newSettings.mode : this.state.dateSelectionMode);
      const startDate = (newSettings.hasOwnProperty('startDate') ? newSettings.startDate : this.state.startDate);
      const endDate = (newSettings.hasOwnProperty('endDate') ? newSettings.endDate : this.state.endDate);
      let seasonNumber;
      if (dateSelectionMode === GameDateSelectionModes.SEASON) {
        seasonNumber = (newSettings.hasOwnProperty('seasonNumber') ? newSettings.seasonNumber : this.state.selectedSeason);
      }
      settings = Settings.byDateMode(this.props.roomID, seasonNumber, startDate, endDate);
    } else {
      const numRounds = (newSettings.hasOwnProperty('numRounds') ? newSettings.numRounds : this.state.numRounds);
      const dailyDoubles = (newSettings.hasOwnProperty('dailyDoubles') ? newSettings.dailyDoubles : this.state.dailyDoubles);
      const finalJeopardye = (newSettings.hasOwnProperty('finalJeopardye') ? newSettings.finalJeopardye : this.state.finalJeopardye);
      settings = Settings.randomMode(this.props.roomID, numRounds, dailyDoubles, finalJeopardye);
    }
    this.props.updateGameSettings(settings);
  }

  onModeChanged(tabIndex) {
    const mode = Object.values(GameSettingModes)[tabIndex];
    this.setState({mode: mode});
    this.updateGameSettings(mode, {});
  }

  onDailyDoublesChanged(event) {
    const dailyDoubles = event.target.value;
    const newState = {dailyDoubles: dailyDoubles};
    this.setState(newState);
    this.updateGameSettings(this.state.mode, newState);
  }

  onFinalJeopardyeChanged() {
    /* TODO - uncomment this once Final Jeopardye is implemented on the frontend
    const finalJeopardye = !this.state.finalJeopardye;
    const newState = {finalJeopardye: finalJeopardye};
    this.setState(newState);
    this.updateGameSettings(this.state.mode, newState);
    */
  }

  onNumRoundsChanged(event) {
    const numRounds = parseInt(event.target.value);
    const newState = {numRounds: numRounds};
    this.setState(newState);
    this.updateGameSettings(this.state.mode, newState);
  }

  onDateSelectionModeChanged(mode) {
    this.setState({dateSelectionMode: mode});
    this.updateGameSettings(this.state.mode, {mode: mode});
  }

  onSeasonChanged(event) {
    const seasonNumber = parseInt(event.target.value);
    this.onSeasonNumberChanged(seasonNumber);
  }

  onSeasonNumberChanged(seasonNumber) {
    const season = this.props.seasonSummaries.find(season => season.seasonNumber === seasonNumber);
    const startDate = parseISODateString(season.seasonStartDate);
    const endDate = parseISODateString(season.seasonEndDate);
    this.setState({
      selectedSeason: seasonNumber,
      startDate: startDate,
      endDate: endDate,
    });
    this.updateGameSettings(this.state.mode, {
      seasonNumber: seasonNumber,
      startDate: startDate,
      endDate: endDate,
    });
  }

  onEndDateChanged(date) {
    const newState = {endDate: date};
    this.setState(newState);
    this.updateGameSettings(this.state.mode, newState);
  }

  onStartDateChanged(date) {
    const newState = {endDate: date, startDate: date};
    this.setState(newState);
    this.updateGameSettings(this.state.mode, newState);
  }

  createNewGame() {
    const playerIDs = Object.keys(this.props.players);
    let gameSettings;
    if (this.state.mode === GameSettingModes.BY_DATE) {
      const seasonNumber = (this.state.dateSelectionMode === GameDateSelectionModes.SEASON ? this.state.selectedSeason : null);
      gameSettings = Settings.byDateMode(this.props.roomID, seasonNumber, this.state.startDate, this.state.endDate, playerIDs);
    } else {
      gameSettings = Settings.randomMode(this.props.roomID, this.state.numRounds, this.state.dailyDoubles, this.state.finalJeopardye, playerIDs);
    }
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
        <Heading mb={8} textAlign="center">Game Settings</Heading>
        <Tabs isFitted isLazy index={Object.values(GameSettingModes).findIndex(mode => mode === this.state.mode)}
              onChange={this.onModeChanged} variant="enclosed">
          <TabList>
            <Tab fontSize="xl" isDisabled={disabled}>By Date</Tab>
            <Tab fontSize="xl" isDisabled={disabled}>Random</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ByDateGameSettings disabled={disabled} maxDate={this.state.maxDate} startDate={this.state.startDate} endDate={this.state.endDate}
                                  onStartDateChanged={this.onStartDateChanged} onEndDateChanged={this.onEndDateChanged}
                                  startDateRef={this.state.startDateRef} endDateRef={this.state.endDateRef}
                                  mode={this.state.dateSelectionMode} onModeChanged={this.onDateSelectionModeChanged}
                                  seasonSummaries={this.props.seasonSummaries} selectedSeason={this.state.selectedSeason}
                                  onSeasonChanged={this.onSeasonChanged} />
            </TabPanel>
            <TabPanel>
              <RandomGameSettings disabled={disabled}
                                  dailyDoubles={this.state.dailyDoubles} onDailyDoublesChanged={this.onDailyDoublesChanged}
                                  finalJeopardye={this.state.finalJeopardye} onFinalJeopardyeChanged={this.onFinalJeopardyeChanged}
                                  numRounds={this.state.numRounds} onNumRoundsChanged={this.onNumRoundsChanged} />
            </TabPanel>
          </TabPanels>
        </Tabs>
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
