import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  FormControl,
  FormLabel,
  GridItem,
  Input,
  Text,
} from '@chakra-ui/react';
import { PLACEHOLDER_PLAYER_EMAIL, StatusCodes } from '../../../constants.mjs';
import { validateEmail } from '../../../utils.mjs';
import { ActionTypes } from '../../actions/action_creators';
import GridRow from '../common/GridRow';

class PlayerEmailDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cancelRef: React.createRef(),
      email: props.email || '',
      emailInvalid: false,
    };
    this.handleEmailChanged = this.handleEmailChanged.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.errorContext && this.props.errorContext && this.props.errorContext.eventType === ActionTypes.RETRIEVE_PLAYER_BY_EMAIL) {
      this.handleError(this.props.errorContext.status);
      this.props.clearError(this.props.errorContext);
    }
  }

  handleError(status) {
    let title;
    switch (status) {
      case StatusCodes.BAD_REQUEST:
        title = 'Invalid email address.';
        break;
      case StatusCodes.NOT_FOUND:
        title = `Failed to find a player registered with email address ${this.state.email}.`;
        break;
      default:
        title = 'Failed to retrieve previous player.';
        break;
    }
    this.setState({emailInvalid: true});
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

  handleEmailChanged(event) {
    this.setState({email: event.target.value.trim(), emailInvalid: !validateEmail(event.target.value.trim())});
  }

  handleKeyUp(event) {
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleSubmit();
    }
  }

  handleSubmit() {
    if (validateEmail(this.state.email)) {
      this.props.retrievePlayer(this.state.email);
    } else {
      this.handleError(StatusCodes.BAD_REQUEST);
    }
  }

  render() {
    return (
      <AlertDialog isOpen={true} leastDestructiveRef={this.state.cancelRef} onClose={this.props.modals.playerEmailDialog.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="2xl" fontWeight="bold" textAlign="center">Restore Player by Email</AlertDialogHeader>
            <AlertDialogBody fontSize="xl" pb={5}>
              <Text fontStyle="italic" fontSize="md" px={3} textAlign="center">
                Enter the email address you registered with previously. We will send you a link that you can use to
                restore your previous player account.
              </Text>
              <Flex align="center" justify="center" direction="row" mt={8} mb={2}>
                <FormControl id="player-email" isInvalid={this.state.emailInvalid}>
                  <GridRow cols={5} my={2}>
                    <GridItem my={1} display="flex" alignItems="center">
                      <FormLabel fontSize="lg" fontWeight="bold">Email</FormLabel>
                    </GridItem>
                    <GridItem colSpan={4} display="flex" alignItems="center">
                      <Input bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={0} w="90%" value={this.state.email}
                             placeholder={PLACEHOLDER_PLAYER_EMAIL} onChange={this.handleEmailChanged} onKeyUp={this.handleKeyUp}
                             type="email" aria-label="email" />
                    </GridItem>
                  </GridRow>
                </FormControl>
              </Flex>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={this.state.cancelRef} onClick={this.props.modals.playerEmailDialog.close}>Cancel</Button>
              <Button colorScheme="jeopardyeBlue" onClick={this.handleSubmit} ml={3}>Submit</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );
  }
}

export default PlayerEmailDialog;
