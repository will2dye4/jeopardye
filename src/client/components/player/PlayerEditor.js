import React from 'react';
import LogoPage from '../common/LogoPage';
import PlayerSettings from './settings/PlayerSettings';

class PlayerEditor extends React.Component {
  render() {
    return (
      <LogoPage id="player-editor">
        <div className="col mx-4 my-2">
          <PlayerSettings {...this.props} />
        </div>
      </LogoPage>
    );
  }
}

export default PlayerEditor;
