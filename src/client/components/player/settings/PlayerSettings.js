import React from 'react';
import { Button, Flex, Heading } from '@chakra-ui/react';
import {
  DEFAULT_FONT_STYLE,
  MAX_PLAYER_NAME_LENGTH,
  PLACEHOLDER_PLAYER_NAME,
  PlayerEditorModes,
  SOUND_EFFECTS_ENABLED_KEY,
  SPEAK_CLUES_ENABLED_KEY,
  SPEAK_ANSWERS_ENABLED_KEY,
} from '../../../../constants.mjs';
import { validatePlayerName } from '../../../../models/player.mjs';
import { isLocalStorageSettingEnabled } from '../../../utils';
import Card from '../../common/card/Card';
import PlayerAudioPreferences from './PlayerAudioPreferences';
import PlayerFontStyleSetting from './PlayerFontStyleSetting';
import PlayerNameInput from './PlayerNameInput';

class PlayerSettings extends React.Component {
  constructor(props) {
    super(props);
    const player = this.getPlayer(props);
    this.state = {
      invalid: false,
      name: player?.name || '',
      fontStyle: player?.preferredFontStyle || DEFAULT_FONT_STYLE,
      soundEffectsEnabled: true,
      speakCluesEnabled: true,
      speakAnswersEnabled: true,
    };
    this.handleFontStyleChanged = this.handleFontStyleChanged.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleSoundEffectsChanged = this.handleSoundEffectsChanged.bind(this);
    this.handleSpeakCluesChanged = this.handleSpeakCluesChanged.bind(this);
    this.handleSpeakAnswersChanged = this.handleSpeakAnswersChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    let newState = {};
    if (localStorage.getItem(SOUND_EFFECTS_ENABLED_KEY)) {
      newState.soundEffectsEnabled = isLocalStorageSettingEnabled(SOUND_EFFECTS_ENABLED_KEY);
    }
    if (localStorage.getItem(SPEAK_CLUES_ENABLED_KEY)) {
      newState.speakCluesEnabled = isLocalStorageSettingEnabled(SPEAK_CLUES_ENABLED_KEY);
    }
    if (localStorage.getItem(SPEAK_ANSWERS_ENABLED_KEY)) {
      newState.speakAnswersEnabled = isLocalStorageSettingEnabled(SPEAK_ANSWERS_ENABLED_KEY);
    }
    this.setState(newState);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const prevPlayers = this.getAllPlayers(prevProps);
    const players = this.getAllPlayers();
    const playerID = this.props.playerID;
    if ((!prevProps.playerID && playerID && players.hasOwnProperty(playerID)) ||
        (playerID && !prevPlayers.hasOwnProperty(playerID) && players.hasOwnProperty(playerID))) {
      const player = players[playerID];
      this.setState({
        name: player.name,
        fontStyle: player.preferredFontStyle,
      });
    }
  }

  getAllPlayers(props) {
    if (!props) {
      props = this.props;
    }
    return {...props.players, ...props.spectators};
  }

  getPlayer(props) {
    if (!props) {
      props = this.props;
    }
    return this.getAllPlayers()[props.playerID];
  }

  handleFontStyleChanged(fontStyle) {
    this.setState({fontStyle: fontStyle});
  }

  handleNameChanged(event) {
    const name = event.target.value.trim();
    this.setState({invalid: !name, name: name.substring(0, MAX_PLAYER_NAME_LENGTH)});
  }

  handleSoundEffectsChanged() {
    this.setState({soundEffectsEnabled: !this.state.soundEffectsEnabled});
  }

  handleSpeakCluesChanged() {
    this.setState({speakCluesEnabled: !this.state.speakCluesEnabled});
  }

  handleSpeakAnswersChanged() {
    this.setState({speakAnswersEnabled: !this.state.speakAnswersEnabled});
  }

  handleSubmit() {
    if (!validatePlayerName(this.state.name.trim())) {
      this.setState({invalid: true});
    } else {
      if (!this.props.playerID) {
        this.props.createNewPlayer(this.state.name, this.state.fontStyle);
      } else {
        const player = this.getPlayer();
        if (this.state.name !== player.name || this.state.fontStyle !== player.preferredFontStyle) {
          this.props.changePlayerName(this.props.playerID, this.state.name, this.state.fontStyle);
        }
      }
      localStorage.setItem(SOUND_EFFECTS_ENABLED_KEY, this.state.soundEffectsEnabled);
      localStorage.setItem(SPEAK_CLUES_ENABLED_KEY, this.state.speakCluesEnabled);
      localStorage.setItem(SPEAK_ANSWERS_ENABLED_KEY, this.state.speakAnswersEnabled);
      if (this.props.onSubmit) {
        this.props.onSubmit();
      }
    }
  }

  render() {
    const name = this.state.name.trim() || PLACEHOLDER_PLAYER_NAME;
    const heading = (this.props.mode === PlayerEditorModes.CREATE ? 'Create New Player' : 'Edit Player Settings');
    const buttonLabel = (this.props.mode === PlayerEditorModes.CREATE ? 'Create' : 'Save');
    return (
      <Card className="game-settings" px={10} py={6}>
        <Heading mb={5} textAlign="center">{heading}</Heading>
        <PlayerNameInput name={this.state.name} invalid={this.state.invalid} onChange={this.handleNameChanged} />
        <PlayerFontStyleSetting name={name} selectedStyle={this.state.fontStyle} onChange={this.handleFontStyleChanged} />
        <PlayerAudioPreferences soundEffectsEnabled={this.state.soundEffectsEnabled} onSoundEffectsChanged={this.handleSoundEffectsChanged}
                                speakCluesEnabled={this.state.speakCluesEnabled} onSpeakCluesChanged={this.handleSpeakCluesChanged}
                                speakAnswersEnabled={this.state.speakAnswersEnabled} onSpeakAnswersChanged={this.handleSpeakAnswersChanged} />
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
