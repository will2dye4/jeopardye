import React from 'react';
import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { Emoji } from '../../../constants.mjs';
import Card from '../common/card/Card';

class RequestLinkDialog extends React.Component {
  render() {
    return (
      <Modal isOpen={true} onClose={this.props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6}>
              <Heading textAlign="center">Not yet {Emoji.WINK}</Heading>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default RequestLinkDialog;
