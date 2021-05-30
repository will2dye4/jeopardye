import React from 'react';
import {
  DEFAULT_FONT_STYLE,
  MAX_PLAYER_NAME_LENGTH,
  PLACEHOLDER_PLAYER_NAME,
  PlayerEditorModes,
  PREFERRED_FONT_STYLE_KEY,
} from '../../../../constants.mjs';
import { validatePlayerName } from '../../../../models/player.mjs';
import PlayerFontStyleSetting from './PlayerFontStyleSetting';
import PlayerNameInput from './PlayerNameInput';

class PlayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      invalid: false,
      name: props.player?.name || '',
      fontStyle: DEFAULT_FONT_STYLE,
    };
    this.handleFontStyleChanged = this.handleFontStyleChanged.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const fontStyle = localStorage.getItem(PREFERRED_FONT_STYLE_KEY);
    if (fontStyle) {
      this.setState({fontStyle: fontStyle});
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.player && this.props.player) {
      this.setState({name: this.props.player.name});
    }
  }

  handleFontStyleChanged(fontStyle) {
    this.setState({fontStyle: fontStyle});
  }

  handleNameChanged(event) {
    const name = event.target.value;
    this.setState({invalid: !name.trim(), name: name.substring(0, MAX_PLAYER_NAME_LENGTH)});
  }

  handleSubmit() {
    if (!validatePlayerName(this.state.name.trim())) {
      this.setState({invalid: true});
    } else {
      if (this.state.name !== this.props.player.name) {
        this.props.changePlayerName(this.props.player.playerID, this.state.name);
      }
      localStorage.setItem(PREFERRED_FONT_STYLE_KEY, this.state.fontStyle);
      if (this.props.onSubmit) {
        this.props.onSubmit();
      }
    }
  }

  render() {
    const name = this.state.name.trim() || PLACEHOLDER_PLAYER_NAME;
    const mode = this.props.player ? PlayerEditorModes.EDIT : PlayerEditorModes.CREATE;
    const heading = (mode === PlayerEditorModes.CREATE ? 'Create New Player' : 'Edit Player Settings');
    const buttonLabel = (mode === PlayerEditorModes.CREATE ? 'Create' : 'Save');
    return (
      <div className="card game-settings">
        <div className="card-body px-5 py-4">
          <h1 className="fw-bold text-center">{heading}</h1>
          <PlayerNameInput name={this.state.name} invalid={this.state.invalid} onChange={this.handleNameChanged} />
          <PlayerFontStyleSetting name={name} selectedStyle={this.state.fontStyle} onChange={this.handleFontStyleChanged} />
          <div className="d-flex justify-content-center mt-5 mb-3">
            <button type="button" className="btn btn-primary btn-lg w-25" onClick={this.handleSubmit}>{buttonLabel}</button>
          </div>
        </div>
      </div>
    );
  }
}

export default PlayerSettings;
