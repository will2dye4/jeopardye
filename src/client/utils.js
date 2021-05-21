const SPEECH_DELAY_MILLIS = 500;

export function playSound(url) {
  new Audio(url).play().catch(console.log);
}

export function speakClue(clue, delay = SPEECH_DELAY_MILLIS) {
  if ('speechSynthesis' in window && clue?.question) {
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
