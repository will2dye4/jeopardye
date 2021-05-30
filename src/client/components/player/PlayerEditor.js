import React from 'react';
import { Box } from '@chakra-ui/react';
import './PlayerEditor.css';
import LogoPage from '../common/LogoPage';
import PlayerSettings from './settings/PlayerSettings';

class PlayerEditor extends React.Component {
  render() {
    return (
      <LogoPage id="player-editor">
        <Box mx={5} my={3}>
          <PlayerSettings {...this.props} />
        </Box>
      </LogoPage>
    );
  }
}

export default PlayerEditor;
