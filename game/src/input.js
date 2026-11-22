import { BUTTONS, FIELD } from './config.js';

// Input queues one-shot actions until a simulation step consumes them.
export function createInput(canvas, renderer, gesture, getState) {
  const held = new Set(), commands = [];
  let interact = false, pebble = null;
  const handled = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'ShiftLeft', 'ShiftRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyP', 'KeyR', 'KeyM']);
  window.addEventListener('keydown', e => {
    gesture();
    if (!handled.has(e.code)) return;
    e.preventDefault(); held.add(e.code);
    if (e.repeat) return;
    const s = getState();
    if (e.code === 'KeyP') commands.push('pause');
    else if (e.code === 'KeyR') commands.push('restart');
    else if (e.code === 'KeyM') commands.push('sound');
    else if (e.code === 'Enter') commands.push('confirm');
    else if (e.code === 'Space') {
      if (s.screen !== 'play' || s.paused) commands.push('confirm');
      else interact = true;
    }
  });
  window.addEventListener('keyup', e => { held.delete(e.code); if (handled.has(e.code)) e.preventDefault(); });
  function release() { held.clear(); interact = false; pebble = null; }
  window.addEventListener('blur', () => {
    release(); const s = getState();
    if (s.screen === 'play' && !s.paused) commands.push('pause');
  });
  const hit = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  canvas.addEventListener('pointerdown', e => {
    gesture(); if (e.button !== 0) return;
    const p = renderer.toLogical(e.clientX, e.clientY), s = getState();
    if (hit(p, BUTTONS.sound)) { commands.push('sound'); return; }
    if (s.screen === 'title') { if (hit(p, BUTTONS.title)) commands.push('confirm'); }
    else if (s.screen !== 'play' || s.paused) { if (hit(p, BUTTONS.panel)) commands.push('confirm'); }
    else if (p.x >= 24 && p.x <= FIELD.width - 24 && p.y > FIELD.top && p.y < FIELD.bottom) pebble = p;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  const down = (...keys) => keys.some(k => held.has(k));
  function takeControl() {
    const control = {
      x: Number(down('KeyD', 'ArrowRight')) - Number(down('KeyA', 'ArrowLeft')),
      y: Number(down('KeyS', 'ArrowDown')) - Number(down('KeyW', 'ArrowUp')),
      crouch: down('ShiftLeft', 'ShiftRight', 'KeyC'), interact, pebble,
    };
    interact = false; pebble = null; return control;
  }
  return { takeControl, takeCommands: () => commands.splice(0), release };
}
