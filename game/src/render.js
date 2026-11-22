import { FIELD, FONT, MONO, PALETTE as C, BUTTONS, DETECTION, formatTime } from './config.js';
import { canSee, exposure, distance } from './world.js';

// All artwork is composed here from canvas paths, light and typography.
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0, ratio: 1 };
  function resize() {
    view.ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(window.innerWidth * view.ratio);
    canvas.height = Math.round(window.innerHeight * view.ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }
  function text(value, x, y, size = 14, color = C.text, font = FONT, weight = 400, align = 'left') {
    ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align;
    ctx.fillText(String(value), x, y);
  }
  function rect(x, y, w, h, fill, stroke) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); }
  }
  function line(x, y, x2, y2, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function circle(x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function pill(label, x, y, color = C.mint) {
    ctx.font = `12px ${MONO}`;
    const w = ctx.measureText(label).width + 22;
    rect(x, y, w, 25, '#0c1a26e8', color + '60'); text(label, x + 11, y + 17, 12, color, MONO);
  }
  function button(label, box, sub = '') {
    rect(box.x, box.y, box.w, box.h, C.mint);
    text(label, box.x + 22, box.y + 36, 18, '#102831', FONT, 700);
    text('↗', box.x + box.w - 24, box.y + 37, 26, '#102831', FONT, 400, 'right');
    if (sub) text(sub, box.x + box.w / 2, box.y + box.h + 25, 12, C.muted, MONO, 400, 'center');
  }
  function shadow(r, length = 65) {
    ctx.save(); ctx.fillStyle = '#060d1780'; ctx.shadowColor = '#050c16'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y);
    ctx.lineTo(r.x + r.w + length, r.y + length); ctx.lineTo(r.x + length, r.y + r.h + length); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawFloor(s) {
    rect(0, 0, 1280, 720, C.background);
    rect(24, 112, 1232, 562, C.floor);
    // Staggered roof tiles and seams supply scale without obscuring the silhouettes.
    ctx.save(); ctx.beginPath(); ctx.rect(42, 130, 1196, 526); ctx.clip();
    for (let y = 130; y < 674; y += 44) {
      line(24, y, 1256, y, '#223442');
      for (let x = 24 + (y % 88 ? 44 : 0); x < 1256; x += 88) line(x, y, x, y + 44, '#21323f');
    }
    // Drain grilles and weathered roof markings.
    for (const x of [72, 1192]) for (let y = 314; y < 354; y += 5) line(x, y, x + 20, y, '#0b1923', 2);
    ctx.setLineDash([6, 9]); rect(55, 145, 1170, 494, null, '#5c778527'); ctx.setLineDash([]);
    text('N / ' + String(s.levelIndex + 1).padStart(2, '0'), 1156, 636, 17, '#617d8a60', MONO);
    for (const b of s.level.bushes) {
      rect(b.x, b.y, b.w, b.h, '#0a2028');
      for (let i = 0; i < Math.floor(b.w * b.h / 180); i++) {
        const x = b.x + 7 + ((i * 37) % Math.max(1, b.w - 14));
        const y = b.y + 6 + ((i * 23) % Math.max(1, b.h - 12));
        ctx.save(); ctx.translate(x, y); ctx.rotate(i * 2.4);
        ctx.fillStyle = i % 3 ? '#193a3b' : '#25504a'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      line(b.x, b.y + b.h, b.x + b.w, b.y + b.h, '#3b5c56', 3);
    }
    for (const lamp of s.level.lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, lamp.r);
      g.addColorStop(0, '#ffd49a31'); g.addColorStop(.45, '#f6bc6f1b'); g.addColorStop(1, '#e4ad6800');
      circle(lamp.x, lamp.y, lamp.r, g);
    }
    for (const r of [...s.level.walls, ...s.level.crates]) shadow(r);
    ctx.restore();
  }
  function drawCover(s) {
    for (const r of s.level.walls) {
      rect(r.x, r.y, r.w, r.h, '#111d29');
      rect(r.x, r.y - 5, r.w, r.h - 3, '#344753', '#536773');
      line(r.x + 4, r.y - 3, r.x + r.w - 4, r.y - 3, '#72818a70', 2);
    }
    for (const r of s.level.crates) {
      rect(r.x, r.y, r.w, r.h, '#14212b');
      rect(r.x, r.y - 7, r.w, r.h - 2, '#46545a', '#738079');
      rect(r.x + 6, r.y, r.w - 12, r.h - 16, '#37464e', '#61706e');
      line(r.x + 8, r.y + 2, r.x + r.w - 8, r.y + r.h - 18, '#576861', 4);
      line(r.x + r.w - 8, r.y + 2, r.x + 8, r.y + r.h - 18, '#576861', 4);
      rect(r.x + r.w / 2 - 7, r.y + r.h / 2 - 13, 14, 15, '#819082');
      text('NC', r.x + 10, r.y + r.h - 16, 9, '#a1ada2', MONO);
    }
    for (const l of s.level.lamps) {
      line(l.x + 7, l.y + 16, l.x, l.y - 6, '#0a1622', 5);
      circle(l.x, l.y, 7, '#e6c38c', '#fff0ca'); circle(l.x, l.y, 3, '#fff9d9');
    }
  }
  function cone(s, g) {
    const color = g.mode === 'alert' ? '#ff6962' : ['suspicious', 'search'].includes(g.mode) ? '#ffb35d' : '#f2d881';
    ctx.save();
    const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, DETECTION.range);
    gradient.addColorStop(0, color + '40'); gradient.addColorStop(1, color + '08');
    ctx.beginPath(); ctx.moveTo(g.x, g.y);
    for (let i = 0; i <= 48; i++) {
      const a = g.angle - DETECTION.halfAngle + DETECTION.halfAngle * 2 * i / 48;
      let lo = 0, hi = DETECTION.range;
      const end = r => ({ x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r });
      if (!canSee(s.level, g, end(hi))) {
        for (let j = 0; j < 9; j++) { const m = (lo + hi) / 2; if (canSee(s.level, g, end(m))) lo = m; else hi = m; }
      }
      const p = end(hi); ctx.lineTo(p.x, p.y);
    }
    ctx.closePath(); ctx.fillStyle = gradient; ctx.fill(); ctx.strokeStyle = color + '35'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  function courier(x, y, angle, crouch, scale = 1, time = 0, moving = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#060d1780'; ctx.beginPath(); ctx.ellipse(6, 9, 15, 8, .4, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(angle + Math.PI / 2);
    const stride = moving ? Math.sin(time * (crouch ? 12 : 18)) * 4 : 0;
    line(-5, 5, -6, 13 + stride, '#8db9ad', 4); line(5, 5, 6, 13 - stride, '#8db9ad', 4);
    ctx.beginPath(); ctx.moveTo(0, crouch ? -11 : -15); ctx.quadraticCurveTo(-15, -3, -11, 10);
    ctx.lineTo(11, 10); ctx.quadraticCurveTo(15, -3, 0, crouch ? -11 : -15); ctx.closePath();
    ctx.fillStyle = '#245b5c'; ctx.fill(); ctx.strokeStyle = '#8cdbbf'; ctx.lineWidth = 1.5; ctx.stroke();
    circle(0, -5, crouch ? 7 : 8, '#122d38', '#5da68f');
    line(-3, -8, 4, -8, C.mint, 2);
    // The courier's bright scarf is the identifying silhouette.
    ctx.beginPath(); ctx.moveTo(5, 1); ctx.lineTo(17, 8); ctx.lineTo(9, 8); ctx.lineTo(3, 4); ctx.closePath(); ctx.fillStyle = C.mint; ctx.fill();
    rect(-12, 1, 5, 9, '#c49b67'); ctx.restore();
  }
  function drawActors(s) {
    const available = s.intel.filter(c => c.collected).length >= s.level.required;
    const e = s.level.exit;
    rect(e.x, e.y, e.w, e.h, available ? '#255447' : '#283a3e', available ? C.mint : '#60716d');
    for (let y = e.y + 8; y < e.y + e.h - 4; y += 10) line(e.x + 8, y, e.x + e.w - 8, y, '#7cb49b50');
    text('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5, 15, available ? C.mint : '#9aaea5', MONO, 700, 'center');
    for (const chip of s.intel) {
      if (chip.collected) { circle(chip.x, chip.y, 8, null, '#71a99235'); continue; }
      circle(chip.x, chip.y, 19 + Math.sin(s.clock * 3) * 2, '#9de8cf09', '#9de8cf30');
      ctx.save(); ctx.translate(chip.x, chip.y); ctx.rotate(Math.PI / 4);
      rect(-7, -7, 14, 14, C.mint, '#ecfff7'); rect(-3, -3, 6, 6, '#24594e'); ctx.restore();
      for (const d of [-1, 1]) { line(chip.x + d * 11, chip.y - 3, chip.x + d * 15, chip.y - 3, C.mint); line(chip.x + d * 11, chip.y + 3, chip.x + d * 15, chip.y + 3, C.mint); }
    }
    for (const g of s.guards) {
      ctx.save(); ctx.translate(g.x, g.y);
      circle(5, 8, 14, '#070e1780'); ctx.rotate(g.angle + Math.PI / 2);
      line(-5, 4, -6, 13, '#b5aaa0', 4); line(5, 4, 6, 13, '#b5aaa0', 4);
      ctx.fillStyle = '#b39b7e'; ctx.beginPath(); ctx.ellipse(0, 1, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      rect(-10, -2, 20, 5, '#dfc6a2'); circle(0, -7, 7, '#54616b', '#e3d1af');
      line(-5, -11, 5, -11, '#f0dcad', 3); line(9, 0, 12, -10, '#f3ddac', 3); ctx.restore();
      if (g.meter > .02) {
        ctx.beginPath(); ctx.arc(g.x, g.y - 28, 11, -Math.PI / 2, Math.PI * 2 * g.meter - Math.PI / 2);
        ctx.strokeStyle = g.mode === 'alert' ? C.red : C.gold; ctx.lineWidth = 3; ctx.stroke();
      }
      if (g.mode === 'alert') text('!', g.x, g.y - 22, 21, C.red, FONT, 700, 'center');
      else if (['suspicious', 'search'].includes(g.mode)) text('?', g.x, g.y - 22, 17, C.gold, FONT, 700, 'center');
    }
    const p = s.player;
    ctx.save(); if (p.invulnerable > 0 && Math.floor(s.clock * 7) % 2) ctx.globalAlpha = .6;
    courier(p.x, p.y, p.angle, p.crouch, 1, s.clock, p.moving); ctx.restore();
    if (s.screen === 'play') {
      const env = exposure(s);
      circle(p.x, p.y, p.crouch ? 22 : 19, null, env.shadow ? '#a9f4d160' : env.lit ? '#efcd8660' : '#819ba050');
      if (p.crouch) text(env.shadow ? 'HIDDEN' : 'SNEAK', p.x, p.y + 35, 10, env.shadow ? C.mint : C.muted, MONO, 400, 'center');
      const chip = s.intel.find(c => !c.collected && distance(p, c) < 42);
      if (chip) pill('SPACE · LIFT INTEL', Math.min(1060, Math.max(45, p.x - 84)), p.y - 57);
    }
    for (const n of s.ripples) {
      const t = n.age / n.duration; ctx.save(); ctx.globalAlpha = (1 - t) * .55;
      circle(n.x, n.y, n.radius * t, null, C.gold); ctx.restore();
    }
    for (const pebble of s.projectiles) {
      const t = pebble.age / pebble.duration;
      const x = pebble.from.x + (pebble.to.x - pebble.from.x) * t;
      const y = pebble.from.y + (pebble.to.y - pebble.from.y) * t;
      circle(x, y, 3, '#788a8b'); circle(x, y - Math.sin(t * Math.PI) * 48, 3, '#f3d5ac');
    }
  }
  function hud(s) {
    rect(0, 0, 1280, 105, '#0b1722'); line(24, 104, 1256, 104, '#526c644f');
    text('NIGHTSHADE / COURIER', 27, 26, 11, C.mint, MONO, 700);
    text(s.level.name, 26, 58, 24, C.text, FONT, 700);
    text(s.level.district, 27, 83, 10, C.muted, MONO);
    const alert = s.guards.some(g => g.mode === 'alert');
    const suspicious = s.guards.some(g => g.meter > .12 || ['suspicious', 'search'].includes(g.mode));
    const metrics = [
      ['INTEL', `${s.intel.filter(c => c.collected).length} / ${s.intel.length}`, 405, C.mint],
      ['STATUS', alert ? 'ALERT' : suspicious ? 'SEARCHING' : 'UNSEEN', 548, alert ? C.red : suspicious ? C.gold : C.mint],
      ['ELAPSED', formatTime(s.time), 751, C.text], ['SPOTTED', String(s.spotted).padStart(2, '0'), 884, C.text],
      ['SCORE', String(s.score).padStart(5, '0'), 1018, C.gold],
    ];
    for (const [label, value, x, color] of metrics) { line(x - 19, 24, x - 19, 77, '#243942'); text(label, x, 30, 10, C.muted, MONO); text(value, x, 59, 23, color, MONO, 700); }
    text('LIVES', 405, 88, 10, C.muted, MONO);
    for (let i = 0; i < 3; i++) circle(459 + i * 14, 84, 4, i < s.lives ? C.mint : '#30454d');
    text('PEBBLES', 548, 88, 10, C.muted, MONO);
    for (let i = 0; i < s.level.pebbles; i++) circle(617 + i * 13, 84, 3, i < s.pebbles ? C.gold : '#30454d');
    text('SHIFT  sneak    SPACE  lift    CLICK  distract', 751, 88, 10, C.muted, MONO);
    rect(BUTTONS.sound.x, BUTTONS.sound.y, BUTTONS.sound.w, BUTTONS.sound.h, '#172b35', '#38504f');
    text(s.muted ? 'OFF' : 'SND', 1227, 44, 11, s.muted ? C.muted : C.mint, MONO, 400, 'center');
    rect(0, 681, 1280, 39, '#0b1722'); line(24, 681, 1256, 681, '#526c644f');
    const hint = s.messageTime > 0 ? s.message : 'Shadow slows detection. Cover breaks sight. Collect all intel for a perfect route.';
    text('↳', 27, 705, 17, C.mint); text(hint, 52, 705, 12, C.muted, FONT);
    text('P  PAUSE   R  RETRY', 1254, 705, 10, C.muted, MONO, 400, 'right');
    if (s.time < 5 && s.screen === 'play') pill(s.level.district + '  /  ' + s.level.name.toUpperCase(), 60, 148);
  }
  function title(s) {
    const shade = ctx.createLinearGradient(0, 0, 1120, 0);
    shade.addColorStop(0, '#08121cfc'); shade.addColorStop(.55, '#08121cf2'); shade.addColorStop(1, '#08121c20');
    rect(0, 0, 1280, 720, shade);
    text('AN ORIGINAL STEALTH GAME', 100, 132, 12, C.gold, MONO, 700);
    line(100, 155, 155, 155, C.gold, 2);
    text('NIGHTSHADE', 95, 241, 68, C.text, FONT, 700);
    text('COURIER', 95, 317, 78, C.mint, FONT, 700);
    text('The city watches. Find the quiet way through.', 100, 367, 19, '#c2d5d0');
    text('Three compounds. Twelve secrets. One last delivery.', 100, 396, 15, C.muted);
    const rows = [['WASD / ↑↓←→', 'Move through the compound'], ['SHIFT / C', 'Sneak into shadow; stay out of the light'], ['SPACE / CLICK', 'Lift intel / throw a pebble to distract']];
    rows.forEach(([key, label], i) => { text(key, 100, 439 + i * 27, 12, C.mint, MONO, 700); text(label, 260, 439 + i * 27, 13, C.muted); });
    button('START THE DELIVERY', BUTTONS.title, 'ENTER or SPACE to begin');
    // A canvas-drawn dispatch emblem gives the title its own cover illustration.
    ctx.save(); ctx.translate(928, 359);
    circle(0, 0, 152, '#0d252dc0', '#73a28b45'); circle(0, 0, 137, null, '#73a28b22');
    for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16; line(Math.cos(a) * 143, Math.sin(a) * 143, Math.cos(a) * 149, Math.sin(a) * 149, '#91bc9f50'); }
    ctx.rotate(-.12); courier(0, 7, -.45, false, 6.5); ctx.restore();
    pill('DISPATCH 001 — AFTER HOURS', 789, 556, C.gold);
    text('A route is only perfect if nobody knows you took it.', 100, 664, 12, C.muted, MONO);
    text('100% CANVAS / SYNTH SOUND', 1182, 664, 10, '#7b9a92', MONO, 400, 'right');
  }
  function summary(s) {
    rect(0, 0, 1280, 720, '#050d18cc');
    const x = 300, y = 138, w = 680;
    ctx.save(); ctx.shadowColor = '#000b'; ctx.shadowBlur = 50;
    rect(x, y, w, 492, '#101f2c'); ctx.restore();
    rect(x, y, 5, 492, s.screen === 'over' ? C.red : C.mint);
    line(x + 34, 314, x + w - 34, 314, '#36504e');
    const isClear = s.screen === 'clear', over = s.screen === 'over';
    text(s.paused ? 'TAKE A BREATH' : isClear ? 'DELIVERY CHECKPOINT' : over ? 'THE CITY CAUGHT UP' : 'ALL COMPOUNDS CLEARED', x + 38, 178, 11, over ? C.red : C.gold, MONO, 700);
    text(s.paused ? 'In the shadows.' : isClear ? 'Level clear.' : over ? 'Route compromised.' : 'Secrets delivered.', x + 36, 237, 43, C.text, FONT, 700);
    text(s.paused ? 'Your route will be here when you return.' : isClear ? s.level.name + ' / intel transmitted' : over ? 'Every quiet route starts with another attempt.' : 'You left with the truth. The city never saw it leave.', x + 38, 278, 15, C.muted);
    if (s.paused) {
      text('WASD / arrows  move       SHIFT / C  sneak', x + 45, 367, 14, C.mint, MONO);
      text('SPACE  lift intel         CLICK  throw pebble', x + 45, 405, 14, C.mint, MONO);
      text('R  restart this level     P  resume', x + 45, 443, 14, C.muted, MONO);
    } else {
      const r = s.records[s.records.length - 1];
      const total = s.records.reduce((a, v) => ({ time: a.time + v.time, intel: a.intel + v.intel, spotted: a.spotted + v.spotted }), { time: 0, intel: 0, spotted: 0 });
      if (over) { total.time += s.time; total.spotted += s.spotted; total.intel += s.intel.filter(c => c.collected).length; }
      const cells = isClear ? [['TIME', formatTime(r.time)], ['SPOTTED', r.spotted], ['INTEL', `${r.intel} / ${r.total}`]] : [['TOTAL TIME', formatTime(total.time)], ['TIMES SPOTTED', total.spotted], ['INTEL', `${total.intel} / 12`]];
      cells.forEach(([label, value], i) => { const cx = x + 40 + i * 210; text(label, cx, 347, 10, C.muted, MONO); text(value, cx, 386, 30, C.mint, MONO, 700); });
      if (isClear) {
        text(`TIME +${r.timeBonus}   STEALTH +${r.stealthBonus}   PERFECT +${r.perfectBonus}`, x + 40, 425, 12, C.muted, MONO);
        text(r.missingCost ? `MISSED INTEL −${r.missingCost}  /  NET BONUS +${r.bonus}` : `CHECKPOINT BONUS  +${r.bonus}`, x + 40, 453, 12, C.gold, MONO);
      } else {
        text('FINAL SCORE', x + 40, 429, 10, C.muted, MONO);
        text(String(s.score).padStart(5, '0'), x + 38, 477, 42, C.gold, MONO, 700);
        text('PERSONAL BEST  ' + Math.max(s.best, s.score), x + 322, 466, 13, C.muted, MONO);
      }
    }
    button(s.paused ? 'RESUME ROUTE' : isClear ? s.levelIndex === 2 ? 'FINISH DELIVERY' : 'NEXT COMPOUND' : 'PLAY AGAIN', BUTTONS.panel, s.paused ? 'P or ENTER to resume' : 'ENTER or SPACE to continue');
  }
  function draw(s) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); rect(0, 0, canvas.width, canvas.height, C.background);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.clip();
    drawFloor(s);
    for (const g of s.guards) cone(s, g);
    drawCover(s); drawActors(s); hud(s);
    if (s.catchFlash > 0) rect(0, 106, 1280, 575, `rgba(255,80,70,${s.catchFlash * .22})`);
    if (s.screen === 'title') title(s);
    else if (s.screen !== 'play' || s.paused) summary(s);
    ctx.restore();
  }
  function toLogical(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    return { x: ((clientX - bounds.left) * view.ratio - view.x) / view.scale, y: ((clientY - bounds.top) * view.ratio - view.y) / view.scale };
  }
  resize();
  return { draw, resize, toLogical };
}
