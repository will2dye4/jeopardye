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

function PlayerEditor(props) {
  const mode = props.playerID ? PlayerEditorModes.EDIT : PlayerEditorModes.CREATE;
  const allowClose = (mode === PlayerEditorModes.EDIT);
  return (
    <Modal isOpen={true} closeOnEsc={allowClose} closeOnOverlayClick={allowClose}
           onClose={props.modals.playerEditor.close} size="5xl">
      <ModalOverlay />
      <ModalContent>
        {allowClose && <ModalCloseButton />}
        <ModalBody p={0}>
          <PlayerSettings mode={mode} onSubmit={props.modals.playerEditor.close} {...props} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default PlayerEditor;
