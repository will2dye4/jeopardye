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
import { MAX_PASSWORD_LENGTH, ROOM_CODE_LENGTH, StatusCodes, validateRoomCode } from '@dyesoft/alea-core';
import { ActionTypes } from '../../actions/action_creators';
import Card from '../common/card/Card';
import GridRow from '../common/GridRow';

class CreateRoomDialog extends React.Component {
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.errorContext && this.props.errorContext && this.props.errorContext.eventType === ActionTypes.CREATE_NEW_ROOM) {
      this.handleError(this.props.errorContext.status);
      this.props.clearError(this.props.errorContext);
    }
  }

  handleError(status) {
    let invalid = false;
    let title;
    switch (status) {
      case StatusCodes.BAD_REQUEST:
        title = `Invalid room code. Code must be exactly ${ROOM_CODE_LENGTH} letters and may not include I, O, or U.`;
        invalid = true;
        break;
      case StatusCodes.CONFLICT:
        title = `Room code ${this.state.roomCode} is already in use.`;
        invalid = true;
        break;
      default:
        title = 'Failed to create room.';
        break;
    }
    this.setState({invalid: invalid});
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
    const invalid = (this.state.invalid && newCode && !validateRoomCode(newCode));
    this.setState({invalid: invalid, roomCode: newCode.toUpperCase().substring(0, ROOM_CODE_LENGTH)});
  }

  handlePasswordChanged(event) {
    this.setState({password: event.target.value.substring(0, MAX_PASSWORD_LENGTH)});
  }

  handleSubmit() {
    if (!this.state.roomCode || validateRoomCode(this.state.roomCode)) {
      this.props.createNewRoom(this.props.playerID, this.state.roomCode, this.state.password, this.props.requestID);
    } else {
      this.handleError(StatusCodes.BAD_REQUEST);
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
              <Heading mb={5} textAlign="center">Create a New Room</Heading>
              <FormControl id="room-code" isInvalid={this.state.invalid}>
                <GridRow cols={3} my={2}>
                  <GridItem my={1}>
                    <FormLabel fontSize="lg" fontWeight="bold" mb={0}>Room Code</FormLabel>
                    <FormHelperText fontStyle="italic" mt={0}>{ROOM_CODE_LENGTH} letters (leave blank for random)</FormHelperText>
                  </GridItem>
                  <GridItem colSpan={2} display="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={2} w="75%" value={this.state.roomCode}
                           onChange={this.handleRoomCodeChanged} onKeyUp={this.handleKeyUp} autoFocus={true} aria-label="room-code" />
                  </GridItem>
                </GridRow>
              </FormControl>
              <FormControl id="room-password">
                <GridRow cols={3} my={2}>
                  <GridItem my={1}>
                    <FormLabel fontSize="lg" fontWeight="bold" mb={0}>Password</FormLabel>
                    <FormHelperText fontStyle="italic" mt={0}>optional</FormHelperText>
                  </GridItem>
                  <GridItem colSpan={2} display="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={2} w="75%" value={this.state.password}
                           onChange={this.handlePasswordChanged} onKeyUp={this.handleKeyUp} type="password" aria-label="room-password" />
                  </GridItem>
                </GridRow>
              </FormControl>
              <Flex justify="center" mt={8} mb={3}>
                <Button colorScheme="jeopardyeBlue" size="lg" w="75%" onClick={this.handleSubmit}>
                  Create Room
                </Button>
              </Flex>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default CreateRoomDialog;
