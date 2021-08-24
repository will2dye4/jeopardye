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
import { MAX_GAME_HISTORY_LENGTH } from '../../../../constants.mjs';
import GameHistoryButtons from './GameHistoryButtons';
import GameHistoryEvent from './GameHistoryEvent';

function scrollHistoryToBottom() {
  const modalBody = document.getElementById('chakra-modal--body-game-history');
  if (modalBody) {
    modalBody.scrollTop = modalBody.scrollHeight;
  }
}

class GameHistory extends React.Component {
  constructor(props) {
    super(props);
    this.toggleScroll = this.toggleScroll.bind(this);
  }

  componentDidMount() {
    setTimeout(scrollHistoryToBottom, 100);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.modals.gameHistory.scroll && prevProps.eventHistory.length < this.props.eventHistory.length) {
      scrollHistoryToBottom();
    }
  }

  toggleScroll() {
    this.props.modals.gameHistory.toggleScroll();
    if (!this.props.modals.gameHistory.scroll) {
      scrollHistoryToBottom();
    }
  }

  render() {
    const contentProps = (this.props.modals.gameHistory.side === 'left' ?
      {borderRightColor: 'jeopardyeBlue.500', borderRightWidth: 4} :
      {borderLeftColor: 'jeopardyeBlue.500', borderLeftWidth: 4});
    let history;
    if (this.props.eventHistory.length) {
      let eventHistory = this.props.eventHistory;
      if (eventHistory.length > MAX_GAME_HISTORY_LENGTH) {
        eventHistory = eventHistory.slice(eventHistory.length - MAX_GAME_HISTORY_LENGTH);
      }
      history = (
        <List className="list-group">
          {eventHistory.map((event, i) => <GameHistoryEvent key={i} index={i} event={event} {...this.props} />)}
        </List>
      );
    } else {
      history = <Text className="empty-list" fontStyle="italic" pt={6} textAlign="center">No events to show</Text>;
    }
    return (
      <Drawer id="game-history" isOpen={true} placement={this.props.modals.gameHistory.side} onClose={this.props.modals.gameHistory.close}
              returnFocusOnClose={false} size={this.props.modals.gameHistory.size}>
        <DrawerOverlay />
        <DrawerContent {...contentProps}>
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid rgba(0, 0, 0, 0.125)" fontSize="3xl">
            Game History
            <GameHistoryButtons modals={this.props.modals} toggleScroll={this.toggleScroll} />
          </DrawerHeader>
          <DrawerBody p={0}>
            {history}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }
}

export default GameHistory;
