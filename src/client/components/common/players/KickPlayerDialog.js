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
  Select,
  Text,
} from '@chakra-ui/react';
import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_MONTH,
  SECONDS_PER_WEEK,
} from '@dyesoft/alea-core';

const DURATIONS = {
  '1 minute': SECONDS_PER_MINUTE,
  '15 minutes': 15 * SECONDS_PER_MINUTE,
  '1 hour': SECONDS_PER_HOUR,
  '1 day': SECONDS_PER_DAY,
  '1 week': SECONDS_PER_WEEK,
  '1 month': SECONDS_PER_MONTH,
  'forever': 0,
};

class KickPlayerDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cancelRef: React.createRef(),
      selectedDuration: Object.values(DURATIONS)[0],
    };
    this.handleDurationChanged = this.handleDurationChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleDurationChanged(event) {
    this.setState({selectedDuration: event.target.value});
  }

  handleSubmit() {
    this.props.kickPlayer(this.props.roomID, this.props.player.playerID, this.state.selectedDuration);
    this.props.modals.kickPlayerDialog.close();
  }

  render() {
    return (
      <AlertDialog isOpen={true} leastDestructiveRef={this.state.cancelRef} onClose={this.props.modals.kickPlayerDialog.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="2xl" fontWeight="bold" textAlign="center">Kick {this.props.player.name}</AlertDialogHeader>
            <AlertDialogBody fontSize="xl" pb={5}>
              <Text fontStyle="italic" fontSize="md" textAlign="center">
                You can kick a player out of the room for misbehaving, or if they leave the game without closing their browser.
              </Text>
              <Flex align="center" justify="center" direction="row" mt={8} mb={2}>
                <Text mr={3}>Kick {this.props.player.name} for</Text>
                <Select focusBorderColor="jeopardyeBlue.500" w="50%" value={this.state.selectedDuration} onChange={this.handleDurationChanged}>
                  {Object.entries(DURATIONS).map(([label, value]) =>
                    <option key={label} value={value}>{label}</option>
                  )}
                </Select>
              </Flex>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={this.state.cancelRef} onClick={this.props.modals.kickPlayerDialog.close}>Cancel</Button>
              <Button colorScheme="red" onClick={this.handleSubmit} ml={3}>Kick</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );
  }
}

export default KickPlayerDialog;
