import React from 'react';
import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { LeaderboardKeys } from '../../../../constants.mjs';
import Card from '../../common/card/Card';
import Leaderboards from './Leaderboards';
import StatisticsByPlayer from './StatisticsByPlayer';

class PlayerStatistics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedLeaderboard: LeaderboardKeys.OVERALL_SCORE,
      selectedPlayerID: props.playerID,
    };
    this.handleLeaderboardChanged = this.handleLeaderboardChanged.bind(this);
    this.handlePlayerChanged = this.handlePlayerChanged.bind(this);
  }

  componentDidMount() {
    this.props.fetchPlayer(this.state.selectedPlayerID);
    this.props.fetchRoomLeaderboards(this.props.roomID);
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

  handleLeaderboardChanged(event) {
    this.setState({selectedLeaderboard: event.target.value});
  }

  handlePlayerChanged(event) {
    this.setState({selectedPlayerID: event.target.value});
  }

  render() {
    const player = this.getPlayer();
    if (!player) {
      return null;
    }

    const selectRef = React.createRef();

    return (
      <Modal initialFocusRef={selectRef} isOpen={true} onClose={this.props.modals.playerStats.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6} textAlign="center">
              <Heading mb={8}>Player Statistics</Heading>
              <Tabs isFitted isLazy variant="enclosed">
                <TabList>
                  <Tab fontSize="xl">Players</Tab>
                  <Tab fontSize="xl">Leaderboards</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <StatisticsByPlayer players={this.getAllPlayers()} selectedPlayer={player} selectRef={selectRef}
                                        onPlayerChanged={this.handlePlayerChanged} />
                  </TabPanel>
                  <TabPanel>
                    <Leaderboards leaderboards={this.props.leaderboards} selectedLeaderboard={this.state.selectedLeaderboard}
                                  onLeaderboardChanged={this.handleLeaderboardChanged} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default PlayerStatistics;
