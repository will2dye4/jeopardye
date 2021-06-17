import React from 'react';
import {
  Button, Flex, GridItem,
  Heading, Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay, Text,
} from '@chakra-ui/react';
import { MAX_PASSWORD_LENGTH, ROOM_CODE_LENGTH } from '../../../constants.mjs';
import Card from '../common/card/Card';
import GridRow from '../common/GridRow';

class RoomCodeDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      invalid: false,
      roomCode: '',
      password: '',
    };
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleRoomCodeChanged = this.handleRoomCodeChanged.bind(this);
    this.handlePasswordChanged = this.handlePasswordChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleKeyUp(event) {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  handleRoomCodeChanged(event) {
    const newCode = event.target.value.trim();
    const invalid = (this.state.invalid && newCode.length !== ROOM_CODE_LENGTH);
    this.setState({invalid: invalid, roomCode: newCode.toUpperCase().substring(0, ROOM_CODE_LENGTH)});
  }

  handlePasswordChanged(event) {
    this.setState({password: event.target.value.substring(0, MAX_PASSWORD_LENGTH)});
  }

  handleSubmit() {
    if (this.state.roomCode.length === ROOM_CODE_LENGTH) {
      this.props.joinRoomWithCode(this.props.playerID, this.state.roomCode, this.state.password);
    } else {
      this.setState({invalid: true});
    }
  }

  render() {
    return (
      <Modal isOpen={true} onClose={this.props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6}>
              <Heading mb={5} textAlign="center">Join a Room</Heading>
              <GridRow cols={3} my={2}>
                <GridItem my={1} d="flex" alignItems="center">
                  <Text fontSize="lg" fontWeight="bold">Room Code</Text>
                </GridItem>
                <GridItem colSpan={2} d="flex" alignItems="center">
                  <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" value={this.state.roomCode}
                         onChange={this.handleRoomCodeChanged} onKeyUp={this.handleKeyUp} isInvalid={this.state.invalid}
                         autoFocus={true} aria-label="room-code" />
                </GridItem>
              </GridRow>
              <GridRow cols={3} my={2}>
                <GridItem my={1}>
                  <Text fontSize="lg" fontWeight="bold">Password</Text>
                  <Text fontSize="sm" fontStyle="italic">if provided</Text>
                </GridItem>
                <GridItem colSpan={2} d="flex" alignItems="center">
                  <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" value={this.state.password}
                         onChange={this.handlePasswordChanged} onKeyUp={this.handleKeyUp} type="password" aria-label="password" />
                </GridItem>
              </GridRow>
              <Flex justify="center" mt={8} mb={3}>
                <Button colorScheme="jeopardyBlue" size="lg" w="75%" onClick={this.handleSubmit}>
                  Join Room
                </Button>
              </Flex>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default RoomCodeDialog;
