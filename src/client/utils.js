import React from 'react';
import { formatDate, formatWeekday } from '@dyesoft/alea-core';
import {
  SOUND_EFFECTS_ENABLED_KEY,
  SPEAK_CLUES_ENABLED_KEY,
  SPEAK_ANSWERS_ENABLED_KEY,
} from '../constants.mjs';

const DEFAULT_SOUND_EFFECT_VOLUME = 0.5;
const DEFAULT_SPEECH_VOLUME = 0.4;

const SPEECH_DELAY_MILLIS = 500;

export function formatElementList(items) {
  return (
    <React.Fragment>
      {items.map((item, i) => <React.Fragment key={i}>{item}{(i < items.length - 2) && ', '}{(i === items.length - 2) && ' and '}</React.Fragment>)}
    </React.Fragment>
  );
}

export function formatEpisodeTitle(episodeMetadata) {
  return (episodeMetadata.hasOwnProperty('title') ?
    episodeMetadata.title :
    `Show #${episodeMetadata.episodeNumber} - ${formatWeekday(episodeMetadata.airDate)}, ${formatDate(episodeMetadata.airDate, true)}`);
}

export function isChrome() {
  return !!window.chrome;
}

export function isSafari() {
  return !!window.safari;
}

export function isLocalStorageSettingEnabled(key) {
  return (localStorage.getItem(key) === 'true');
}

export function playSound(url, volume = DEFAULT_SOUND_EFFECT_VOLUME) {
  if (isLocalStorageSettingEnabled(SOUND_EFFECTS_ENABLED_KEY)) {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(console.log);
  }
}

export function speakClue(clue, delay = SPEECH_DELAY_MILLIS, volume = DEFAULT_SPEECH_VOLUME) {
  if (isLocalStorageSettingEnabled(SPEAK_CLUES_ENABLED_KEY)) {
    speakText(clue?.question, delay, volume);
  }
}

export function speakAnswer(text, delay = SPEECH_DELAY_MILLIS, volume = DEFAULT_SPEECH_VOLUME) {
  if (isLocalStorageSettingEnabled(SPEAK_ANSWERS_ENABLED_KEY)) {
    speakText(text, delay, volume);
  }
}

export function speakText(text, delay = SPEECH_DELAY_MILLIS, volume = DEFAULT_SPEECH_VOLUME) {
  if ('speechSynthesis' in window && text) {
    setTimeout(function() {
      text = text.replaceAll(/\b_+\b/g, 'blank');
      let message = new SpeechSynthesisUtterance(text);
      message.volume = volume;
      window.speechSynthesis.speak(message);
    }, delay);
  }
}
