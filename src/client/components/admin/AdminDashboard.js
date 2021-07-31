import React from 'react';
import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react';
import { RoomLinkRequestResolution } from '../../../models/roomLinkRequest.mjs';
import Card from '../common/card/Card';
import Players from './Players';
import RoomLinkRequests from './RoomLinkRequests';
import Rooms from './Rooms';

class AdminDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeFilter: null,
      resolution: RoomLinkRequestResolution.UNRESOLVED,
    };
    this.handleActiveFilterChanged = this.handleActiveFilterChanged.bind(this);
    this.handleResolutionChanged = this.handleResolutionChanged.bind(this);
  }

  componentDidMount() {
    this.props.fetchRoomLinkRequests(this.state.resolution);
    this.props.fetchRooms();
    this.props.fetchPlayers(this.state.activeFilter);
  }

  handleActiveFilterChanged(event) {
    let activeFilter = event.target.value;
    if (activeFilter === '') {
      activeFilter = null;
    }
    if (this.state.activeFilter !== activeFilter) {
      this.setState({activeFilter: activeFilter});
      this.props.fetchPlayers(activeFilter);
    }
  }

  handleResolutionChanged(event) {
    const resolution = event.target.value;
    if (this.state.resolution !== resolution) {
      this.setState({resolution: resolution});
      this.props.fetchRoomLinkRequests(resolution);
    }
  }

  render() {
    return (
      <Modal isOpen={true} onClose={this.props.adminDashboard.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6} textAlign="center">
              <Heading mb={8}>Admin Dashboard</Heading>
              <Tabs isFitted isLazy variant="enclosed">
                <TabList>
                  <Tab fontSize="xl">Room Link Requests</Tab>
                  <Tab fontSize="xl">Rooms</Tab>
                  <Tab fontSize="xl">Players</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <RoomLinkRequests resolution={this.state.resolution} onResolutionChanged={this.handleResolutionChanged} {...this.props} />
                  </TabPanel>
                  <TabPanel>
                    <Rooms {...this.props} />
                  </TabPanel>
                  <TabPanel>
                    <Players activeFilter={this.state.activeFilter} onActiveFilterChanged={this.handleActiveFilterChanged} {...this.props} />
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

export default AdminDashboard;
