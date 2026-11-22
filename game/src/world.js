import { FIELD, PLAYER, DETECTION, LIVES, SCORING } from './config.js';
import { LEVELS } from './levels.js';

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const turn = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// Slab intersection is a segment raycast, including parallel and grazing rays.
export function segmentRect(a, b, r, padding = 0) {
  let lo = 0, hi = 1;
  for (const [axis, size] of [['x', 'w'], ['y', 'h']]) {
    const d = b[axis] - a[axis], low = r[axis] - padding, high = r[axis] + r[size] + padding;
    if (Math.abs(d) < 1e-9) { if (a[axis] < low || a[axis] > high) return false; }
    else {
      let t0 = (low - a[axis]) / d, t1 = (high - a[axis]) / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      lo = Math.max(lo, t0); hi = Math.min(hi, t1);
      if (lo > hi) return false;
    }
  }
  return true;
}
export function canSee(level, a, b, padding = 0) {
  return !level.walls.concat(level.crates).some(r => segmentRect(a, b, r, padding));
}
export function blocked(level, p, radius = PLAYER.radius) {
  if (p.x < FIELD.margin + radius || p.x > FIELD.width - FIELD.margin - radius || p.y < FIELD.top + radius || p.y > FIELD.bottom - radius) return true;
  return level.walls.concat(level.crates).some(r => {
    const x = clamp(p.x, r.x, r.x + r.w), y = clamp(p.y, r.y, r.y + r.h);
    return Math.hypot(p.x - x, p.y - y) < radius;
  });
}

// Small A* grid. Guards use this to pursue around cover rather than through it.
// A risk callback also lets the screenshot courier prefer quieter routes.
export function findPath(level, from, target, risk = null) {
  const size = 22, cols = 54, rows = 24;
  const point = id => ({ x: 53 + id % cols * size, y: 143 + Math.floor(id / cols) * size });
  const nearest = p => {
    let best = -1, cost = Infinity;
    for (let id = 0; id < cols * rows; id++) {
      const q = point(id), d = distance(p, q);
      if (d < cost && !blocked(level, q, 13) && canSee(level, p, q, 12)) { best = id; cost = d; }
    }
    return best;
  };
  const start = nearest(from), goal = nearest(target);
  if (start < 0 || goal < 0) return [];
  const open = [start], parent = new Map(), scores = new Map([[start, 0]]), done = new Set();
  while (open.length) {
    let at = 0, lowest = Infinity;
    for (let i = 0; i < open.length; i++) {
      const id = open[i], f = scores.get(id) + distance(point(id), point(goal));
      if (f < lowest) { lowest = f; at = i; }
    }
    const id = open.splice(at, 1)[0];
    if (id === goal) {
      const path = [target]; let k = id;
      while (k !== start) { path.unshift(point(k)); k = parent.get(k); }
      path.unshift(point(start)); return path;
    }
    done.add(id);
    for (const offset of [-1, 1, -cols, cols]) {
      const next = id + offset;
      if (next < 0 || next >= cols * rows || done.has(next) || (Math.abs(offset) === 1 && Math.floor(id / cols) !== Math.floor(next / cols))) continue;
      const p = point(next);
      if (blocked(level, p, 13) || !canSee(level, point(id), p, 12)) continue;
      const score = scores.get(id) + size + (risk ? risk(p) : 0);
      if (score < (scores.get(next) ?? Infinity)) {
        scores.set(next, score); parent.set(next, id);
        if (!open.includes(next)) open.push(next);
      }
    }
  }
  return [];
}

export function exposure(state, p = state.player) {
  const shadow = state.level.bushes.some(r => inside(p, r));
  const lit = state.level.lamps.some(l => distance(l, p) < l.r * 0.88 && canSee(state.level, l, p));
  return { shadow, lit: lit && !shadow };
}
export function inVision(state, g, p = state.player) {
  const d = distance(g, p);
  return d < DETECTION.range && Math.abs(turn(g.angle, Math.atan2(p.y - g.y, p.x - g.x))) < DETECTION.halfAngle && canSee(state.level, g, p);
}

