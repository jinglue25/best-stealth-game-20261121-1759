import { STEP, BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game'), status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const givenSeed = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isFinite(givenSeed) ? givenSeed : Math.floor(Math.random() * 4294967296);
let best = 0;
try { best = Math.max(0, Number.parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0); } catch {}
const world = createWorld(createRandom(seed), params.has('shot') ? 0 : best);
const renderer = createRenderer(canvas), audio = createAudio();
const input = createInput(canvas, renderer, audio.unlock, () => world.state);
window.addEventListener('resize', () => { renderer.resize(); renderer.draw(world.state); });
let accumulator = 0, last = performance.now(), announced = '';

function updateStatus() {
  const s = world.state;
  const tag = `${s.screen}/${s.paused}/${s.levelIndex}/${s.lives}/${s.intel.filter(c => c.collected).length}/${s.spotted}`;
  if (tag === announced) return;
  announced = tag;
  status.textContent = s.screen === 'title' ? 'Nightshade Courier. Press Enter or Space to start. WASD moves, Shift sneaks, Space lifts intel, click throws a pebble.'
    : `${s.paused ? 'Paused' : s.screen}. ${s.level.name}. Intel ${s.intel.filter(c => c.collected).length} of ${s.intel.length}. ${s.lives} lives. Spotted ${s.spotted}. Score ${s.score}.`;
}
function commands() {
  const s = world.state;
  for (const command of input.takeCommands()) {
    if (command === 'confirm') { world.confirm(); accumulator = 0; }
    else if (command === 'pause' && s.screen === 'play') { s.paused = !s.paused; accumulator = 0; }
    else if (command === 'restart') { world.restart(); accumulator = 0; }
    else if (command === 'sound') { s.muted = !s.muted; audio.setMuted(s.muted); }
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  commands();
  accumulator += Math.min(.25, (now - last) / 1000); last = now;
  if (world.state.screen === 'play' && !world.state.paused) {
    while (accumulator >= STEP) { world.step(STEP, input.takeControl()); accumulator -= STEP; }
  } else accumulator = 0;
  for (const event of world.takeEvents()) audio.play(event);
  const s = world.state;
  if ((s.screen === 'win' || s.screen === 'over') && s.best > best) {
    best = s.best;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* Session best still works. */ }
  }
  renderer.draw(s); updateStatus();
}

if (params.has('shot')) {
  stageShot(params.get('shot'), world);
  // Paint twice so browser screenshot clients see a stable, fully sized frame.
  requestAnimationFrame(() => {
    renderer.draw(world.state); updateStatus();
    requestAnimationFrame(() => { renderer.draw(world.state); window.__shotReady = true; });
  });
} else requestAnimationFrame(frame);
