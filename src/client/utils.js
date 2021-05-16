export function playSound(url) {
  new Audio(url).play().catch(console.log);
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
