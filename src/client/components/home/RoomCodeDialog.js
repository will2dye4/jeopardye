import React from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  GridItem,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { EventTypes, MAX_PASSWORD_LENGTH, ROOM_CODE_LENGTH, StatusCodes } from '../../../constants.mjs';
import Card from '../common/card/Card';
import GridRow from '../common/GridRow';

class RoomCodeDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomCode: this.props.roomCode || '',
      roomCodeInvalid: false,
      password: '',
      passwordInvalid: false,
    };
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleRoomCodeChanged = this.handleRoomCodeChanged.bind(this);
    this.handlePasswordChanged = this.handlePasswordChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.errorContext && this.props.errorContext && this.props.errorContext.eventType === EventTypes.JOIN_ROOM_WITH_CODE) {
      this.handleError(this.props.errorContext.status);
      this.props.clearError(this.props.errorContext);
    }
  }

  handleError(status) {
    let passwordInvalid = false;
    let roomCodeInvalid = false;
    let title;
    switch (status) {
      case StatusCodes.NOT_FOUND:
        title = 'Invalid room code.';
        roomCodeInvalid = true;
        break;
      case StatusCodes.UNAUTHORIZED:
        title = 'Invalid password.';
        passwordInvalid = true;
        break;
      default:
        title = 'Failed to join room.';
        break;
    }
    this.setState({passwordInvalid: passwordInvalid, roomCodeInvalid: roomCodeInvalid});
    if (!this.props.toast.isActive(title)) {
      this.props.toast({
        id: title,
        position: 'top',
        title: title,
        status: 'error',
        isClosable: true,
      });
    }
  }

  handleKeyUp(event) {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleSubmit();
    }
  }

  handleRoomCodeChanged(event) {
    const newCode = event.target.value.trim();
    const invalid = (this.state.roomCodeInvalid && newCode.length !== ROOM_CODE_LENGTH);
    this.setState({roomCodeInvalid: invalid, roomCode: newCode.toUpperCase().substring(0, ROOM_CODE_LENGTH)});
  }

  handlePasswordChanged(event) {
    this.setState({passwordInvalid: false, password: event.target.value.substring(0, MAX_PASSWORD_LENGTH)});
  }

  handleSubmit() {
    if (this.state.roomCode.length === ROOM_CODE_LENGTH) {
      this.props.joinRoomWithCode(this.props.playerID, this.state.roomCode, this.state.password);
    } else {
      this.handleError(StatusCodes.NOT_FOUND);
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
              <FormControl id="room-code" isInvalid={this.state.roomCodeInvalid}>
                <GridRow cols={3} my={2}>
                  <GridItem my={1} d="flex" alignItems="center">
                    <FormLabel fontSize="lg" fontWeight="bold">Room Code</FormLabel>
                  </GridItem>
                  <GridItem colSpan={2} d="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" value={this.state.roomCode}
                           onChange={this.handleRoomCodeChanged} onKeyUp={this.handleKeyUp} autoFocus={true} aria-label="room-code" />
                 </GridItem>
                </GridRow>
              </FormControl>
              <FormControl id="room-password" isInvalid={this.state.passwordInvalid}>
                <GridRow cols={3} my={2}>
                  <GridItem my={1}>
                    <FormLabel fontSize="lg" fontWeight="bold" mb={0}>Password</FormLabel>
                    <FormHelperText fontStyle="italic" mt={0}>if provided</FormHelperText>
                  </GridItem>
                  <GridItem colSpan={2} d="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" value={this.state.password}
                           onChange={this.handlePasswordChanged} onKeyUp={this.handleKeyUp} type="password" aria-label="room-password" />
                  </GridItem>
                </GridRow>
              </FormControl>
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
