import React from 'react';
import moment from 'moment';
import {
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Select,
  StatGroup,
  Text,
} from '@chakra-ui/react';
import { formatScore } from '../../../../utils.mjs';
import Card from '../../common/card/Card';
import PlayerStatistic from './PlayerStatistic';

class PlayerStatistics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPlayerID: props.playerID,
    };
    this.handlePlayerChanged = this.handlePlayerChanged.bind(this);
  }

  componentDidMount() {
    this.props.fetchPlayer(this.state.selectedPlayerID);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.selectedPlayerID !== this.state.selectedPlayerID) {
      this.props.fetchPlayer(this.state.selectedPlayerID);
    }
  }

  getAllPlayers() {
    return {...this.props.players, ...this.props.spectators};
  }

  getPlayer() {
    return this.getAllPlayers()[this.state.selectedPlayerID];
  }

  handlePlayerChanged(event) {
    this.setState({selectedPlayerID: event.target.value});
  }

  render() {
    const player = this.getPlayer();
    if (!player) {
      return null;
    }

    const {
      overallScore,
      highestGameScore,
      gamesPlayed,
      gamesWon,
      cluesAnswered,
      cluesAnsweredCorrectly,
      dailyDoublesAnswered,
      dailyDoublesAnsweredCorrectly,
    } = player.stats;
    const correctPercentage = Math.round((cluesAnswered === 0 ? 0 : (cluesAnsweredCorrectly / cluesAnswered)) * 100);
    const dailyDoublePercentage = Math.round((dailyDoublesAnswered === 0 ? 0 : (dailyDoublesAnsweredCorrectly / dailyDoublesAnswered)) * 100);
    const winningPercentage = Math.round((gamesPlayed === 0 ? 0 : (gamesWon / gamesPlayed)) * 100);
    const groupPadding = 10;
    const selectRef = React.createRef();

    return (
      <Modal initialFocusRef={selectRef} isOpen={true} onClose={this.props.playerStats.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6} textAlign="center">
              <Heading mb={8}>Player Statistics</Heading>
              <Flex align="center" ml={12} py={3}>
                <Select ref={selectRef} focusBorderColor="jeopardyBlue.500" w="20%" value={this.state.selectedPlayerID} onChange={this.handlePlayerChanged}>
                  {Object.entries(this.getAllPlayers()).sort(([id1, player1], [id2, player2]) =>
                    player1.name.localeCompare(player2.name)
                  ).map(([playerID, player]) =>
                    <option key={playerID} value={playerID}>{player.name}</option>
                  )}
                </Select>
                <Text ml={5} fontSize="lg" fontStyle="italic" opacity="0.8">
                  joined {moment(player.createdTime).fromNow()}, last connected {moment(player.lastConnectionTime).fromNow()}
                </Text>
              </Flex>
              <StatGroup py={groupPadding}>
                <PlayerStatistic label="All-Time Score" value={formatScore(overallScore)} />
                <PlayerStatistic label="Highest Single Game Score" value={formatScore(highestGameScore)} />
              </StatGroup>
              <StatGroup py={groupPadding}>
                <PlayerStatistic label="Response Accuracy" value={`${correctPercentage}%`}
                                 helpText={`${cluesAnsweredCorrectly.toLocaleString()} / ${cluesAnswered.toLocaleString()}`} />
                <PlayerStatistic label="Daily Double Accuracy" value={`${dailyDoublePercentage}%`}
                                 helpText={`${dailyDoublesAnsweredCorrectly.toLocaleString()} / ${dailyDoublesAnswered.toLocaleString()}`} />
                <PlayerStatistic label="Winning Percentage" value={`${winningPercentage}%`}
                                 helpText={`${gamesWon.toLocaleString()} / ${gamesPlayed.toLocaleString()}`} />
              </StatGroup>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default PlayerStatistics;
