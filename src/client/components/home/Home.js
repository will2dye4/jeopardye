import React from 'react';
import { Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { DEFAULT_PLAYER_ID } from '../../../constants.mjs';
import Card from '../common/card/Card';
import LogoPage from '../common/LogoPage';
import CreateRoomDialog from './CreateRoomDialog';
import RequestLinkDialog from './RequestLinkDialog';
import RoomCodeDialog from './RoomCodeDialog';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
    if (this.props.roomCode && !this.props.roomID && !this.props.playerID) {
      this.props.playerEditor.open(() => this.setState({showRoomCodeDialog: true}));
    }
  }

  openCreateRoomDialog() {
    if (this.props.playerID) {
      this.setState({showCreateRoomDialog: true});
    } else {
      this.props.playerEditor.open(() => this.setState({showCreateRoomDialog: true}));
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
    const secondButtonLabel = (this.props.playerID === DEFAULT_PLAYER_ID ? 'Create New Room' : 'Request New Room Link');
    const secondButtonHandler = (this.props.playerID === DEFAULT_PLAYER_ID ? this.openCreateRoomDialog : this.openRequestLinkDialog);
    return (
      <LogoPage id="home">
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
              You can use the other button to request permission to create a new room.
            </Text>
            <Flex justify="center" mt={12} mb={3}>
              <VStack spacing={5} minW={250}>
                <Button colorScheme="jeopardyBlue" size="lg" w="100%" onClick={this.openRoomCodeDialog}>Enter Room Code</Button>
                <Button colorScheme="jeopardyBlue" size="lg" w="100%" onClick={secondButtonHandler}>{secondButtonLabel}</Button>
              </VStack>
            </Flex>
          </Card>
        </Flex>
        {this.state.showCreateRoomDialog && <CreateRoomDialog onClose={this.closeCreateRoomDialog} {...this.props} />}
        {this.state.showRequestLinkDialog && <RequestLinkDialog onClose={this.closeRequestLinkDialog} {...this.props} />}
        {this.state.showRoomCodeDialog && <RoomCodeDialog onClose={this.closeRoomCodeDialog} {...this.props} />}
      </LogoPage>
    );
  }
}

export default Home;
