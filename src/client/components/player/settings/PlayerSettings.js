import React from 'react';
import {
  Button,
  Flex,
  Heading,
} from '@chakra-ui/react';
import {
  DEFAULT_FONT_STYLE,
  MAX_PLAYER_NAME_LENGTH,
  PLACEHOLDER_PLAYER_NAME,
  PlayerEditorModes,
  SOUND_EFFECTS_ENABLED_KEY,
  SPEAK_CLUES_ENABLED_KEY,
} from '../../../../constants.mjs';
import { validatePlayerName } from '../../../../models/player.mjs';
import Card from '../../common/card/Card';
import PlayerAudioPreferences from './PlayerAudioPreferences';
import PlayerFontStyleSetting from './PlayerFontStyleSetting';
import PlayerNameInput from './PlayerNameInput';

class PlayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      invalid: false,
      name: props.player?.name || '',
      fontStyle: props.player?.preferredFontStyle || DEFAULT_FONT_STYLE,
      soundEffectsEnabled: true,
      speakCluesEnabled: true,
    };
    this.handleFontStyleChanged = this.handleFontStyleChanged.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleSoundEffectsChanged = this.handleSoundEffectsChanged.bind(this);
    this.handleSpeakCluesChanged = this.handleSpeakCluesChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    let newState = {};
    const soundEffectsEnabled = localStorage.getItem(SOUND_EFFECTS_ENABLED_KEY);
    if (soundEffectsEnabled) {
      newState.soundEffectsEnabled = (soundEffectsEnabled === 'true');
    }
    const speakCluesEnabled = localStorage.getItem(SPEAK_CLUES_ENABLED_KEY);
    if (speakCluesEnabled) {
      newState.speakCluesEnabled = (speakCluesEnabled === 'true');
    }
    this.setState(newState);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.player && this.props.player) {
      this.setState({
        name: this.props.player.name,
        fontStyle: this.props.player.preferredFontStyle,
      });
    }
  }

  handleFontStyleChanged(fontStyle) {
    this.setState({fontStyle: fontStyle});
  }

  handleNameChanged(event) {
    const name = event.target.value;
    this.setState({invalid: !name.trim(), name: name.substring(0, MAX_PLAYER_NAME_LENGTH)});
  }

  handleSoundEffectsChanged() {
    this.setState({soundEffectsEnabled: !this.state.soundEffectsEnabled});
  }

  handleSpeakCluesChanged() {
    this.setState({speakCluesEnabled: !this.state.speakCluesEnabled});
  }

  handleSubmit() {
    if (!validatePlayerName(this.state.name.trim())) {
      this.setState({invalid: true});
    } else {
      if (!this.props.player) {
        this.props.createNewPlayer(this.state.name, this.state.fontStyle);
      } else if (this.state.name !== this.props.player.name || this.state.fontStyle !== this.props.player.preferredFontStyle) {
        this.props.changePlayerName(this.props.player.playerID, this.state.name, this.state.fontStyle);
      }
      localStorage.setItem(SOUND_EFFECTS_ENABLED_KEY, this.state.soundEffectsEnabled);
      localStorage.setItem(SPEAK_CLUES_ENABLED_KEY, this.state.speakCluesEnabled);
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
      <Card className="game-settings" px={10} py={6}>
        <Heading mb={5} textAlign="center">{heading}</Heading>
        <PlayerNameInput name={this.state.name} invalid={this.state.invalid} onChange={this.handleNameChanged} />
        <PlayerFontStyleSetting name={name} selectedStyle={this.state.fontStyle} onChange={this.handleFontStyleChanged} />
        <PlayerAudioPreferences soundEffectsEnabled={this.state.soundEffectsEnabled} onSoundEffectsChanged={this.handleSoundEffectsChanged}
                                speakCluesEnabled={this.state.speakCluesEnabled} onSpeakCluesChanged={this.handleSpeakCluesChanged} />
        <Flex justify="center" mt={8} mb={3}>
          <Button colorScheme="jeopardyBlue" size="lg" w="25%" isDisabled={this.state.invalid} onClick={this.handleSubmit}>
            {buttonLabel}
          </Button>
        </Flex>
      </Card>
    );
  }
}

export default PlayerSettings;
