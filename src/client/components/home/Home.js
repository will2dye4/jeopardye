import React from 'react';
import { Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { withRouter } from 'react-router-dom';
import { DEFAULT_PLAYER_ID } from '../../../constants.mjs';
import Card from '../common/card/Card';
import LogoPage from '../common/LogoPage';
import CreateRoomDialog from './CreateRoomDialog';
import HomeButtons from './HomeButtons';
import RequestLinkDialog from './RequestLinkDialog';
import RoomCodeDialog from './RoomCodeDialog';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomLinkRequestID: null,
      showCreateRoomDialog: false,
      showRequestLinkDialog: false,
      showRoomCodeDialog: false,
    };
    this.openCreateRoomDialog = this.openCreateRoomDialog.bind(this);
    this.closeCreateRoomDialog = this.closeCreateRoomDialog.bind(this);
    this.openRequestLinkDialog = this.openRequestLinkDialog.bind(this);
    this.closeRequestLinkDialog = this.closeRequestLinkDialog.bind(this);
    this.openRoomCodeDialog = this.openRoomCodeDialog.bind(this);
    this.closeRoomCodeDialog = this.closeRoomCodeDialog.bind(this);
  }

  componentDidMount() {
    if (this.props.roomCode && !this.props.roomID) {
      this.openRoomCodeDialog();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.roomCode && this.props.roomCode && !this.props.roomID) {
      this.openRoomCodeDialog();
    }
  }

  openCreateRoomDialog(requestID) {
    if (this.props.playerID) {
      const newState = {showCreateRoomDialog: true};
      if (requestID) {
        newState.roomLinkRequestID = requestID;
      }
      this.setState(newState);
    } else {
      this.props.playerEditor.open(() => this.openCreateRoomDialog(requestID));
    }
  }

  closeCreateRoomDialog() {
    this.setState({showCreateRoomDialog: false});
  }

  openRequestLinkDialog() {
    this.setState({showRequestLinkDialog: true});
  }

  closeRequestLinkDialog() {
    this.setState({showRequestLinkDialog: false});
  }

  openRoomCodeDialog() {
    if (this.props.playerID) {
      this.setState({showRoomCodeDialog: true});
    } else {
      this.props.playerEditor.open(() => this.setState({showRoomCodeDialog: true}));
    }
  }

  closeRoomCodeDialog() {
    this.setState({showRoomCodeDialog: false});
  }

  render() {
    const urlSearchParams = new URLSearchParams(this.props.location.search);
    let requestID;
    if (urlSearchParams.has('req')) {
      requestID = urlSearchParams.get('req');
    }
    const isAdmin = (this.props.playerID === DEFAULT_PLAYER_ID);
    const allowCreate = (isAdmin || !!requestID);
    const secondButtonLabel = (allowCreate ? 'Create New Room' : 'Request New Room Link');
    const secondButtonHandler = (allowCreate ? () => this.openCreateRoomDialog(requestID) : this.openRequestLinkDialog);
    const secondButtonDescription = (allowCreate ?
        'You can use the other button to create your own room and play with your friends!' :
        'You can use the other button to request permission to create a new room.'
    );
    return (
      <LogoPage id="home">
        <HomeButtons isAdmin={isAdmin} adminDashboard={this.props.adminDashboard} />
        <Flex justify="center">
          <Card className="game-settings" mt={5} px={8} py={8} textAlign="center" w="75%" minW={500}>
            <Heading size="3xl">Welcome!</Heading>
            <Text fontSize="3xl" fontWeight="bold" mt={8}>
              Jeopardye is a trivia game that you can play with your friends.
            </Text>
            <Text mt={8}>
              If you have a room code, click the button below to enter it.
            </Text>
            <Text>
              {secondButtonDescription}
            </Text>
            <Flex justify="center" mt={12} mb={3}>
              <VStack spacing={5} minW={250}>
                <Button colorScheme="jeopardyBlue" size="lg" w="100%" onClick={this.openRoomCodeDialog}>Enter Room Code</Button>
                <Button colorScheme="jeopardyBlue" size="lg" w="100%" onClick={secondButtonHandler}>{secondButtonLabel}</Button>
              </VStack>
            </Flex>
          </Card>
        </Flex>
        {this.state.showCreateRoomDialog && <CreateRoomDialog requestID={this.state.roomLinkRequestID}
                                                              onClose={this.closeCreateRoomDialog} {...this.props} />}
        {this.state.showRequestLinkDialog && <RequestLinkDialog onClose={this.closeRequestLinkDialog} {...this.props} />}
        {this.state.showRoomCodeDialog && <RoomCodeDialog onClose={this.closeRoomCodeDialog} {...this.props} />}
      </LogoPage>
    );
  }
}

export default withRouter(Home);
