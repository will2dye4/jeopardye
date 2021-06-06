import React from 'react';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { PlayerEditorModes } from '../../../constants.mjs';
import './PlayerEditor.css';
import PlayerSettings from './settings/PlayerSettings';

class PlayerEditor extends React.Component {
  render() {
    const mode = this.props.playerID ? PlayerEditorModes.EDIT : PlayerEditorModes.CREATE;
    const allowClose = (mode === PlayerEditorModes.EDIT);
    return (
      <Modal isOpen={true} closeOnEsc={allowClose} closeOnOverlayClick={allowClose}
             onClose={this.props.playerEditor.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          {allowClose && <ModalCloseButton />}
          <ModalBody p={0}>
            <PlayerSettings mode={mode} onSubmit={this.props.playerEditor.close} {...this.props} />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default PlayerEditor;
