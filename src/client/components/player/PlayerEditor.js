import React from 'react';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import './PlayerEditor.css';
import PlayerSettings from './settings/PlayerSettings';

class PlayerEditor extends React.Component {
  render() {
    return (
      <Modal isOpen={true} onClose={this.props.playerEditor.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <PlayerSettings onSubmit={this.props.playerEditor.close} {...this.props} />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default PlayerEditor;