export function createWorld(random = Math.random, best = 0) {
  const state = { best, screen: 'title', paused: false, muted: false, events: [], records: [], clock: 0, stage: null };
  let noiseId = 0;
  const emit = name => state.events.push(name);
  function message(text, seconds = 4) { state.message = text; state.messageTime = seconds; }
  function loadLevel(index) {
    state.levelIndex = index; state.level = LEVELS[index];
    state.time = 0; state.spotted = 0; state.paused = false;
    state.scoreBase = state.score;
    const l = state.level;
    state.player = { ...l.start, angle: -Math.PI / 2, crouch: false, moving: false, invulnerable: PLAYER.invulnerable };
    state.guards = l.guards.map((g, i) => ({ ...g.points[0], points: g.points, speed: g.speed, pause: g.pause,
      angle: g.angle, baseAngle: g.angle, waypoint: 0, wait: g.pause + i * 0.4, mode: 'patrol', meter: 0,
      lost: 0, searchTime: 0, path: [], repath: 0, lastNoise: -1, phase: random() * Math.PI * 2,
    }));
    state.intel = l.intel.map(p => ({ ...p, collected: false }));
    state.pebbles = l.pebbles; state.projectiles = []; state.noises = []; state.ripples = [];
    state.stepSound = 0; state.catchFlash = 0;
    message(l.briefing, 8);
  }
  function reset() {
    state.score = 0; state.lives = LIVES; state.records = []; state.clock = 0;
    state.events = []; state.stage = null; loadLevel(0); state.screen = 'title';
  }
  function start() { reset(); state.screen = 'play'; emit('start'); }
  function restart() {
    if (state.screen !== 'play') return;
    state.score = state.scoreBase; loadLevel(state.levelIndex); message('Route reset. Take a breath; watch the patrols.', 4);
  }
  function confirm() {
    if (state.paused) { state.paused = false; return; }
    if (['title', 'over', 'win'].includes(state.screen)) start();
    else if (state.screen === 'clear') {
      if (state.levelIndex < LEVELS.length - 1) { loadLevel(state.levelIndex + 1); state.screen = 'play'; }
      else {
        state.screen = 'win'; state.best = Math.max(state.best, state.score); emit('win');
      }
    }
  }
  function noise(p, radius, kind) {
    state.noises.push({ ...p, radius, life: 0.8, id: noiseId++, kind });
    state.ripples.push({ ...p, radius, age: 0, duration: 1.15 });
  }
  function throwPebble(target) {
    if (state.screen !== 'play' || state.paused || !state.pebbles) return;
    const p = state.player, d = distance(p, target), scale = Math.min(1, 320 / Math.max(1, d));
    let end = { x: clamp(p.x + (target.x - p.x) * scale, 48, 1230), y: clamp(p.y + (target.y - p.y) * scale, 145, 640) };
    // The pebble stops at solid cover; it cannot be thrown through a building.
    for (let t = 0.025; t <= 1; t += 0.025) {
      const q = { x: p.x + (end.x - p.x) * t, y: p.y + (end.y - p.y) * t };
      if (blocked(state.level, q, 3)) { end = { x: p.x + (end.x - p.x) * Math.max(0, t - 0.04), y: p.y + (end.y - p.y) * Math.max(0, t - 0.04) }; break; }
    }
    state.projectiles.push({ from: { x: p.x, y: p.y }, to: end, age: 0, duration: 0.42 });
    state.pebbles--; message('Pebble away. Move while they investigate.', 2.5);
  }
  function collect() {
    for (const chip of state.intel) {
      if (!chip.collected && distance(state.player, chip) < 34) {
        chip.collected = true; state.score += SCORING.intel; emit('pickup');
        message('Intel secured. ' + state.intel.filter(c => c.collected).length + ' / ' + state.intel.length + ' recovered.', 3);
      }
    }
  }
  function clearLevel() {
    const intel = state.intel.filter(c => c.collected).length;
    const timeBonus = Math.floor(Math.max(0, SCORING.timeLimit - state.time) * SCORING.timeRate);
    const stealthBonus = state.spotted === 0 ? SCORING.stealth : 0;
    const perfectBonus = intel === state.intel.length ? SCORING.perfect : 0;
    const missingCost = (state.intel.length - intel) * 300;
    const bonus = timeBonus + stealthBonus + perfectBonus - missingCost;
    state.score += bonus;
    state.records.push({ time: state.time, spotted: state.spotted, intel, total: state.intel.length, timeBonus, stealthBonus, perfectBonus, missingCost, bonus });
    state.screen = 'clear'; emit('clear');
  }
  function catchPlayer() {
    state.lives--; state.catchFlash = 1; emit('caught');
    if (!state.lives) { state.screen = 'over'; state.best = Math.max(state.best, state.score); return; }
    Object.assign(state.player, state.level.start, { invulnerable: PLAYER.invulnerable });
    // A new entry gives the courier a short grace period and resets the search.
    state.guards.forEach(g => { Object.assign(g, g.points[0], { mode: 'patrol', waypoint: 0, wait: g.pause, meter: 0, path: [], lost: 0 }); });
    message('Intercepted. Intel retained. ' + state.lives + ' lives remain.', 5);
  }
  function move(body, dx, dy, radius) {
    if (!blocked(state.level, { x: body.x + dx, y: body.y }, radius)) body.x += dx;
    if (!blocked(state.level, { x: body.x, y: body.y + dy }, radius)) body.y += dy;
  }
  function navigate(g, goal, speed, dt) {
    if (distance(g, goal) < 9) return true;
    g.repath -= dt;
    if (g.repath <= 0 || !g.path.length) { g.path = findPath(state.level, g, goal); g.repath = 0.9; }
    while (g.path.length && distance(g, g.path[0]) < 8) g.path.shift();
    const target = canSee(state.level, g, goal, 12) ? goal : g.path[0];
    if (!target) return false;
    const a = Math.atan2(target.y - g.y, target.x - g.x);
    g.angle += clamp(turn(g.angle, a), -dt * 4, dt * 4);
    const step = Math.min(speed * dt, distance(g, target));
    move(g, Math.cos(a) * step, Math.sin(a) * step, 11);
    return false;
  }
  function updateGuard(g, dt) {
    const p = state.player, visible = p.invulnerable <= 0 && inVision(state, g);
    const env = exposure(state), d = distance(g, p);
    if (visible) {
      const rate = DETECTION.fill * (1.5 - d / DETECTION.range * 0.7) * (p.crouch ? 0.46 : 1) * (env.shadow ? 0.28 : env.lit ? 1.65 : 0.85) * (p.moving ? 1.2 : 0.7);
      g.meter = Math.min(1, g.meter + rate * dt); g.lastSeen = { x: p.x, y: p.y };
      if (g.mode === 'alert') g.lost = 0;
      else if (g.meter >= 1) {
        g.mode = 'alert'; g.lost = 0; g.path = []; g.repath = 0;
        state.spotted++; state.score -= SCORING.spotted; emit('alert');
        message('Spotted! Break sight, then hide in shadow.', 4);
      } else if (g.meter > 0.16 && g.mode === 'patrol') { g.mode = 'suspicious'; g.searchTime = 2.4; }
    } else if (g.mode !== 'alert') g.meter = Math.max(0, g.meter - DETECTION.drain * dt);

    if (g.mode !== 'alert') {
      for (const n of state.noises) {
        if (n.id > g.lastNoise && distance(g, n) < n.radius) {
          g.lastNoise = n.id; g.mode = 'suspicious'; g.lastSeen = { x: n.x, y: n.y }; g.searchTime = 3;
          g.path = []; g.repath = 0;
        }
      }
    }
    if (g.mode === 'alert') {
      if (!visible) g.lost += dt;
      navigate(g, g.lastSeen || p, g.speed * 1.75, dt);
      if (distance(g, p) < 23 && p.invulnerable <= 0) { catchPlayer(); return; }
      if (g.lost > 1.6) { g.mode = 'search'; g.searchTime = DETECTION.search; g.baseAngle = g.angle; }
    } else if (g.mode === 'suspicious') {
      if (visible && g.meter > 0.06) {
        const a = Math.atan2(p.y - g.y, p.x - g.x); g.angle += clamp(turn(g.angle, a), -dt * 2.3, dt * 2.3);
      } else if (g.lastSeen && distance(g, g.lastSeen) > 12) navigate(g, g.lastSeen, g.speed * 0.85, dt);
      else { g.searchTime -= dt; g.angle += Math.sin(state.clock * 2 + g.phase) * dt; }
      if ((!visible && g.meter === 0 && g.searchTime <= 0) || !g.lastSeen) { g.mode = 'return'; g.path = []; }
    } else if (g.mode === 'search') {
      g.searchTime -= dt; g.angle += dt * 1.25;
      if (g.searchTime <= 0) { g.mode = 'return'; g.meter = 0; g.path = []; message('Search called off. Keep moving.', 3); }
    } else if (g.mode === 'return') {
      if (navigate(g, g.points[g.waypoint], g.speed, dt)) { g.mode = 'patrol'; g.wait = g.pause; g.baseAngle = g.angle; }
    } else {
      if (g.wait > 0) {
        g.wait -= dt; g.angle = g.baseAngle + Math.sin((g.pause - g.wait) * 1.7 + g.phase) * 0.65;
        if (g.wait <= 0) g.waypoint = (g.waypoint + 1) % g.points.length;
      } else if (navigate(g, g.points[g.waypoint], g.speed, dt)) { g.wait = g.pause; g.baseAngle = g.angle; }
    }
  }
  function step(dt, control = {}) {
    if (state.screen !== 'play' || state.paused) return;
    state.clock += dt; state.time += dt;
    state.messageTime = Math.max(0, state.messageTime - dt); state.catchFlash = Math.max(0, state.catchFlash - dt * 1.7);
    const p = state.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt); p.crouch = !!control.crouch;
    const dx = control.x || 0, dy = control.y || 0, len = Math.hypot(dx, dy);
    p.moving = len > 0;
    if (len) {
      const speed = p.crouch ? PLAYER.sneakSpeed : PLAYER.speed;
      move(p, dx / len * speed * dt, dy / len * speed * dt, PLAYER.radius);
      p.angle = Math.atan2(dy, dx);
      state.stepSound -= dt;
      if (state.stepSound <= 0) {
        state.stepSound = p.crouch ? 0.48 : 0.3; emit(p.crouch ? 'sneak' : 'step');
        if (!p.crouch) noise(p, DETECTION.hearing, 'footstep');
      }
    }
    if (control.interact) collect();
    if (control.pebble) throwPebble(control.pebble);
    for (const pebble of state.projectiles) {
      pebble.age += dt;
      if (pebble.age >= pebble.duration && !pebble.landed) { pebble.landed = true; noise(pebble.to, 280, 'pebble'); emit('pebble'); }
    }
    state.projectiles = state.projectiles.filter(p => !p.landed);
    state.noises.forEach(n => n.life -= dt); state.noises = state.noises.filter(n => n.life > 0);
    state.ripples.forEach(n => n.age += dt); state.ripples = state.ripples.filter(n => n.age < n.duration);
    for (const guard of state.guards) { updateGuard(guard, dt); if (state.screen !== 'play') break; }
    if (state.screen === 'play' && inside(p, state.level.exit)) {
      if (state.intel.filter(c => c.collected).length >= state.level.required) clearLevel();
      else message('Exit locked: recover at least ' + state.level.required + ' intel chips.', 2);
    }
  }
  function totals() {
    const complete = state.records.reduce((a, r) => ({ time: a.time + r.time, spotted: a.spotted + r.spotted, intel: a.intel + r.intel }), { time: 0, spotted: 0, intel: 0 });
    if (state.screen === 'over') { complete.time += state.time; complete.spotted += state.spotted; complete.intel += state.intel.filter(c => c.collected).length; }
    return complete;
  }
  reset();
  return { state, start, reset, step, confirm, restart, throwPebble, totals, takeEvents: () => state.events.splice(0) };
}
