import { JSERVICE_API_BASE, SOUND_EFFECTS_ENABLED_KEY, SPEAK_CLUES_ENABLED_KEY } from '../constants.mjs';

const INVALID_CLUE_URL =`${JSERVICE_API_BASE}/invalid`;

const SPEECH_DELAY_MILLIS = 500;

export function playSound(url) {
  if (localStorage.getItem(SOUND_EFFECTS_ENABLED_KEY) === 'true') {
    new Audio(url).play().catch(console.log);
  }
}

export function speakClue(clue, delay = SPEECH_DELAY_MILLIS) {
  if ('speechSynthesis' in window && clue?.question && localStorage.getItem(SPEAK_CLUES_ENABLED_KEY) === 'true') {
    setTimeout(function() {
      let text = clue.question.replaceAll(/\b_+\b/g, 'blank');
      let message = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(message);
    }, delay);
  }
}

export function getUnplayedClues(board, limit = -1) {
  let unplayedClues = [];
loop:
  for (const category of Object.values(board.categories)) {
    for (const clue of category.clues) {
      if (!clue.played) {
        unplayedClues.push(clue);
        if (limit !== -1 && unplayedClues.length >= limit) {
          break loop;
        }
      }
    }
  }
  return unplayedClues;
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
