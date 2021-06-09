import {
  JSERVICE_API_BASE,
  SOUND_EFFECTS_ENABLED_KEY,
  SPEAK_CLUES_ENABLED_KEY,
  SPEAK_ANSWERS_ENABLED_KEY,
} from '../constants.mjs';

const DEFAULT_SOUND_EFFECT_VOLUME = 0.5;
const DEFAULT_SPEECH_VOLUME = 0.5;

const INVALID_CLUE_URL =`${JSERVICE_API_BASE}/invalid`;

const SPEECH_DELAY_MILLIS = 500;

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
    speakText(clue?.question, delay);
  }
}

export function speakAnswer(text, delay = SPEECH_DELAY_MILLIS, volume = DEFAULT_SPEECH_VOLUME) {
  if (isLocalStorageSettingEnabled(SPEAK_ANSWERS_ENABLED_KEY)) {
    speakText(text, delay);
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

export function markClueAsInvalid(clueID) {
  return fetch(`${INVALID_CLUE_URL}?id=${clueID}`).then(response => {
    if (response.ok) {
      console.log(`Marked clue ${clueID} as invalid.`);
    } else {
      console.log(`Failed to mark clue ${clueID} as invalid: ${response.status} ${response.statusText}`)
    }
    return response;
  });
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.log(`Failed to copy to clipboard: ${e}`);
  }
}
