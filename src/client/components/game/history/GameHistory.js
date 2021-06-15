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
    if (this.props.gameHistory.scroll && prevProps.eventHistory.length < this.props.eventHistory.length) {
      scrollHistoryToBottom();
    }
  }

  toggleScroll() {
    this.props.gameHistory.toggleScroll();
    if (!this.props.gameHistory.scroll) {
      scrollHistoryToBottom();
    }
  }

  render() {
    const contentProps = (this.props.gameHistory.side === 'left' ?
      {borderRightColor: 'jeopardyBlue.500', borderRightWidth: 4} :
      {borderLeftColor: 'jeopardyBlue.500', borderLeftWidth: 4});
    let history;
    if (this.props.eventHistory.length) {
      history = (
        <List className="list-group">
          {this.props.eventHistory.map((event, i) => <GameHistoryEvent key={i} index={i} event={event} {...this.props} />)}
        </List>
      );
    } else {
      history = <Text className="empty-list" fontStyle="italic" pt={6} textAlign="center">No events to show</Text>;
    }
    return (
      <Drawer id="game-history" isOpen={true} placement={this.props.gameHistory.side} onClose={this.props.gameHistory.close}
              returnFocusOnClose={false} size={this.props.gameHistory.size}>
        <DrawerOverlay />
        <DrawerContent {...contentProps}>
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid rgba(0, 0, 0, 0.125)" fontSize="3xl">
            Game History
            <GameHistoryButtons gameHistory={this.props.gameHistory} toggleScroll={this.toggleScroll} />
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
