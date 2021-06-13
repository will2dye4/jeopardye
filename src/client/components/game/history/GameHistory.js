import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  List,
  Text,
} from '@chakra-ui/react';
import GameHistoryEvent from './GameHistoryEvent';

function scrollHistoryToBottom() {
  const modalBody = document.getElementById('chakra-modal--body-game-history');
  if (modalBody) {
    modalBody.scrollTop = modalBody.scrollHeight;
  }
}

class GameHistory extends React.Component {
  componentDidMount() {
    setTimeout(scrollHistoryToBottom, 100);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.eventHistory.length < this.props.eventHistory.length) {
      scrollHistoryToBottom();
    }
  }

  render() {
    let history;
    if (this.props.eventHistory.length) {
      history = (
        <List className="list-group">
          {this.props.eventHistory.map((event, i) => <GameHistoryEvent key={i} event={event} {...this.props} />)}
        </List>
      );
    } else {
      history = <Text className="empty-list" fontStyle="italic" pt={6} textAlign="center">No events to show</Text>;
    }
    return (
      <Drawer id="game-history" isOpen={true} placement="right" onClose={this.props.gameHistory.close}
              returnFocusOnClose={false}>
        <DrawerOverlay/>
        <DrawerContent borderLeftColor="jeopardyBlue.500" borderLeftWidth={4}>
          <DrawerCloseButton/>
          <DrawerHeader borderBottom="1px solid rgba(0, 0, 0, 0.125)" fontSize="3xl">Game History</DrawerHeader>
          <DrawerBody p={0}>
            {history}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }
}

export default GameHistory;
