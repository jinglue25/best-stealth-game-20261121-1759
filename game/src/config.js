// Logical pixels are shared by simulation, input and canvas layout.
export const FIELD = { width: 1280, height: 720, top: 112, bottom: 674, margin: 24 };
export const STEP = 1 / 60;
export const LIVES = 3;
export const PLAYER = { radius: 11, speed: 176, sneakSpeed: 79, invulnerable: 2.8 };
export const DETECTION = { range: 215, halfAngle: Math.PI * 35 / 180, fill: 0.63, drain: 0.43, search: 5.5, hearing: 132 };
export const SCORING = { intel: 500, spotted: 150, stealth: 1000, perfect: 750, timeRate: 8, timeLimit: 180 };
export const BEST_KEY = 'nightshade-courier.best.v1';
export const FONT = '"Trebuchet MS", sans-serif';
export const MONO = '"Courier New", monospace';
export const PALETTE = {
  background: '#080f19', floor: '#182735', line: '#263a48', wall: '#334653',
  mint: '#a9f4d1', teal: '#51d6b2', gold: '#efcd86', red: '#ff776e',
  text: '#e9f1e9', muted: '#8caaaF', shadow: '#0b1b26', panel: '#0c1a26',
};
export const BUTTONS = {
  title: { x: 100, y: 529, w: 300, h: 58 },
  panel: { x: 490, y: 530, w: 300, h: 56 },
  sound: { x: 1200, y: 20, w: 54, h: 38 },
};
export function formatTime(seconds) {
  // Fixed-step sums can land a fraction below an exact second.
  const n = Math.max(0, Math.floor(seconds + 1e-7));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
