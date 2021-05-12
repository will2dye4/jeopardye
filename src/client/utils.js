export function playSound(url) {
  new Audio(url).play().catch(console.log);
}
