import React from 'react';
import {
  Button,
  createStandaloneToast,
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
import { MAX_PASSWORD_LENGTH, ROOM_CODE_LENGTH } from '../../../constants.mjs';
import { validateRoomCode } from '../../../models/room.mjs';
import JEOPARDYE_THEME from '../../theme';
import Card from '../common/card/Card';
import GridRow from '../common/GridRow';

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

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

  handleKeyUp(event) {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  handleRoomCodeChanged(event) {
    const newCode = event.target.value.trim();
    const invalid = (this.state.invalid && !validateRoomCode(newCode));
    this.setState({invalid: invalid, roomCode: newCode.toUpperCase().substring(0, ROOM_CODE_LENGTH)});
  }

  handlePasswordChanged(event) {
    this.setState({password: event.target.value.substring(0, MAX_PASSWORD_LENGTH)});
  }

  handleSubmit() {
    if (validateRoomCode(this.state.roomCode)) {
      /* TODO - create room */
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
              <Heading textAlign="center">Create a New Room</Heading>
              <FormControl id="room-code" isInvalid={this.state.invalid}>
                <GridRow cols={3} my={2}>
                  <GridItem my={1} d="flex" alignItems="center">
                    <FormLabel fontSize="lg" fontWeight="bold">Room Code</FormLabel>
                    <FormHelperText fontStyle="italic" mt={0}>{ROOM_CODE_LENGTH} letters</FormHelperText>
                  </GridItem>
                  <GridItem colSpan={2} d="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" value={this.state.roomCode}
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
                  <GridItem colSpan={2} d="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyBlue.500" size="lg" ml={2} w="75%" value={this.state.password}
                           onChange={this.handlePasswordChanged} onKeyUp={this.handleKeyUp} type="password" aria-label="room-password" />
                  </GridItem>
                </GridRow>
              </FormControl>
              {/* TODO - confirm password input? */}
              <Flex justify="center" mt={8} mb={3}>
                <Button colorScheme="jeopardyBlue" size="lg" w="75%" onClick={this.handleSubmit}>
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
