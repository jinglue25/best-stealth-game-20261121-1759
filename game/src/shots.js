import { STEP, DETECTION } from './config.js';
import { findPath, distance, inVision, exposure } from './world.js';

// Screenshot scenes advance the same simulation as keyboard play. No draw-only
// positions, HUD numbers or collected chips are injected into the renderer.
function walk(world, target, seconds, crouch = true) {
  let path = findPath(world.state.level, world.state.player, target);
  for (let i = 0; i < seconds / STEP; i++) {
    const p = world.state.player;
    while (path.length && distance(p, path[0]) < 3) path.shift();
    const q = path[0] || target, d = distance(p, q);
    world.step(STEP, { x: d > 2 ? q.x - p.x : 0, y: d > 2 ? q.y - p.y : 0, crouch, interact: true });
    world.takeEvents();
  }
}

function deliveryPilot(world, caution) {
  let target = null, path = [], replan = 0, lastLevel = -1;
  for (let tick = 0; tick < 60 * 900; tick++) {
    const s = world.state;
    if (s.screen === 'win') return true;
    if (s.screen === 'over') return false;
    if (s.screen === 'clear') { world.confirm(); target = null; path = []; continue; }
    if (lastLevel !== s.levelIndex) { target = null; replan = 0; lastLevel = s.levelIndex; }
    if (!target || target.collected) {
      target = s.intel.filter(c => !c.collected).sort((a, b) => distance(a, s.player) - distance(b, s.player))[0];
      if (!target) target = { x: s.level.exit.x + s.level.exit.w / 2, y: s.level.exit.y + s.level.exit.h / 2 };
      replan = 0;
    }
    replan -= STEP;
    if (replan <= 0 || !path.length) {
      path = findPath(s.level, s.player, target, q => {
        let cost = 0;
        for (const g of s.guards) {
          const d = distance(g, q);
          if (inVision(s, g, q)) cost += caution * (1 + (DETECTION.range - d) / 70) * (exposure(s, q).shadow ? .2 : 1);
          if (d < 65) cost += caution * 3;
        }
        return cost;
      });
      replan = 1.4;
    }
    while (path.length && distance(s.player, path[0]) < 4) path.shift();
    const q = path[0] || target;
    world.step(STEP, { x: q.x - s.player.x, y: q.y - s.player.y, crouch: true, interact: true });
    world.takeEvents();
  }
  return false;
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') return;
  world.start();
  if (name === 'play') {
    walk(world, { x: 155, y: 562 }, 3);
    walk(world, { x: 280, y: 523 }, 3);
    walk(world, { x: 280, y: 470 }, 2);
    // Wait under the planter's shadow while the actual patrol loops nearby.
    for (let i = 0; i < 34 / STEP; i++) world.step(STEP, { crouch: true });
  } else {
    // Alternate route penalties are deterministic and use fresh, real runs if
    // a bold route is intercepted. Each success passes through all clear panels.
    let succeeded = false;
    for (const caution of [32, 75, 140, 12, 240, 50]) {
      if (succeeded) break;
      world.start(); succeeded = deliveryPilot(world, caution);
    }
  }
  world.takeEvents(); world.state.stage = name;
}
