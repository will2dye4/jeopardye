import React from 'react';
import { PLACEHOLDER_PLAYER_NAME, PlayerEditorModes } from '../../../../constants.mjs';
import { validatePlayerName } from '../../../../models/player.mjs';
import PlayerFontStyleSetting from './PlayerFontStyleSetting';
import PlayerNameInput from './PlayerNameInput';

class PlayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      invalid: false,
      name: props.player?.name || '',
    };
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleNameChanged(event) {
    const name = event.target.value;
    const invalid = !validatePlayerName(name.trim());
    this.setState({invalid: invalid, name: name});
  }

  handleSubmit() {
    if (!validatePlayerName(this.state.name.trim())) {
      this.setState({invalid: true});
    } else {
      // TODO
    }
  }

  render() {
    const name = this.state.name || PLACEHOLDER_PLAYER_NAME;
    const mode = this.props.player ? PlayerEditorModes.EDIT : PlayerEditorModes.CREATE;
    const heading = (mode === PlayerEditorModes.CREATE ? 'Create New Player' : 'Edit Player Settings');
    const buttonLabel = (mode === PlayerEditorModes.CREATE ? 'Create' : 'Save');
    return (
      <div className="card game-settings">
        <div className="card-body px-5 py-4">
          <h1 className="fw-bold text-center">{heading}</h1>
          <PlayerNameInput name={this.state.name} invalid={this.state.invalid} onChange={this.handleNameChanged} />
          <PlayerFontStyleSetting name={name} />
          <div className="d-flex justify-content-center mt-5 mb-3">
            <button type="button" className="btn btn-primary btn-lg w-25" onClick={this.handleSubmit}>{buttonLabel}</button>
          </div>
        </div>
      </div>
    );
  }
}

export default PlayerSettings;
