import React from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  GridItem,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { MAX_ROOM_REQUEST_EMAIL_LENGTH, MAX_ROOM_REQUEST_NAME_LENGTH } from '../../../constants.mjs';
import { validateEmail } from '../../../utils.mjs';
import Card from '../common/card/Card';
import GridRow from '../common/GridRow';

class RequestLinkDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      nameInvalid: false,
      email: '',
      emailInvalid: false,
    };
    this.handleEmailChanged = this.handleEmailChanged.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleNameChanged(event) {
    const newName = event.target.value;
    const invalid = !newName.trim();
    this.setState({nameInvalid: invalid, name: newName.substring(0, MAX_ROOM_REQUEST_NAME_LENGTH)});
  }

  handleEmailChanged(event) {
    const newEmail = event.target.value;
    const invalid = !validateEmail(newEmail);
    this.setState({emailInvalid: invalid, email: newEmail.substring(0, MAX_ROOM_REQUEST_EMAIL_LENGTH)});
  }

  handleKeyUp(event) {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleSubmit();
    }
  }

  handleSubmit() {
    const name = this.state.name.trim();
    if (name) {
      const email = this.state.email.trim();
      if (validateEmail(email)) {
        this.props.requestNewRoomLink(this.state.name, this.state.email);
        this.props.onClose();
      } else {
        this.setState({emailInvalid: true});
      }
    } else {
      this.setState({nameInvalid: true});
    }
  }

  render() {
    return (
      <Modal isOpen={true} onClose={this.props.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6}>
              <Heading mb={5} textAlign="center">Request New Room Link</Heading>
              <Text fontSize="lg" fontStyle="italic" mt={3} mb={5}>
                Access to Jeopardye is currently limited to people who have been invited.
                If you would like to create your own private room and host your own games, please complete the request form below.
              </Text>
              <FormControl id="name" isInvalid={this.state.nameInvalid}>
                <GridRow cols={3} my={2}>
                  <GridItem my={1} d="flex" alignItems="center">
                    <FormLabel fontSize="lg" fontWeight="bold">Your Name</FormLabel>
                  </GridItem>
                  <GridItem colSpan={2} d="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={2} w="75%" value={this.state.name}
                           onChange={this.handleNameChanged} onKeyUp={this.handleKeyUp} autoFocus={true} aria-label="name" />
                  </GridItem>
                </GridRow>
              </FormControl>
              <FormControl id="email" isInvalid={this.state.emailInvalid}>
                <GridRow cols={3} my={2}>
                  <GridItem my={1} d="flex" alignItems="center">
                    <FormLabel fontSize="lg" fontWeight="bold" mb={0}>Email Address</FormLabel>
                  </GridItem>
                  <GridItem colSpan={2} d="flex" alignItems="center">
                    <Input bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={2} w="75%" value={this.state.email}
                           onChange={this.handleEmailChanged} onKeyUp={this.handleKeyUp} type="email" aria-label="email" />
                  </GridItem>
                </GridRow>
              </FormControl>
              <Flex justify="center" mt={8} mb={3}>
                <Button colorScheme="jeopardyeBlue" size="lg" w="75%" onClick={this.handleSubmit}>
                  Request
                </Button>
              </Flex>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default RequestLinkDialog;
