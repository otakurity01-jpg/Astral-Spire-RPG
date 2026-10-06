/* Astral Spire RPG - Master Edition with Procedural Audio, 3-Hit Combos, Dash i-Frames, Minimap Radar & Forge Relics. MIT License. */
(function () {
'use strict';

/* ================= Basics ================= */
const W = 800, H = 450;
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const int = (v, def, lo, hi) => { v = Math.floor(Number(v)); if (!isFinite(v)) v = def; return clamp(v, lo, hi); };
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ================= Data ================= */
const ELEM = {
  Fire:  { color: '#ff5a3c', cls: 'Pyromancer Vanguard',  hp: 100, sta: 50, atk: 14, spd: 105, perk: 'Hits hardest' },
  Earth: { color: '#9bc04a', cls: 'Geomancer Guardian',   hp: 140, sta: 45, atk: 11, spd: 90,  perk: 'Takes 25% less damage' },
  Air:   { color: '#3ee0d0', cls: 'Aeromancer Rogue',     hp: 90,  sta: 70, atk: 10, spd: 125, perk: 'Fastest, regains stamina quickly' },
  Water: { color: '#4a9bff', cls: 'Hydromancer Healer',   hp: 105, sta: 60, atk: 9,  spd: 100, perk: 'Heals 4 HP per kill' }
};
const GUILDS = [
  ['Aries', 'Fire', 'Vanguards of the opening charge. Strike first, strike hard.'],
  ['Taurus', 'Earth', 'The unyielding wall of the Spire. Nothing moves them.'],
  ['Gemini', 'Air', 'Twin-blade rogues who are never where you aimed.'],
  ['Cancer', 'Water', 'Tactical healers who shield the whole party.'],
  ['Leo', 'Fire', 'Proud flame-lords who lead from the front.'],
  ['Virgo', 'Earth', 'Precise tinkerers who read every circuit.'],
  ['Libra', 'Air', 'Balanced duelists who turn force against itself.'],
  ['Scorpio', 'Water', 'Patient hunters riding a venomous tide.'],
  ['Sagittarius', 'Fire', 'Far-sighted archers of burning starlight.'],
  ['Capricorn', 'Earth', 'Mountain-climbers who outlast every floor.'],
  ['Aquarius', 'Air', 'Storm-callers who rewrite the wind.'],
  ['Pisces', 'Water', 'Dreamers who swim the Spire\'s data-streams.']
];
const OUTFITS = ['#d94a3d', '#6b8f3a', '#2fd0c0', '#4a8cff', '#c85bd6', '#e8c23a'];
const OUTFIT_N = ['Crimson', 'Olive', 'Teal', 'Azure', 'Violet', 'Gold'];
const HAIRS = ['#2b1d14', '#e8e0d0', '#d94a8c', '#3a6df0', '#f0c040', '#8a8a98'];
const HAIR_N = ['Black', 'Silver', 'Pink', 'Blue', 'Blonde', 'Ash'];
const BIOMES = [
  { name: 'Overgrown Cybernetic Ruins', bg: '#0e1a15', t1: '#13241c', t2: '#102019', wall: '#2f5a3c', acc: '#5dff9a', extra: 0 },
  { name: 'Volcanic Subterranean Forge', bg: '#1b0c09', t1: '#271310', t2: '#200f0c', wall: '#6b2a1a', acc: '#ff8a3a', extra: 3 },
  { name: 'Zero-Gravity Labyrinth',      bg: '#0b0a1d', t1: '#13112b', t2: '#0f0d24', wall: '#3b2f7a', acc: '#b69cff', extra: 7 }
];

/* ================= Audio & Procedural Music Engine ================= */
let ac = null;
function getAudioContext() {
  if (!ac) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) ac = new AudioContext();
  }
  if (ac && ac.state === 'suspended') ac.resume();
  return ac;
}

const AudioSys = {
  sfxOn: true,
  musicOn: true,
  masterVol: 0.25,
  currentTrack: null,
  step: 0,
  stepTimer: 0,
  bpm: 110,
  gainMaster: null,
  gainMusic: null,
  gainSfx: null,

  init() {
    const ctx = getAudioContext();
    if (!ctx || this.gainMaster) return;
    this.gainMaster = ctx.createGain();
    this.gainMaster.gain.value = this.masterVol;
    this.gainMaster.connect(ctx.destination);

    this.gainMusic = ctx.createGain();
    this.gainMusic.gain.value = this.musicOn ? 0.35 : 0;
    this.gainMusic.connect(this.gainMaster);

    this.gainSfx = ctx.createGain();
    this.gainSfx.gain.value = this.sfxOn ? 0.9 : 0;
    this.gainSfx.connect(this.gainMaster);
  },

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.gainMusic) this.gainMusic.gain.value = this.musicOn ? 0.35 : 0;
    toast(this.musicOn ? 'Music: ON' : 'Music: MUTED');
  },

  toggleSfx() {
    this.sfxOn = !this.sfxOn;
    if (this.gainSfx) this.gainSfx.gain.value = this.sfxOn ? 0.9 : 0;
    toast(this.sfxOn ? 'SFX: ON' : 'SFX: MUTED');
  },

  setTrack(name) {
    if (this.currentTrack === name) return;
    this.currentTrack = name;
    this.step = 0;
    this.stepTimer = 0;
    if (name === 'hub') this.bpm = 84;
    else if (name === 'floor') this.bpm = 114;
    else if (name === 'boss') this.bpm = 138;
  },

  beep(f, d, type = 'square', v = 0.04) {
    if (!this.sfxOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.init();
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, ctx.currentTime);
      g.gain.setValueAtTime(v, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (d || 0.08));
      o.connect(g);
      g.connect(this.gainSfx || ctx.destination);
      o.start();
      o.stop(ctx.currentTime + (d || 0.08));
    } catch (e) {}
  },

  playSlash(combo = 0) {
    if (!this.sfxOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.init();
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      const baseF = [380, 480, 220][combo % 3];
      o.frequency.setValueAtTime(baseF, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.connect(g);
      g.connect(this.gainSfx || ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  },

  playHit(isCrit = false) {
    if (!this.sfxOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.init();
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = isCrit ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(isCrit ? 520 : 160, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(isCrit ? 120 : 40, ctx.currentTime + 0.16);
      g.gain.setValueAtTime(isCrit ? 0.22 : 0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      o.connect(g);
      g.connect(this.gainSfx || ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.16);
      if (isCrit) setTimeout(() => this.beep(880, 0.15, 'triangle', 0.08), 30);
    } catch (e) {}
  },

  playDash() {
    if (!this.sfxOn) return;
    this.beep(220, 0.12, 'sawtooth', 0.08);
  },

  update(dt) {
    if (!this.musicOn || !this.currentTrack) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.init();

    const secPerStep = 60 / this.bpm / 4;
    this.stepTimer += dt;
    if (this.stepTimer >= secPerStep) {
      this.stepTimer -= secPerStep;
      this.playMusicStep(this.step % 16, this.currentTrack);
      this.step++;
    }
  },

  playMusicStep(step, track) {
    const ctx = getAudioContext();
    if (!ctx || !this.gainMusic) return;

    const hubBass = [130.81, 0, 130.81, 0, 116.54, 0, 116.54, 0, 98.00, 0, 98.00, 0, 103.83, 0, 116.54, 0];
    const hubArp =  [261.63, 311.13, 392.00, 466.16, 523.25, 466.16, 392.00, 311.13, 233.08, 293.66, 349.23, 466.16, 392.00, 349.23, 293.66, 233.08];

    const floorBass = [73.42, 73.42, 0, 77.78, 73.42, 0, 87.31, 0, 73.42, 73.42, 0, 98.00, 77.78, 0, 65.41, 0];
    const floorArp  = [293.66, 0, 311.13, 349.23, 0, 440.00, 392.00, 349.23, 293.66, 311.13, 0, 392.00, 349.23, 311.13, 293.66, 0];

    const bossBass = [87.31, 87.31, 103.83, 87.31, 116.54, 87.31, 130.81, 87.31, 98.00, 98.00, 116.54, 98.00, 130.81, 116.54, 103.83, 87.31];
    const bossLead = [349.23, 0, 392.00, 415.30, 0, 523.25, 466.16, 0, 523.25, 587.33, 0, 466.16, 415.30, 392.00, 349.23, 311.13];

    let bFreq = 0, aFreq = 0;
    if (track === 'hub') { bFreq = hubBass[step]; aFreq = hubArp[step]; }
    else if (track === 'floor') { bFreq = floorBass[step]; aFreq = floorArp[step]; }
    else if (track === 'boss') { bFreq = bossBass[step]; aFreq = bossLead[step]; }

    const t = ctx.currentTime;
    if (bFreq > 0) {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = track === 'boss' ? 'sawtooth' : 'triangle';
        o.frequency.setValueAtTime(bFreq, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g);
        g.connect(this.gainMusic);
        o.start(t);
        o.stop(t + 0.18);
      } catch (e) {}
    }

    if (aFreq > 0) {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = track === 'hub' ? 'sine' : 'sawtooth';
        o.frequency.setValueAtTime(aFreq, t);
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.14);
        o.connect(g);
        g.connect(this.gainMusic);
        o.start(t);
        o.stop(t + 0.14);
      } catch (e) {}
    }

    if ((track === 'boss' || track === 'floor') && (step % 4 === 2)) {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(30, t + 0.06);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o.connect(g);
        g.connect(this.gainMusic);
        o.start(t);
        o.stop(t + 0.06);
      } catch (e) {}
    }
  }
};

function beep(f, d, type, v) { AudioSys.beep(f, d, type, v); }

let toastS = '', toastT = 0;
function toast(s) { toastS = s; toastT = 2.4; }

function haptic(ms = 15) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

/* ================= Input (keyboard + touch) ================= */
const Input = (function () {
  const keys = {}, joy = { x: 0, y: 0 }, tb = { j: false, k: false, l: false, p: false, dash: false };
  let cur = {}, prev = {}, pend = null;
  const KM = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyJ: 'j', Enter: 'j',
    KeyK: 'k', Backspace: 'k',
    KeyL: 'l',
    Space: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyC: 'dash',
    Escape: 'p', KeyP: 'p',
    KeyM: 'music'
  };
  window.addEventListener('keydown', e => {
    getAudioContext();
    const a = KM[e.code];
    if (a) {
      keys[a] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    const a = KM[e.code];
    if (a) {
      keys[a] = false;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    }
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const api = {
    joy, tb, tap: null, cur: {},
    update() {
      prev = cur;
      cur = {
        up: !!keys.up || joy.y < -0.55, down: !!keys.down || joy.y > 0.55,
        left: !!keys.left || joy.x < -0.55, right: !!keys.right || joy.x > 0.55,
        j: !!keys.j || tb.j, k: !!keys.k || tb.k, l: !!keys.l || tb.l,
        dash: !!keys.dash || tb.dash, p: !!keys.p || tb.p, music: !!keys.music
      };
      api.cur = cur; api.tap = pend; pend = null;
      if (this.just('music')) {
        AudioSys.toggleMusic();
      }
    },
    just(n) { return !!cur[n] && !prev[n]; },
    move() {
      let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (!x && !y && Math.hypot(joy.x, joy.y) > 0.2) { x = joy.x; y = joy.y; }
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      return { x, y };
    },
    reset() { for (const k in keys) keys[k] = false; },
    setTap(x, y) { pend = { x, y }; }
  };
  return api;
})();

function setTouch(on) { document.body.classList.toggle('touch', on); }
(function bindTouch() {
  const isTouch = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window;
  setTouch(isTouch);
  window.addEventListener('touchstart', () => setTouch(true), { once: true, passive: true });

  const joy = $('joy'), knob = $('knob'); let jid = null;
  function setJ(e) {
    const r = joy.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    Input.joy.x = dx; Input.joy.y = dy; knob.style.transform = 'translate(' + dx * 38 + 'px,' + dy * 38 + 'px)';
  }
  joy.addEventListener('pointerdown', e => { jid = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (x) {} setJ(e); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === jid) setJ(e); });
  const endJ = e => { if (e.pointerId === jid) { jid = null; Input.joy.x = Input.joy.y = 0; knob.style.transform = ''; } };
  joy.addEventListener('pointerup', endJ); joy.addEventListener('pointercancel', endJ);

  function btn(id, key) {
    const el = $(id);
    const on = e => { Input.tb[key] = true; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); };
    const off = () => { Input.tb[key] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  }
  btn('bJ', 'j'); btn('bK', 'k'); btn('bL', 'l'); btn('bD', 'dash'); btn('bP', 'p');

  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect();
    Input.setTap((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
    e.preventDefault();
  });
  // Fullscreen + landscape on first touch (best effort; unsupported on some browsers)
  window.addEventListener('pointerdown', function once(e) {
    if (e.pointerType !== 'touch') return;
    window.removeEventListener('pointerdown', once);
    try {
      const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
    } catch (x) {}
  });
  document.addEventListener('contextmenu', e => e.preventDefault());
})();

/* ================= Drawing helpers ================= */
function T(s, x, y, size, col, al, bold) {
  ctx.font = (bold === false ? '' : 'bold ') + (size || 14) + 'px "Courier New",monospace';
  ctx.textAlign = al || 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
}
function wrap(s, maxW, size) {
  ctx.font = 'bold ' + size + 'px "Courier New",monospace';
  const words = String(s).split(' '), lines = []; let l = '';
  for (const w of words) { const t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; }
  if (l) lines.push(l); return lines;
}
function panel(x, y, w, h, col) {
  ctx.fillStyle = 'rgba(6,10,24,.9)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = col || '#7ec8ff'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}
function bar(x, y, w, h, v, max, col) {
  ctx.fillStyle = '#10131f'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, w * clamp(v / max, 0, 1)), h);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
}
function drawChar(x, y, o, t, sc) {
  sc = sc || 1; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(sc, sc);
  const mv = o.moving, b = mv ? Math.round(Math.sin(t * 14)) : 0, up = o.fy < -0.5;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-7, -2, 14, 4);
  ctx.fillStyle = '#20222c'; ctx.fillRect(-4, -5, 3, 5 + (mv ? b : 0) * -1); ctx.fillRect(1, -5, 3, 5 + (mv ? b : 0));
  ctx.fillStyle = o.outfit; ctx.fillRect(-5, -14 + b, 10, 10);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-5, -9 + b, 10, 1);
  ctx.fillStyle = o.elc; ctx.fillRect(-1, -14 + b, 2, 3);
  ctx.fillStyle = '#f2c9a0'; ctx.fillRect(-4, -21 + b, 8, 7);
  ctx.fillStyle = o.hair; ctx.fillRect(-5, -23 + b, 10, 4); ctx.fillRect(-5, -21 + b, 2, 5); ctx.fillRect(3, -21 + b, 2, 5);
  if (up) ctx.fillRect(-4, -19 + b, 8, 4);
  else { ctx.fillStyle = '#111'; ctx.fillRect(-2, -18 + b, 1, 2); ctx.fillRect(1, -18 + b, 1, 2); }
  const sx = o.fx >= 0 ? 7 : -8;
  ctx.fillStyle = '#b8bcc8'; ctx.fillRect(sx, -22, 2, 21);
  ctx.fillStyle = o.elc; ctx.fillRect(sx - 2, -27, 6, 6);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(sx - 1, -26, 2, 2);
  ctx.restore();
}

/* ================= Save system (3 slots + import/export) ================= */
const Save = {
  key: n => 'astralSpire.slot' + n,
  read(n) { try { const r = localStorage.getItem(Save.key(n)); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
  write(n, d) { try { d.lastSaved = new Date().toISOString(); localStorage.setItem(Save.key(n), JSON.stringify(d)); return true; } catch (e) { return false; } },
  has() { return [1, 2, 3].some(n => !!Save.read(n)); }
};
function normSave(d) {
  const g = GUILDS.find(x => x[0] === d.guild) || GUILDS[0];
  const inv = d.inv || {}, bo = d.bounty || {}, fl = d.flags || {}, up = d.upgrades || {};
  return {
    v: 2, name: String(d.name || 'Climber').slice(0, 12), guild: g[0], element: g[1],
    outfit: int(d.outfit, 0, 0, 5), hair: int(d.hair, 0, 0, 5),
    floor: int(d.floor, 1, 1, 100), loc: d.loc === 'floor' ? 'floor' : 'hub',
    lvl: int(d.lvl, 1, 1, 99), xp: int(d.xp, 0, 0, 1e9), hp: Math.max(1, Number(d.hp) || 1), sta: Math.max(0, Number(d.sta) || 0),
    inv: { shards: int(inv.shards, 0, 0, 1e9), bones: int(inv.bones, 0, 0, 1e9), circuits: int(inv.circuits, 0, 0, 1e9), potions: int(inv.potions, 0, 0, 99) },
    upgrades: { weapon: int(up.weapon, 0, 0, 20), armor: int(up.armor, 0, 0, 20), stamina: int(up.stamina, 0, 0, 20) },
    relics: Array.isArray(d.relics) ? d.relics.slice() : [],
    kills: int(d.kills, 0, 0, 1e9), best: int(d.best, 1, 1, 100),
    bounty: { need: int(bo.need, 5, 1, 999), have: int(bo.have, 0, 0, 999), done: int(bo.done, 0, 0, 999) },
    flags: { yuna: !!fl.yuna, yuri: !!fl.yuri, yumi: !!fl.yumi, yuki: !!fl.yuki },
    lastSaved: d.lastSaved || ''
  };
}
function sx(p) {
  const e = ELEM[p.element], L = p.lvl - 1;
  const up = p.upgrades || { weapon: 0, armor: 0, stamina: 0 };
  const relics = p.relics || [];
  let atkBonus = up.weapon * 3;
  let hpBonus = up.armor * 20;
  let staBonus = up.stamina * 15;
  let spdBonus = 0;
  if (relics.includes('Aries Spark Core')) atkBonus += 4;
  if (relics.includes('Taurus Bastion Plating')) hpBonus += 35;
  if (relics.includes('Gemini Slipstream Prism')) spdBonus += 18;
  return { maxHp: e.hp + L * 12 + hpBonus, maxSta: e.sta + L * 3 + staBonus, atk: e.atk + L * 2 + atkBonus, spd: e.spd + spdBonus };
}
const G = { slot: 1, p: null };
function autosave() { if (G.p && Save.write(G.slot, G.p)) toast('Game saved (slot ' + G.slot + ')'); else if (G.p) toast('Could not save (storage blocked)'); }
function exportSave(n) {
  const d = Save.read(n); if (!d) return;
  const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b);
  a.download = 'astral-spire-' + String(d.name || 'save').replace(/\W+/g, '_') + '-slot' + n + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Save exported');
}
function loadSlot(n) {
  const d = Save.read(n); if (!d) { toast('Empty slot'); return; }
  G.slot = n; G.p = normSave(d);
  const st = sx(G.p); G.p.hp = clamp(Math.max(G.p.hp, st.maxHp * 0.5), 1, st.maxHp); G.p.sta = st.maxSta;
  go(World, G.p.loc === 'floor' ? 'floor' : 'hub');
}

/* ================= Menu helper ================= */
function Menu(items, x, y, w, h) {
  const m = { items, idx: 0, x, y, w, h: h || 34 };
  m.idx = Math.max(0, items.findIndex(i => !i.enabled || i.enabled()));
  return m;
}
const lbl = (it, k) => typeof it[k] === 'function' ? it[k]() : it[k];
function menuStep(m) {
  const n = m.items.length, en = i => !m.items[i].enabled || m.items[i].enabled();
  if (Input.just('up')) { for (let c = 0; c < n; c++) { m.idx = (m.idx + n - 1) % n; if (en(m.idx)) break; } beep(520, .04); }
  if (Input.just('down')) { for (let c = 0; c < n; c++) { m.idx = (m.idx + 1) % n; if (en(m.idx)) break; } beep(520, .04); }
  if (Input.tap) {
    for (let i = 0; i < n; i++) {
      const ry = m.y + i * (m.h + 6);
      if (Input.tap.x >= m.x && Input.tap.x <= m.x + m.w && Input.tap.y >= ry && Input.tap.y <= ry + m.h && en(i)) {
        m.idx = i; Input.tap = null; beep(760, .06); m.items[i].fn(); return;
      }
    }
  }
  if (Input.just('j') && en(m.idx)) { beep(760, .06); m.items[m.idx].fn(); }
}
function menuDraw(m) {
  for (let i = 0; i < m.items.length; i++) {
    const it = m.items[i], ry = m.y + i * (m.h + 6), on = !it.enabled || it.enabled(), sel = i === m.idx;
    ctx.fillStyle = sel ? 'rgba(80,150,255,.35)' : 'rgba(10,16,34,.85)'; ctx.fillRect(m.x, ry, m.w, m.h);
    ctx.strokeStyle = sel ? '#bfe0ff' : '#3a4a78'; ctx.lineWidth = 2; ctx.strokeRect(m.x + 1, ry + 1, m.w - 2, m.h - 2);
    const sub = it.sub ? lbl(it, 'sub') : null;
    T(lbl(it, 'label'), m.x + 14, ry + (sub ? 7 : (m.h - 15) / 2), 15, on ? '#fff' : '#68708a');
    if (sub) T(sub, m.x + 14, ry + 29, 12, on ? '#9fc0ff' : '#58607a', 'left', false);
  }
}

/* ================= Scene manager ================= */
let scene = null;
function go(s, a) { scene = s; Input.reset(); if (s.enter) s.enter(a); }

/* ================= Dialogue ================= */
const Dlg = {
  active: false, lines: [], i: 0, ch: 0, name: '', col: '#fff', done: null,
  say(name, col, lines, done) { this.active = true; this.name = name; this.col = col; this.lines = lines; this.i = 0; this.ch = 0; this.done = done || null; },
  update(dt) {
    const L = this.lines[this.i]; this.ch += dt * 55;
    const adv = Input.just('j') || Input.tap;
    if (adv) {
      if (this.ch < L.length) this.ch = L.length;
      else { this.i++; this.ch = 0; beep(600, .04); if (this.i >= this.lines.length) this.close(); }
    }
    if (Input.just('k')) this.close();
  },
  close() { this.active = false; const d = this.done; this.done = null; if (d) d(); },
  draw() {
    const L = this.lines[this.i]; panel(20, H - 138, W - 40, 118, this.col);
    ctx.fillStyle = this.col; ctx.fillRect(34, H - 152, 20 + this.name.length * 10, 24);
    T(this.name, 44, H - 148, 15, '#06080f');
    const shown = L.slice(0, Math.floor(this.ch)), lines = wrap(L, W - 90, 15), maxc = Math.floor(this.ch); let c = 0;
    for (let i = 0; i < lines.length; i++) { const seg = lines[i].slice(0, Math.max(0, maxc - c)); c += lines[i].length + 1; T(seg, 40, H - 118 + i * 21, 15, '#eaf2ff'); }
    if (this.ch >= L.length && Math.floor(performance.now() / 400) % 2) T('J >', W - 60, H - 40, 14, this.col);
    void shown;
  }
};

/* ================= Title ================= */
const Title = {
  enter() {
    this.t = 0; this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H, s: rnd(.3, 1.2), z: Math.random() < .2 ? 2 : 1 });
    this.m = Menu([
      { label: 'New Game', fn: () => go(Slots, { mode: 'new' }) },
      { label: 'Continue', enabled: () => Save.has(), fn: () => go(Slots, { mode: 'load' }) },
      { label: 'Export Save (file)', enabled: () => Save.has(), fn: () => go(Slots, { mode: 'export' }) },
      { label: 'Import Save (file)', fn: () => $('imp').click() },
      { label: () => 'Touch Controls: ' + (document.body.classList.contains('touch') ? 'ON' : 'OFF'), fn: () => setTouch(!document.body.classList.contains('touch')) },
      { label: 'Toggle Fullscreen', fn: () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} } }
    ], 560, 150, 210, 34);
    this.m.h = 34;
  },
  update(dt) {
    this.t += dt; for (const s of this.stars) { s.y += s.s * 6 * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    menuStep(this.m);
  },
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04050c'); g.addColorStop(1, '#14183a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const s of this.stars) { ctx.fillStyle = 'rgba(200,220,255,' + (.4 + .4 * Math.sin(this.t * 2 + s.x)) + ')'; ctx.fillRect(s.x, s.y, s.z, s.z); }
    // shattered sky arc
    ctx.strokeStyle = 'rgba(120,180,255,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(120, 90); ctx.lineTo(210, 40); ctx.lineTo(330, 110); ctx.lineTo(430, 60); ctx.stroke();
    // the Spire
    ctx.fillStyle = '#0b0e1e'; ctx.beginPath(); ctx.moveTo(250, H); ctx.lineTo(290, 20); ctx.lineTo(310, 20); ctx.lineTo(350, H); ctx.fill();
    ctx.fillStyle = '#1c2344'; ctx.fillRect(296, 0, 8, H);
    for (let i = 0; i < 26; i++) { const wy = 40 + i * 15; ctx.fillStyle = (i + Math.floor(this.t * 1.5)) % 5 === 0 ? '#ffb85a' : '#2fb6ff'; ctx.fillRect(284 + ((i * 7) % 30), wy, 3, 3); }
    ctx.fillStyle = 'rgba(70,140,255,.12)'; ctx.fillRect(0, H - 40, W, 40);
    T('ASTRAL', 40, 70, 54, '#e8f3ff'); T('SPIRE', 40, 122, 54, '#7ec8ff');
    T('Climb to Floor 100. Rewrite the stars.', 44, 190, 14, '#a9c4ee');
    T('Twelve Zodiac Guilds. One tower. No way down.', 44, 212, 12, '#7f98c8', 'left', false);
    T('Keyboard: WASD/Arrows move  J act/sprint  K attack  L skill  Esc pause', 44, H - 52, 11, '#6f86b4', 'left', false);
    T('Touch: joystick + J / K / L buttons.  3 save slots.', 44, H - 36, 11, '#6f86b4', 'left', false);
    menuDraw(this.m);
  }
};

/* ================= Save slots ================= */
const Slots = {
  enter(a) {
    this.mode = a.mode; this.pending = a.data || null; this.armed = 0;
    const self = this, items = [];
    for (let n = 1; n <= 3; n++) {
      items.push({
        label: () => 'Slot ' + n, sub: () => { const d = Save.read(n); return d ? d.name + ' - ' + d.guild + ' (' + d.element + ') - Floor ' + d.floor + ' - Lv ' + d.lvl : 'Empty'; },
        enabled: () => (self.mode === 'load' || self.mode === 'export') ? !!Save.read(n) : true,
        fn: () => self.pick(n)
      });
    }
    items.push({ label: 'Back', fn: () => go(Title) });
    this.m = Menu(items, 150, 120, 500, 52);
  },
  pick(n) {
    if (this.mode === 'load') loadSlot(n);
    else if (this.mode === 'export') exportSave(n);
    else if (this.mode === 'import') {
      if (Save.read(n) && this.armed !== n) { this.armed = n; toast('Slot used. Choose again to overwrite.'); return; }
      Save.write(n, this.pending); toast('Save imported to slot ' + n); go(Title);
    } else {
      if (Save.read(n) && this.armed !== n) { this.armed = n; toast('Slot used. Choose again to overwrite.'); return; }
      G.slot = n; go(Create);
    }
  },
  update() { if (Input.just('k')) { go(Title); return; } menuStep(this.m); },
  draw() {
    ctx.fillStyle = '#080b1a'; ctx.fillRect(0, 0, W, H);
    const t = { load: 'Continue: pick a save', 'new': 'New game: pick a slot', 'export': 'Export: pick a save', 'import': 'Import: pick a slot' }[this.mode];
    T(t, W / 2, 50, 24, '#cfe6ff', 'center'); T('K / Back to return', W / 2, 84, 12, '#7f98c8', 'center', false);
    menuDraw(this.m);
  }
};

/* ================= Character creation ================= */
const Create = {
  enter() { this.s = { name: 'Climber', g: 0, o: 0, h: 0 }; this.row = 0; this.t = 0; },
  ask() {
    const v = window.prompt('Name your climber (max 12 characters):', this.s.name);
    Input.reset(); if (v !== null && v.trim()) this.s.name = v.trim().slice(0, 12);
  },
  change(d) {
    const s = this.s;
    if (this.row === 1) s.g = (s.g + d + 12) % 12; else if (this.row === 2) s.o = (s.o + d + 6) % 6; else if (this.row === 3) s.h = (s.h + d + 6) % 6; else return;
    beep(560, .04);
  },
  begin() {
    const s = this.s, g = GUILDS[s.g], e = ELEM[g[1]];
    G.p = normSave({ name: s.name, guild: g[0], outfit: s.o, hair: s.h, floor: 1, loc: 'hub', lvl: 1, hp: e.hp, sta: e.sta, inv: { shards: 20, potions: 2 } });
    G.p.hp = e.hp; G.p.sta = e.sta; Save.write(G.slot, G.p); go(Intro);
  },
  act() { if (this.row === 0) this.ask(); else if (this.row === 4) this.begin(); else this.change(1); },
  update(dt) {
    this.t += dt;
    if (Input.just('up')) this.row = (this.row + 4) % 5;
    if (Input.just('down')) this.row = (this.row + 1) % 5;
    const d = (Input.just('right') ? 1 : 0) - (Input.just('left') ? 1 : 0); if (d) this.change(d);
    if (Input.just('j')) this.act();
    if (Input.just('k')) { go(Slots, { mode: 'new' }); return; }
    if (Input.tap) {
      for (let i = 0; i < 5; i++) {
        const y = 92 + i * 52;
        if (Input.tap.x > 20 && Input.tap.x < 470 && Input.tap.y > y && Input.tap.y < y + 44) {
          this.row = i;
          if (i >= 1 && i <= 3) { if (Input.tap.x < 270) this.change(-1); else this.change(1); } else this.act();
          break;
        }
      }
    }
  },
  draw() {
    const s = this.s, g = GUILDS[s.g], e = ELEM[g[1]];
    ctx.fillStyle = '#080b1a'; ctx.fillRect(0, 0, W, H);
    T('Create your climber', 24, 24, 26, '#cfe6ff');
    T('Up/Down: row   Left/Right: change   J: select   K: back', 24, 62, 11, '#7f98c8', 'left', false);
    const rows = [['Name', s.name], ['Guild', g[0]], ['Outfit', OUTFIT_N[s.o]], ['Hair', HAIR_N[s.h]], ['', 'Begin the climb']];
    for (let i = 0; i < 5; i++) {
      const y = 92 + i * 52, sel = this.row === i;
      ctx.fillStyle = sel ? 'rgba(80,150,255,.32)' : 'rgba(10,16,34,.85)'; ctx.fillRect(20, y, 450, 44);
      ctx.strokeStyle = sel ? '#bfe0ff' : '#3a4a78'; ctx.lineWidth = 2; ctx.strokeRect(21, y + 1, 448, 42);
      if (i < 4) T(rows[i][0], 36, y + 14, 15, '#9fc0ff');
      if (i === 0) T(rows[i][1] + '  (tap to rename)', 130, y + 14, 15, '#fff');
      else if (i < 4) { T('<', 258, y + 12, 18, '#fff'); T(rows[i][1], 360, y + 14, 15, '#fff', 'center'); T('>', 440, y + 12, 18, '#fff'); }
      else T(rows[i][1], 245, y + 13, 18, sel ? '#fff' : '#bfe0ff', 'center');
    }
    // preview panel
    panel(490, 24, 290, 416, e.color);
    drawChar(635, 190, { outfit: OUTFITS[s.o], hair: HAIRS[s.h], elc: e.color, fx: 1, fy: 1, moving: true }, this.t, 5);
    T(g[0] + ' Guild', 635, 218, 20, e.color, 'center');
    T(g[1] + ' | ' + e.cls, 635, 244, 12, '#cfe6ff', 'center');
    const ds = wrap(g[2], 250, 12); ds.forEach((l, i) => T(l, 635, 266 + i * 15, 12, '#a9c4ee', 'center', false));
    T('HP ' + e.hp + '   STA ' + e.sta, 635, 316, 12, '#cfe6ff', 'center');
    T('ATK ' + e.atk + '   SPD ' + e.spd, 635, 334, 12, '#cfe6ff', 'center');
    wrap('Perk: ' + e.perk, 250, 12).forEach((l, i) => T(l, 635, 358 + i * 16, 12, '#ffe08a', 'center', false));
    const sk = SKILLS[g[0]]; T('Skill [L]: ' + sk.name, 635, 394, 13, '#7dffb0', 'center');
    wrap(sk.desc + ' (cd ' + sk.cd + 's)', 250, 11).forEach((l, i) => T(l, 635, 412 + i * 13, 11, '#a9c4ee', 'center', false));
  }
};

/* ================= Intro story ================= */
const Intro = {
  pages: [
    'The sky above the ruined metropolis shattered centuries ago, and from the wound rose the Astral Spire: a towering monolith of dark steel, shifting biomes and forgotten technology.',
    'Humanity did not just survive in its shadow. They drew elemental power from the constellations and formed the twelve Zodiac Guilds.',
    'The Spire is no natural dungeon. It is a vast, automated testing facility left by an unknown creator. Whoever conquers Floor 100 may claim an artifact able to rewrite the stars.',
    'You stand before the blast doors of Floor 1. Four elite climbers wait nearby: Yuna the Pyromancer, Yuri the Geomancer, Yumi the Aeromancer and Yuki the Hydromancer.',
    'The doors grind open and cold, ancient air spills out. The climb has begun.'
  ],
  enter() { this.i = 0; this.ch = 0; },
  update(dt) {
    this.ch += dt * 50; const L = this.pages[this.i].length;
    if (Input.just('j') || Input.tap) { if (this.ch < L) this.ch = L; else { this.i++; this.ch = 0; if (this.i >= this.pages.length) { go(World, 'hub'); return; } } }
    if (Input.just('k')) go(World, 'hub');
  },
  draw() {
    ctx.fillStyle = '#04050c'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(180,210,255,.5)'; ctx.fillRect((i * 97) % W, (i * 53) % H, 1, 1); }
    const txt = this.pages[this.i].slice(0, Math.floor(this.ch));
    wrap(this.pages[this.i], 640, 19).forEach((l, i, a) => { let c = 0; for (let k = 0; k < i; k++) c += a[k].length + 1; T(l.slice(0, Math.max(0, Math.floor(this.ch) - c)), 80, 120 + i * 30, 19, '#dbe9ff'); });
    void txt;
    T('J: continue    K: skip', W / 2, H - 40, 12, '#6f86b4', 'center', false);
  }
};

/* ================= World (hub + floors) ================= */
/* ================= Guild skills (press L) ================= */
const SKILLS = {
  Aries:       { name: 'Ram Charge',    cost: 20, cd: 7,  desc: 'Dash forward, smashing foes in your path.', run: (w, p, pl, st) => w.dash(150, st.atk * 1.6) },
  Taurus:      { name: 'Stone Guard',   cost: 20, cd: 12, desc: 'Block all damage for 2.5 seconds.', run: (w, p, pl) => { pl.shieldT = 2.5 * w.dur; w.ring(pl.x, pl.y - 8, 44, '#9bc04a'); } },
  Gemini:      { name: 'Twin Blades',   cost: 18, cd: 6,  desc: 'Throw two piercing blades.', run: (w, p, pl, st) => { const a = Math.atan2(pl.fy, pl.fx); [-0.22, 0.22].forEach(o => w.shoot(a + o, { spd: 380, life: .7, dmg: st.atk * 1.3, r: 6, pierce: true, col: '#3ee0d0' })); } },
  Cancer:      { name: 'Tidal Mend',    cost: 25, cd: 12, desc: 'Heal 40% of your max HP.', run: (w, p, pl, st) => w.heal(st.maxHp * 0.4 * w.dur) },
  Leo:         { name: 'Solar Roar',    cost: 25, cd: 9,  desc: 'Blast scorching nearby foes away.', run: (w, p, pl, st) => w.aoe(105, st.atk * 2.2, 260, '#ffb347') },
  Virgo:       { name: 'Circuit Hack',  cost: 20, cd: 10, desc: 'Stun nearby foes for 2.5 seconds.', run: (w) => w.aoe(170, 0, 0, '#b6e36b', { stun: 2.5 * w.dur }) },
  Libra:       { name: 'Equilibrium',   cost: 15, cd: 10, desc: 'Shockwave that refills your stamina.', run: (w, p, pl, st) => { w.aoe(110, st.atk * 1.3, 160, '#e8d9ff'); p.sta = st.maxSta; } },
  Scorpio:     { name: 'Venom Sting',   cost: 18, cd: 7,  desc: 'Poison bolt: damage over time.', run: (w, p, pl, st) => w.shoot(Math.atan2(pl.fy, pl.fx), { spd: 340, life: .8, dmg: st.atk * 1.0, r: 7, poison: true, col: '#b06bff' }) },
  Sagittarius: { name: 'Star Arrow',    cost: 22, cd: 6,  desc: 'A long, fast arrow that pierces.', run: (w, p, pl, st) => w.shoot(Math.atan2(pl.fy, pl.fx), { spd: 650, life: 1.1, dmg: st.atk * 2.6, r: 5, pierce: true, col: '#ffe08a' }) },
  Capricorn:   { name: 'Summit Stride', cost: 10, cd: 14, desc: 'Refill stamina and move 35% faster for 6s.', run: (w, p, pl, st) => { p.sta = st.maxSta; pl.hasteT = 6 * w.dur; pl.hasteM = 1.35; w.ring(pl.x, pl.y - 8, 36, '#9bc04a'); } },
  Aquarius:    { name: 'Gale Burst',    cost: 20, cd: 8,  desc: 'A gust that hurls foes away and slows them.', run: (w, p, pl, st) => w.aoe(140, st.atk * 1.0, 520, '#aee8ff', { slow: 3 * w.dur }) },
  Pisces:      { name: 'Dream Current',cost: 20, cd: 13, desc: 'Regenerate 10 HP/s for 4s and move 20% faster.', run: (w, p, pl) => { pl.regenT = 4 * w.dur; pl.regenR = 10; pl.hasteT = 4 * w.dur; pl.hasteM = 1.2; w.ring(pl.x, pl.y - 8, 40, '#4a9bff'); } }
};

/* ================= Ultimates (hold L, unlocked at Lv 8) ================= */
const ULT_LVL = 8, ULT_COST = 35, ULT_CD = 30;
const rankOf = p => p.lvl >= 12 ? 3 : p.lvl >= 6 ? 2 : 1;
const ULTS = {
  Aries:       { name: 'Inferno Rampage',  desc: 'A long, blazing charge that tramples everything.', run: (w, p, pl, st) => w.dash(280, st.atk * 3) },
  Taurus:      { name: 'Mountain Fortress', desc: 'Shield for 5s and stun nearby foes.', run: (w, p, pl, st) => { pl.shieldT = 5; w.aoe(130, 0, 0, '#9bc04a', { stun: 2 }); } },
  Gemini:      { name: 'Blade Storm',       desc: 'Eight piercing blades in every direction.', run: (w, p, pl, st) => { for (let i = 0; i < 8; i++) w.shoot(i * Math.PI / 4, { spd: 360, life: .8, dmg: st.atk * 1.3, r: 6, pierce: true, col: '#3ee0d0' }); } },
  Cancer:      { name: 'Tsunami Blessing',  desc: 'Heal 70% max HP and regenerate for 6s.', run: (w, p, pl, st) => { w.heal(st.maxHp * 0.7); pl.regenT = 6; pl.regenR = 6; } },
  Leo:         { name: 'Supernova',         desc: 'A huge explosion that engulfs the area.', run: (w, p, pl, st) => w.aoe(200, st.atk * 5, 420, '#ffb347') },
  Virgo:       { name: 'System Crash',      desc: 'Every foe on the floor is damaged and stunned 3s.', run: (w, p, pl, st) => w.aoe(5000, st.atk * 1.2, 0, '#b6e36b', { stun: 3 }) },
  Libra:       { name: 'Cosmic Balance',    desc: 'Big shockwave, heal 30% HP, refill stamina.', run: (w, p, pl, st) => { w.aoe(170, st.atk * 2.5, 220, '#e8d9ff'); w.heal(st.maxHp * 0.3); p.sta = st.maxSta; } },
  Scorpio:     { name: 'Plague Swarm',      desc: 'Poison every foe within range for 6s.', run: (w, p, pl, st) => w.aoe(320, st.atk * 1.5, 80, '#b06bff', { poison: 6 }) },
  Sagittarius: { name: 'Starfall Volley',   desc: 'A fan of five piercing star arrows.', run: (w, p, pl, st) => { const a = Math.atan2(pl.fy, pl.fx); for (let i = -2; i <= 2; i++) w.shoot(a + i * 0.16, { spd: 650, life: 1.1, dmg: st.atk * 2.4, r: 5, pierce: true, col: '#ffe08a' }); } },
  Capricorn:   { name: 'Peak Ascent',       desc: 'Shield 3s, +50% speed 8s, heal 25%, refill stamina.', run: (w, p, pl, st) => { pl.shieldT = 3; pl.hasteT = 8; pl.hasteM = 1.5; p.sta = st.maxSta; w.heal(st.maxHp * 0.25); } },
  Aquarius:    { name: 'Tempest',           desc: 'A storm that blasts and slows all nearby foes.', run: (w, p, pl, st) => w.aoe(230, st.atk * 2.5, 700, '#aee8ff', { slow: 4 }) },
  Pisces:      { name: 'Ocean Dream',       desc: 'Regen 14 HP/s for 6s, +35% speed, stun foes.', run: (w, p, pl, st) => { pl.regenT = 6; pl.regenR = 14; pl.hasteT = 6; pl.hasteM = 1.35; w.aoe(140, 0, 0, '#4a9bff', { stun: 2 }); } }
};

/* ================= Bosses ================= */
const BOSSES = [
  { name: 'Sentinel Prime', col: '#ff4a4a', pool: ['volley', 'charge', 'summon'] },
  { name: 'Forge Colossus', col: '#ff8a3a', pool: ['slam', 'rain', 'ring'] },
  { name: 'Void Warden',    col: '#b06bff', pool: ['blink', 'ring', 'volley'] },
  { name: 'Storm Sentinel', col: '#3ee0d0', pool: ['charge', 'volley', 'blink'] }
];
const ARCHITECT = { name: 'The Architect', col: '#ffe08a', pool: ['volley', 'ring', 'charge', 'slam', 'rain', 'summon', 'blink'] };
const bossCfg = f => f === 100 ? ARCHITECT : BOSSES[(f / 5 - 1) % 4];
const aimAt = (w, e) => Math.atan2(w.pl.y - 6 - e.y, w.pl.x - e.x);
const PATTERNS = {
  volley: { tele: .55, rec: .6, track: true,
    begin: (w, e) => { e.aim = aimAt(w, e); },
    fire: (w, e) => {
      const shot = () => { const a = aimAt(w, e), n = 3 + 2 * (e.phase - 1);
        for (let i = 0; i < n; i++) w.ebullet(e.x, e.y, a + (i - (n - 1) / 2) * .2, 220 + 30 * e.phase, e.dmg * .55, e.col); beep(300, .1, 'square', .04); };
      shot(); if (e.phase >= 3) e.q.push({ t: .35, fn: shot });
    } },
  ring: { tele: .7, rec: .8,
    begin: (w) => {},
    fire: (w, e) => {
      const ring = (off) => { const n = 12 + 4 * (e.phase - 1); for (let i = 0; i < n; i++) w.ebullet(e.x, e.y, off + i * 6.283 / n, 170, e.dmg * .5, e.col); w.ring(e.x, e.y, 60, e.col); beep(220, .15, 'sawtooth', .04); };
      const o = rnd(0, 1); ring(o); if (e.phase >= 2) e.q.push({ t: .45, fn: () => ring(o + .26) });
    } },
  charge: { tele: .9, rec: .9, track: true,
    begin: (w, e) => { e.aim = aimAt(w, e); },
    fire: (w, e) => { const v = 480 + 40 * e.phase; e.dvx = Math.cos(e.aim) * v; e.dvy = Math.sin(e.aim) * v; beep(120, .4, 'sawtooth', .06); } },
  slam: { tele: 1.05, rec: .7,
    begin: (w, e) => { w.zone(w.pl.x, w.pl.y, 70 + 10 * e.phase, 1.0, e.dmg * 1.3, e.col, 8); },
    fire: () => {} },
  rain: { tele: .3, rec: 1.6,
    begin: (w, e) => {
      const n = 5 + e.phase * 2; w.zone(w.pl.x, w.pl.y, 42, .8, e.dmg * .9, e.col, 0);
      for (let i = 1; i < n; i++) { const a = rnd(0, 6.283), r = rnd(40, 230); w.zone(clamp(w.pl.x + Math.cos(a) * r, 40, w.W - 40), clamp(w.pl.y + Math.sin(a) * r, 40, w.H - 40), 42, .8 + i * .16, e.dmg * .9, e.col, 0); }
    },
    fire: () => {} },
  summon: { tele: .8, rec: 1,
    begin: (w, e) => { w.ring(e.x, e.y, 70, '#b06bff'); },
    fire: (w, e) => { if (w.enemies.length < 9) for (let i = 0; i < 2; i++) w.mkEnemy('drone', e.x + (i ? 40 : -40), e.y + 24); beep(260, .2, 'triangle', .05); } },
  blink: { tele: .45, rec: .5,
    begin: () => {},
    fire: (w, e) => {
      for (let t = 0; t < 14; t++) {
        const a = rnd(0, 6.283), x = w.pl.x + Math.cos(a) * 150, y = w.pl.y + Math.sin(a) * 150;
        if (x < 30 || y < 30 || x > w.W - 30 || y > w.H - 30 || w.walls.some(r => x > r.x - 22 && x < r.x + r.w + 22 && y > r.y - 22 && y < r.y + r.h + 22)) continue;
        w.burst(e.x, e.y, e.col, 12); e.x = x; e.y = y; w.burst(x, y, e.col, 12); break;
      }
      PATTERNS.volley.fire(w, e);
    } }
};

const CLIMBERS = {
  yuna: { name: 'Yuna', title: 'Pyromancer', el: 'Fire', outfit: '#e0382d', hair: '#ff7a2a', x: 250, y: 215,
    lines: ['Hah! Another fresh face at the blast doors? Don\'t flinch. The Spire can smell hesitation.',
      'Fire Guilds break things first and ask questions never. Keep up if you can.'] },
  yuri: { name: 'Yuri', title: 'Geomancer', el: 'Earth', outfit: '#6b7d33', hair: '#4a3a24', x: 370, y: 215,
    lines: ['...You are still standing. Good. Most people sprint until their stamina is gone.',
      'Hold the line, watch the gauge, and let the enemy come to you.'] },
  yumi: { name: 'Yumi', title: 'Aeromancer', el: 'Air', outfit: '#17b8a8', hair: '#e8f6ff', x: 590, y: 215,
    lines: ['Ooh, a newbie! Bet you three shards you can\'t reach Floor 5 before I get bored.',
      'Tip: hold J to sprint, and press L for your guild skill. Mind your stamina.'] },
  yuki: { name: 'Yuki', title: 'Hydromancer', el: 'Water', outfit: '#3f86e0', hair: '#9ad0ff', x: 710, y: 215,
    lines: ['Welcome. You look tired already. Rest here: hubs are the only safe ground.',
      'Every hub heals you fully. Please don\'t push past your limits.'] }
};
const World = {
  enter(mode) {
    const p = G.p, st = sx(p);
    Object.assign(this, { mode, t: 0, walls: [], ints: [], enemies: [], fx: [], texts: [], menu: null, paused: false, pm: null, cleared: false, banner: 0, shake: 0, atkId: 0 });
    this.pl = { x: 0, y: 0, w: 12, h: 10, fx: 0, fy: 1, atkT: 0, atkCd: 0, combo: 0, comboT: 0, inv: 0, regenD: 0, moving: false, kx: 0, ky: 0, kbT: 0, skCd: 0, shieldT: 0, hasteT: 0, hasteM: 1, regenT: 0, regenR: 0, dashT: 0, dvx: 0, dvy: 0, dashId: 0, dashCd: 0, ultCd: 0, lHold: 0, lFired: false };
    this.proj = []; this.rings = []; this.eb = []; this.zones = [];
    const pl = this.pl, self = this;
    if (mode === 'hub') {
      AudioSys.setTrack('hub');
      this.W = 960; this.H = 540; this.bio = null;
      p.hp = st.maxHp; p.sta = st.maxSta; p.loc = 'hub'; pl.x = 480; pl.y = 480;
      this.walls.push({ x: 430, y: 10, w: 100, h: 50 }, { x: 95, y: 250, w: 100, h: 36 }, { x: 770, y: 250, w: 90, h: 36 },
        { x: 300, y: 360, w: 30, h: 30 }, { x: 630, y: 360, w: 30, h: 30 });
      this.ints.push({ x: 480, y: 82, r: 46, label: 'Enter Floor ' + p.floor, fn: () => self.enterFloor() });
      for (const k in CLIMBERS) { const c = CLIMBERS[k]; this.ints.push({ x: c.x, y: c.y + 4, r: 34, label: 'Talk to ' + c.name, fn: () => self.talk(k) }); }
      this.ints.push({ x: 145, y: 312, r: 42, label: 'Merchant', fn: () => self.openShop() });
      this.ints.push({ x: 815, y: 312, r: 42, label: 'Bounty board', fn: () => self.board() });
      this.banner = 3; this.bannerText = (p.floor > 1 ? 'Checkpoint Hub' : 'Entrance Hub') + ' - Floor ' + p.floor + ' ahead';
      autosave();
      if (p.floor === 1 && !p.flags.yuna && !p.flags.yuri && !p.flags.yumi && !p.flags.yuki)
        Dlg.say('Narrator', '#7ec8ff', ['The sanctuary hums with neon. Talk to the four elite climbers, then step through the blast door at the top.', 'Controls: move with WASD / joystick, J to interact (hold to sprint), K to attack, L for your guild skill.']);
    } else {
      const f = p.floor, bi = Math.floor((f - 1) / 5) % 3, bio = BIOMES[bi]; this.bio = bio;
      this.W = 1400; this.H = 900; p.loc = 'floor';
      AudioSys.setTrack(isBoss ? 'boss' : 'floor');
      pl.x = 90; pl.y = this.H - 90; p.hp = Math.min(p.hp, st.maxHp); p.sta = st.maxSta;
      this.stairs = { x: this.W - 130, y: 40, w: 70, h: 50 };
      const rng = mulberry(f * 7919 + 13), nW = 10 + bio.extra;
      for (let a = 0, n = 0; n < nW && a < 200; a++) {
        const w = 40 + rng() * 120, h = 40 + rng() * 120, x = rng() * (this.W - w), y = rng() * (this.H - h);
        if (x < 280 && y > this.H - 280) continue; if (x + w > this.W - 280 && y < 220) continue;
        this.walls.push({ x, y, w, h }); n++;
      }
      const isBoss = f % 5 === 0, count = 4 + Math.min(8, Math.floor(f / 2)) + (bi ? 1 : 0) - (isBoss ? 2 : 0);
      const spawn = (type) => {
        for (let t = 0; t < 80; t++) {
          const x = 100 + Math.random() * (this.W - 200), y = 100 + Math.random() * (this.H - 200);
          if (Math.hypot(x - pl.x, y - pl.y) < 320) continue;
          if (this.walls.some(r => x > r.x - 24 && x < r.x + r.w + 24 && y > r.y - 24 && y < r.y + r.h + 24)) continue;
          if (x > this.stairs.x - 80 && y < 160) continue;
          const boss = type === 'boss', an = type === 'anomaly';
          this.enemies.push({
            type, x, y, w: boss ? 28 : 16, h: boss ? 28 : 16,
            hp: boss ? (f === 100 ? 2200 : 150 + f * 14) : an ? 30 + f * 3.2 : 18 + f * 2.2, max: 0,
            spd: boss ? 58 : an ? 42 : 58 + Math.min(30, f * .4), dmg: boss ? 16 + f * .5 : an ? 10 + f * .45 : 7 + f * .35,
            xp: boss ? 40 + f * 3 : an ? 9 + f : 6 + f, wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0, ph: Math.random() * 6
          }); const e = this.enemies[this.enemies.length - 1]; e.max = e.hp; if (boss) this.initBoss(e, f); return;
        }
      };
      for (let i = 0; i < count; i++) spawn(i % 3 === 2 ? 'anomaly' : 'drone');
      if (isBoss) spawn('boss');
      this.total = this.enemies.length;
      this.banner = 3; this.bannerText = 'Floor ' + f + ' - ' + bio.name + (isBoss ? ' - ' + bossCfg(f).name : '');
      autosave();
    }
  },
  talk(k) {
    const c = CLIMBERS[k], p = G.p, ec = ELEM[c.el].color, lines = c.lines.slice();
    if (p.element === c.el) lines.push('A fellow ' + c.el + ' wielder! Our power runs on the same stars.');
    if (p.floor > 1) lines.push('You reached Floor ' + p.floor + ' already? Not bad, ' + p.name + '.');
    if (!p.flags[k]) { lines.push('Take this potion. Consider it a temporary alliance.'); }
    Dlg.say(c.name + ' (' + c.title + ')', ec, lines, () => { if (!p.flags[k]) { p.flags[k] = true; p.inv.potions++; toast('+1 Potion from ' + c.name); beep(880, .1); } });
  },
  board() {
    const p = G.p, b = p.bounty;
    if (b.have >= b.need) {
      Dlg.say('Bounty Board', '#ffd36a', ['Bounty complete: ' + b.need + ' security drones destroyed. The brokers pay out 60 shards and 30 XP.'], () => {
        p.inv.shards += 60; this.gainXp(30); b.done++; b.have = 0; b.need = 5 + b.done * 3; autosave();
      });
    } else Dlg.say('Bounty Board', '#ffd36a', ['Guild bounty: destroy ' + b.need + ' security drones in the Spire. Progress: ' + b.have + '/' + b.need + '. Reward: 60 shards + 30 XP.',
      'Loot sells at the merchant: bones 5, circuits 8 shards each.']);
  },
  openShop() {
    const p = G.p, up = p.upgrades, self = this;
    const wCost = 50 + up.weapon * 25, aCost = 60 + up.armor * 30, sCost = 45 + up.stamina * 20;
    this.menu = Menu([
      { label: () => 'Sell Scavenged Loot (+' + (p.inv.bones * 5 + p.inv.circuits * 8) + ' shards)', sub: () => p.inv.bones + ' bones, ' + p.inv.circuits + ' circuits', enabled: () => p.inv.bones + p.inv.circuits > 0,
        fn: () => { const g = p.inv.bones * 5 + p.inv.circuits * 8; p.inv.shards += g; p.inv.bones = p.inv.circuits = 0; toast('Sold for ' + g + ' shards'); autosave(); } },
      { label: 'Buy Potion (30 shards)', sub: () => 'Stock: ' + p.inv.potions + ' / 99 in inventory', enabled: () => p.inv.shards >= 30,
        fn: () => { p.inv.shards -= 30; p.inv.potions++; toast('Potion bought'); autosave(); } },
      { label: () => 'Forge: Weapon Tuning [Lv ' + up.weapon + ' -> ' + (up.weapon + 1) + '] (' + wCost + ' shards)', sub: () => '+3 Attack Damage permanently', enabled: () => p.inv.shards >= wCost,
        fn: () => { p.inv.shards -= wCost; up.weapon++; toast('Weapon Forged! ATK +3'); beep(880, .15, 'triangle', .08); autosave(); } },
      { label: () => 'Forge: Nano-Armor [Lv ' + up.armor + ' -> ' + (up.armor + 1) + '] (' + aCost + ' shards)', sub: () => '+20 Max HP permanently', enabled: () => p.inv.shards >= aCost,
        fn: () => { p.inv.shards -= aCost; up.armor++; toast('Armor Reinforced! Max HP +20'); beep(880, .15, 'triangle', .08); autosave(); } },
      { label: () => 'Forge: Capacitors [Lv ' + up.stamina + ' -> ' + (up.stamina + 1) + '] (' + sCost + ' shards)', sub: () => '+15 Max Stamina permanently', enabled: () => p.inv.shards >= sCost,
        fn: () => { p.inv.shards -= sCost; up.stamina++; toast('Capacitors Upgraded! Max Stamina +15'); beep(880, .15, 'triangle', .08); autosave(); } },
      { label: 'Leave Counter', fn: () => { self.menu = null; } }
    ], 130, 80, 540, 50);
  },
  enterFloor() { this.enter0 = true; go(World, 'floor'); },
  gainXp(n) {
    const p = G.p, l0 = p.lvl, r0 = rankOf(p); p.xp += n;
    while (p.xp >= p.lvl * 35) { p.xp -= p.lvl * 35; p.lvl++; const st = sx(p); p.hp = st.maxHp; p.sta = st.maxSta; }
    if (p.lvl > l0) {
      const m = ['Level up! Lv ' + p.lvl];
      if (rankOf(p) > r0) m.push('Skill rank ' + rankOf(p) + '!');
      if (l0 < ULT_LVL && p.lvl >= ULT_LVL) m.push('Ultimate unlocked: hold L');
      toast(m.join('  ')); beep(1000, .2, 'triangle', .05);
    }
  },
    usePotion() {
    const p = G.p, st = sx(p);
    if (p.inv.potions > 0 && p.hp < st.maxHp) { p.inv.potions--; p.hp = Math.min(st.maxHp, p.hp + 60); toast('+60 HP'); beep(900, .12, 'sine', .05); }
    else toast(p.inv.potions ? 'HP is full' : 'No potions');
  },
  pauseMenu() {
    const self = this;
    return Menu([
      { label: 'Resume', fn: () => { self.paused = false; } },
      { label: () => 'Use Potion (' + G.p.inv.potions + ')', fn: () => self.usePotion() },
      { label: 'Save Game', fn: () => autosave() },
      { label: 'Return to Title', fn: () => { autosave(); go(Title); } }
    ], 280, 140, 240, 38);
  },
  nearest() {
    let best = null, bd = 1e9;
    for (const i of this.ints) { const d = Math.hypot(this.pl.x - i.x, this.pl.y - i.y); if (d < i.r && d < bd) { bd = d; best = i; } }
    return best;
  },
  floatText(x, y, s, c) { this.texts.push({ x, y, s, c, t: 0.9 }); },
  burst(x, y, c, n) { for (let i = 0; i < n; i++) this.fx.push({ x, y, vx: rnd(-70, 70), vy: rnd(-90, 30), t: rnd(.3, .6), c }); },
  advance() {
    const p = G.p, f = p.floor; p.best = Math.max(p.best, f);
    if (f >= 100) { go(Victory); return; }
    p.floor = f + 1; beep(660, .2, 'triangle', .05);
    go(World, f % 5 === 0 ? 'hub' : 'floor');
  },
  hurtEnemy(e, dmg, dx, dy, kb, col, isCrit = false) {
    dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.flash = .12;
    const m = Math.hypot(dx, dy) || 1;
    if (e.type === 'boss') kb = 0;
    if (kb > 0) { e.kbT = .15; e.kx = dx / m * kb; e.ky = dy / m * kb; }
    this.floatText(e.x, e.y - 12, (isCrit ? 'CRIT! ' : '') + dmg, isCrit ? '#fde047' : (col || '#fff'));
    this.burst(e.x, e.y, isCrit ? '#fde047' : (col || '#fff'), isCrit ? 8 : 4);
    AudioSys.playHit(isCrit);
    if (e.hp <= 0 && !e.dead) this.killEnemy(e);
  },
  ring(x, y, r, col) { this.rings.push({ x, y, r, t: .35, max: .35, col }); },
  shoot(a, o) { const pl = this.pl; this.proj.push(Object.assign({ x: pl.x, y: pl.y - 8, vx: Math.cos(a) * o.spd, vy: Math.sin(a) * o.spd, hit: [] }, o)); beep(420, .08, 'triangle', .04); },
  aoe(r, dmg, kb, col, o) {
    const pl = this.pl; o = o || {}; this.ring(pl.x, pl.y - 8, r, col); beep(150, .2, 'sawtooth', .05);
    for (const e of this.enemies.slice()) {
      const dx = e.x - pl.x, dy = e.y - (pl.y - 8);
      if (e.dead || Math.hypot(dx, dy) > r + e.w / 2) continue;
      if (o.stun) { if (e.type === 'boss') this.floatText(e.x, e.y - 20, 'Immune', '#ccc'); else { e.stun = o.stun; e.flash = .15; } }
      if (o.slow && e.type !== 'boss') e.slow = o.slow;
      if (o.poison) { e.poison = o.poison; e.pt = .5; }
      if (dmg > 0) this.hurtEnemy(e, dmg, dx, dy || 1, kb, col);
    }
  },
  heal(n) { const p = G.p, st = sx(p); p.hp = Math.min(st.maxHp, p.hp + n); this.ring(this.pl.x, this.pl.y - 8, 40, '#7dffb0'); this.floatText(this.pl.x, this.pl.y - 30, '+' + Math.round(n) + ' HP', '#7dffb0'); beep(900, .2, 'sine', .05); },
  dash(dist, dmg) { const pl = this.pl; pl.dashT = .18; pl.dvx = pl.fx * dist / .18; pl.dvy = pl.fy * dist / .18; pl.dashId++; pl.dashDmg = dmg; pl.inv = Math.max(pl.inv, .3); pl.dashHit = []; AudioSys.playDash(); haptic(20); },
  dodgeRoll() {
    const p = G.p, pl = this.pl;
    if (p.sta < 12 || pl.dashCd > 0) return;
    p.sta -= 12; pl.dashCd = 0.45; pl.inv = 0.24; pl.dashT = 0.20;
    const speed = 340; pl.dvx = pl.fx * speed; pl.dvy = pl.fy * speed;
    pl.dashDmg = 0; pl.dashHit = []; AudioSys.playDash(); haptic(15);
  },
  castSkill() {
    const p = G.p, pl = this.pl, st = sx(p), sk = SKILLS[p.guild], r = rankOf(p);
    if (pl.skCd > 0) { toast(sk.name + ' recharging (' + Math.ceil(pl.skCd) + 's)'); return; }
    if (p.sta < sk.cost) { toast('Not enough stamina for ' + sk.name); return; }
    this.dur = 1 + 0.25 * (r - 1);
    p.sta -= sk.cost; pl.skCd = sk.cd * (1 - 0.12 * (r - 1)); pl.regenD = .7;
    sk.run(this, p, pl, Object.assign({}, st, { atk: st.atk * (1 + 0.35 * (r - 1)) })); toast(sk.name + '!');
  },
  castUlt() {
    const p = G.p, pl = this.pl, st = sx(p), u = ULTS[p.guild];
    if (pl.ultCd > 0) { toast(u.name + ' recharging (' + Math.ceil(pl.ultCd) + 's)'); return; }
    if (p.sta < ULT_COST) { toast('Need ' + ULT_COST + ' stamina for ' + u.name); return; }
    this.dur = 1; p.sta -= ULT_COST; pl.ultCd = ULT_CD; pl.regenD = 1; this.shake = .25;
    u.run(this, p, pl, st); toast('ULTIMATE: ' + u.name + '!'); beep(90, .4, 'sawtooth', .06);
  },
  initBoss(e, f) {
    const c = bossCfg(f); Object.assign(e, { bname: c.name, col: c.col, pool: c.pool.slice(), state: 'idle', st: 1, phase: 1, pat: null, q: [], active: false, aim: 0, dvx: 0, dvy: 0, aimTrack: false });
  },
  mkEnemy(type, x, y) {
    const f = G.p.floor, an = type === 'anomaly';
    const e = { type, x, y, w: 16, h: 16, hp: an ? 30 + f * 3.2 : 18 + f * 2.2, max: 0, spd: an ? 42 : 58 + Math.min(30, f * .4), dmg: an ? 10 + f * .45 : 7 + f * .35, xp: an ? 9 + f : 6 + f, wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0, ph: Math.random() * 6 };
    e.max = e.hp; this.enemies.push(e); this.total++; this.burst(x, y, '#b06bff', 10); return e;
  },
  ebullet(x, y, a, spd, dmg, col, r) { this.eb.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, col, r: r || 5, life: 4 }); },
  zone(x, y, r, delay, dmg, col, burst) { this.zones.push({ x, y, r, delay, max: delay, dmg, col, burst: burst || 0 }); },
  hurtPlayer(raw, fx, fy) {
    const p = G.p, pl = this.pl; if (pl.inv > 0) return false;
    if (pl.shieldT > 0) { pl.inv = .4; this.floatText(pl.x, pl.y - 30, 'Blocked', '#9bc04a'); beep(500, .08, 'square', .04); return false; }
    const dmg = Math.max(1, Math.round(raw * (p.element === 'Earth' ? .75 : 1)));
    p.hp -= dmg; pl.inv = .9; this.shake = .2; pl.kbT = .15;
    const dx = pl.x - fx, dy = pl.y - fy, d = Math.hypot(dx, dy) || 1; pl.kx = dx / d * 200; pl.ky = dy / d * 200;
    this.floatText(pl.x, pl.y - 28, '-' + dmg, '#ff6a6a'); beep(110, .15, 'sawtooth', .05);
    if (p.hp <= 0) { p.hp = 0; go(Over); return true; }
    return false;
  },
  bossUpdate(e, dt) {
    const pl = this.pl, hpr = e.hp / e.max, ph = hpr < .33 ? 3 : hpr < .66 ? 2 : 1;
    const dx = pl.x - e.x, dy = pl.y - 6 - e.y, d = Math.hypot(dx, dy) || 1;
    if (!e.active) { if (d < 480 || e.hp < e.max) { e.active = true; e.state = 'idle'; e.st = 1.2; toast(e.bname + ' awakens!'); beep(70, .5, 'sawtooth', .07); } else return; }
    if (ph > e.phase) {
      e.phase = ph; e.state = 'idle'; e.st = 1.3; e.dvx = e.dvy = 0; this.ring(e.x, e.y, 170, e.col); this.shake = .4;
      if (ph >= 3 && !e.pool.includes('rain')) e.pool.push('rain');
      toast(e.bname + ' enters phase ' + ph + '!'); beep(80, .5, 'sawtooth', .07);
    }
    e.q = e.q.filter(q => { q.t -= dt; if (q.t <= 0) { q.fn(); return false; } return true; });
    e.st -= dt;
    if (e.state === 'idle') {
      const sp = e.spd * (1 + .15 * (e.phase - 1)); let vx = 0, vy = 0;
      if (d > 160) { vx = dx / d * sp * .7; vy = dy / d * sp * .7; } else if (d < 90) { vx = -dx / d * sp * .5; vy = -dy / d * sp * .5; }
      moveBox(e, vx * dt, 0, this.walls, this.W, this.H); moveBox(e, 0, vy * dt, this.walls, this.W, this.H);
      if (e.st <= 0) {
        let pool = e.pool.filter(k => k !== e.pat); if (!pool.length) pool = e.pool;
        e.pat = pool[Math.floor(Math.random() * pool.length)]; const pt = PATTERNS[e.pat];
        e.state = 'tele'; e.st = pt.tele; e.aimTrack = !!pt.track; pt.begin(this, e); beep(500, .08, 'square', .03);
      }
    } else if (e.state === 'tele') {
      if (e.aimTrack && e.st > .2) e.aim = aimAt(this, e);
      if (e.st <= 0) {
        const pt = PATTERNS[e.pat]; pt.fire(this, e);
        if (e.pat === 'charge') { e.state = 'act'; e.st = .5; } else { e.state = 'rec'; e.st = pt.rec * (e.phase === 3 ? .7 : 1); }
      }
    } else if (e.state === 'act') {
      const ox = e.x, oy = e.y; moveBox(e, e.dvx * dt, 0, this.walls, this.W, this.H); moveBox(e, 0, e.dvy * dt, this.walls, this.W, this.H);
      this.fx.push({ x: e.x, y: e.y, vx: 0, vy: 0, t: .3, c: e.col });
      const moved = Math.hypot(e.x - ox, e.y - oy), want = Math.hypot(e.dvx, e.dvy) * dt;
      if (e.st <= 0 || moved < want * .3) { e.state = 'rec'; e.st = PATTERNS.charge.rec; e.dvx = e.dvy = 0; this.shake = .2; }
    } else if (e.state === 'rec') {
      if (e.st <= 0) { e.state = 'idle'; e.st = [1.5, 1.0, .6][e.phase - 1]; }
    }
  },
  killEnemy(e) {
    const p = G.p, st = sx(p), boss = e.type === 'boss', an = e.type === 'anomaly'; e.dead = true;
    if (boss) {
      this.eb = []; this.zones = []; e.q = []; p.inv.potions += 2; this.shake = .5; this.ring(e.x, e.y, 220, e.col);
      const RELIC_POOL = ['Aries Spark Core', 'Taurus Bastion Plating', 'Gemini Slipstream Prism', 'Cancer Tide Talisman', 'Leo Solar Crest', 'Virgo Logic Chip'];
      const relicAward = RELIC_POOL[Math.floor(p.floor / 5 - 1) % RELIC_POOL.length];
      if (!p.relics.includes(relicAward)) { p.relics.push(relicAward); toast('RELIC CLAIMED: ' + relicAward + '!'); }
      else toast(e.bname + ' Defeated! +2 Potions');
      AudioSys.setTrack('floor');
    }
    const sh = boss ? 60 : an ? Math.round(rnd(5, 9)) : Math.round(rnd(3, 6));
    p.inv.shards += sh; p.kills++; this.floatText(e.x, e.y - 14, '+' + sh + ' shards', '#ffd36a');
    if (Math.random() < (boss ? 1 : .45)) { const n = boss ? 3 : 1; p.inv.bones += n; this.floatText(e.x, e.y - 28, '+' + n + ' bone', '#e9e2cc'); }
    if (Math.random() < (boss ? 1 : .3)) { const n = boss ? 3 : 1; p.inv.circuits += n; this.floatText(e.x, e.y - 42, '+' + n + ' circuit', '#7ee8ff'); }
    if (e.type === 'drone') p.bounty.have = Math.min(p.bounty.need, p.bounty.have + 1);
    if (p.element === 'Water') p.hp = Math.min(st.maxHp, p.hp + 4);
    this.gainXp(e.xp); this.burst(e.x, e.y, an ? '#4a9bff' : '#ff5a4a', 14); beep(160, .15, 'sawtooth', .04);
    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (!this.enemies.length) { this.cleared = true; toast('Floor cleared! Stairs unlocked.'); beep(784, .25, 'triangle', .05); }
  },
  update(dt) {
    this.t += dt; toastT -= dt; this.banner -= dt; this.shake -= dt; AudioSys.update(dt);
    if (Dlg.active) { Dlg.update(dt); return; }
    if (this.menu) { if (Input.just('k')) this.menu = null; else menuStep(this.menu); return; }
    if (this.paused) { if (Input.just('p') || Input.just('k')) { this.paused = false; return; } menuStep(this.pm); return; }
    if (Input.just('p')) { this.paused = true; this.pm = this.pauseMenu(); return; }

    const p = G.p, st = sx(p), pl = this.pl, W2 = this.W, H2 = this.H;
    const mv = Input.move(), near = this.nearest(), mm = Math.hypot(mv.x, mv.y);
    pl.moving = mm > 0.05;
    if (pl.moving) { pl.fx = mv.x / mm; pl.fy = mv.y / mm; }
    const sprint = Input.cur.j && !near && pl.moving && p.sta > 0;
    pl.skCd -= dt; pl.ultCd -= dt; pl.shieldT -= dt; pl.hasteT -= dt; pl.regenT -= dt; pl.dashT -= dt; pl.dashCd -= dt; pl.comboT -= dt; if (pl.comboT <= 0) pl.combo = 0;
    if (pl.regenT > 0) p.hp = Math.min(st.maxHp, p.hp + pl.regenR * dt);
    const speed = st.spd * (sprint ? 1.6 : 1) * (pl.atkT > 0 ? .6 : 1) * (pl.hasteT > 0 ? pl.hasteM : 1);
    if (sprint) { p.sta = Math.max(0, p.sta - 20 * dt); pl.regenD = .5; }
    else { pl.regenD -= dt; if (pl.regenD <= 0) p.sta = Math.min(st.maxSta, p.sta + (p.element === 'Air' ? 20 : 12) * dt); }
    pl.inv -= dt; pl.atkT -= dt; pl.atkCd -= dt;
    let kx = 0, ky = 0; if (pl.kbT > 0) { pl.kbT -= dt; kx = pl.kx; ky = pl.ky; }
    if (pl.dashT > 0) {
      moveBox(pl, pl.dvx * dt, 0, this.walls, W2, H2); moveBox(pl, 0, pl.dvy * dt, this.walls, W2, H2);
      this.fx.push({ x: pl.x, y: pl.y - 8, vx: 0, vy: 0, t: .25, c: ELEM[p.element].color });
      for (const e of this.enemies.slice()) if (!e.dead && !pl.dashHit.includes(e) && Math.abs(e.x - pl.x) < 18 + e.w / 2 && Math.abs(e.y - pl.y) < 18 + e.h / 2) { pl.dashHit.push(e); this.hurtEnemy(e, pl.dashDmg, pl.fx, pl.fy, 300, ELEM[p.element].color); }
    } else {
      moveBox(pl, (mv.x * speed + kx) * dt, 0, this.walls, W2, H2); moveBox(pl, 0, (mv.y * speed + ky) * dt, this.walls, W2, H2);
    }

    if (near && Input.just('j')) { beep(700, .05); near.fn(); return; }
    if (p.lvl < ULT_LVL) { if (Input.just('l')) this.castSkill(); pl.lHold = 0; }
    else if (Input.cur.l) { pl.lHold += dt; if (pl.lHold >= .45 && !pl.lFired) { pl.lFired = true; this.castUlt(); } }
    else { if (pl.lHold > 0 && !pl.lFired) this.castSkill(); pl.lHold = 0; pl.lFired = false; }
    if (Input.just('dash')) this.dodgeRoll();
    if (Input.just('k') && pl.atkCd <= 0 && p.sta >= 8) {
      p.sta -= 8; pl.atkT = .18; pl.atkCd = pl.combo === 2 ? .38 : .28; pl.regenD = .7; this.atkId++;
      AudioSys.playSlash(pl.combo); haptic(15);
      if (pl.combo === 2) {
        const a = Math.atan2(pl.fy, pl.fx);
        this.shoot(a, { spd: 380, life: .45, dmg: st.atk * 1.2, r: 8, pierce: true, col: ELEM[p.element].color });
      }
      pl.combo = (pl.combo + 1) % 3; pl.comboT = 0.65;
    }

    // attack hitbox
    if (pl.atkT > 0) {
      const hx = pl.x + pl.fx * 22, hy = pl.y - 6 + pl.fy * 22;
      for (const e of this.enemies.slice()) {
        if (e.dead || e.last === this.atkId) continue;
        if (Math.abs(e.x - hx) < 20 + e.w / 2 && Math.abs(e.y - hy) < 20 + e.h / 2) {
          e.last = this.atkId;
          const critChance = (p.element === 'Air' ? 0.20 : 0.12) + (p.relics.includes('Gemini Slipstream Prism') ? 0.10 : 0);
          const isCrit = Math.random() < critChance;
          const comboMult = [1.0, 1.25, 1.8][(pl.combo + 2) % 3];
          const dmg = st.atk * rnd(.9, 1.25) * comboMult * (isCrit ? 1.75 : 1.0);
          this.hurtEnemy(e, dmg, pl.fx, pl.fy, pl.combo === 0 ? 260 : 180, ELEM[p.element].color, isCrit);
        }
      }
    }
    // enemies
    for (const e of this.enemies.slice()) {
      if (e.dead) continue;
      e.flash -= dt;
      if (e.poison > 0) { e.poison -= dt; e.pt -= dt; if (e.pt <= 0) { e.pt = .5; this.hurtEnemy(e, st.atk * .35, 0, 1, 0, '#b06bff'); if (e.dead) continue; } }
      if (e.stun > 0) { e.stun -= dt; continue; }
      const dx = pl.x - e.x, dy = (pl.y - 6) - e.y, d = Math.hypot(dx, dy) || 1; let vx, vy;
      if (e.type === 'boss') this.bossUpdate(e, dt);
      else {
        const sm = e.slow > 0 ? (e.slow -= dt, .5) : 1;
        if (d < 260) { vx = dx / d * e.spd * sm; vy = dy / d * e.spd * sm; }
        else { e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1, 2.5); const a = Math.random() * 6.28; e.dx = Math.cos(a) * e.spd * .4; e.dy = Math.sin(a) * e.spd * .4; } vx = e.dx; vy = e.dy; }
        if (e.kbT > 0) { e.kbT -= dt; vx = e.kx; vy = e.ky; }
        moveBox(e, vx * dt, 0, this.walls, W2, H2); moveBox(e, 0, vy * dt, this.walls, W2, H2);
      }
      if (pl.inv <= 0 && Math.abs(pl.x - e.x) < (e.w + pl.w) / 2 + 2 && Math.abs(pl.y - 6 - e.y) < (e.h + pl.h) / 2 + 6) {
        if (this.hurtPlayer(e.dmg * (e.state === 'act' ? 1.4 : 1), e.x, e.y)) return;
      }
    }
    // enemy bullets and hazard zones
    for (const b of this.eb) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.x < 0 || b.y < 0 || b.x > W2 || b.y > H2 || this.walls.some(r => b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h)) b.life = 0;
      if (b.life > 0 && Math.hypot(b.x - pl.x, b.y - (pl.y - 8)) < b.r + 7) { b.life = 0; if (this.hurtPlayer(b.dmg, b.x, b.y)) return; }
    }
    this.eb = this.eb.filter(b => b.life > 0);
    for (const z of this.zones) {
      z.delay -= dt;
      if (z.delay <= 0) {
        this.ring(z.x, z.y, z.r, z.col); this.burst(z.x, z.y, z.col, 10); this.shake = Math.max(this.shake, .12); beep(100, .2, 'sawtooth', .05);
        if (Math.hypot(pl.x - z.x, pl.y - 8 - z.y) < z.r + 6 && this.hurtPlayer(z.dmg, z.x, z.y)) return;
        for (let i = 0; i < z.burst; i++) this.ebullet(z.x, z.y, i * 6.283 / z.burst, 200, z.dmg * .35, z.col);
      }
    }
    this.zones = this.zones.filter(z => z.delay > 0);
    // stairs
    if (this.mode === 'floor' && this.cleared) {
      const s = this.stairs; if (pl.x > s.x && pl.x < s.x + s.w && pl.y > s.y && pl.y < s.y + s.h + 20) { this.advance(); return; }
    }
    for (const b of this.proj) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.x < 0 || b.y < 0 || b.x > W2 || b.y > H2 || this.walls.some(r => b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h)) b.life = 0;
      this.fx.push({ x: b.x, y: b.y, vx: 0, vy: 0, t: .15, c: b.col });
      for (const e of this.enemies.slice()) {
        if (e.dead || b.hit.includes(e)) continue;
        if (Math.abs(e.x - b.x) < e.w / 2 + b.r && Math.abs(e.y - b.y) < e.h / 2 + b.r) {
          b.hit.push(e); this.hurtEnemy(e, b.dmg, b.vx, b.vy, 160, b.col); if (b.poison) { e.poison = 4; e.pt = .5; }
          if (!b.pierce) { b.life = 0; break; }
        }
      }
    }
    this.proj = this.proj.filter(b => b.life > 0);
    for (const r of this.rings) r.t -= dt; this.rings = this.rings.filter(r => r.t > 0);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 160 * dt; f.t -= dt; }
    this.fx = this.fx.filter(f => f.t > 0);
    for (const t of this.texts) { t.y -= 22 * dt; t.t -= dt; }
    this.texts = this.texts.filter(t => t.t > 0);
  },
  draw() {
    const p = G.p, pl = this.pl, st = sx(p), el = ELEM[p.element];
    const cx = clamp(pl.x - W / 2, 0, Math.max(0, this.W - W)), cy = clamp(pl.y - H / 2, 0, Math.max(0, this.H - H));
    const ox = this.shake > 0 ? rnd(-3, 3) : 0, oy = this.shake > 0 ? rnd(-3, 3) : 0;
    ctx.save(); ctx.translate(Math.round(-cx + ox), Math.round(-cy + oy));
    const bio = this.bio, hub = this.mode === 'hub';
    ctx.fillStyle = hub ? '#0d1226' : bio.bg; ctx.fillRect(0, 0, this.W, this.H);
    for (let ty = Math.floor(cy / 40); ty < (cy + H) / 40; ty++) for (let tx = Math.floor(cx / 40); tx < (cx + W) / 40; tx++) {
      ctx.fillStyle = hub ? ((tx + ty) % 2 ? '#141b38' : '#10162f') : ((tx + ty) % 2 ? bio.t1 : bio.t2); ctx.fillRect(tx * 40, ty * 40, 40, 40);
    }
    if (hub) {
      ctx.fillStyle = 'rgba(46,200,255,.35)'; ctx.fillRect(0, 100, this.W, 2); ctx.fillRect(0, this.H - 60, this.W, 2);
      ctx.fillStyle = 'rgba(255,90,200,.25)'; ctx.fillRect(40, 0, 2, this.H); ctx.fillRect(this.W - 42, 0, 2, this.H);
      // blast door
      ctx.fillStyle = '#2b3042'; ctx.fillRect(430, 10, 100, 50); ctx.fillStyle = '#ffb02e';
      for (let i = 0; i < 6; i++) ctx.fillRect(432 + i * 17, 52, 9, 6);
      ctx.fillStyle = '#0a0c14'; ctx.fillRect(455, 18, 50, 34); T('FLOOR ' + p.floor, 480, 29, 11, '#ffb02e', 'center');
      // merchant stall
      ctx.fillStyle = '#5a3a2a'; ctx.fillRect(95, 250, 100, 36); ctx.fillStyle = '#c0452f'; ctx.fillRect(90, 238, 110, 14);
      ctx.fillStyle = '#ffd36a'; for (let i = 0; i < 5; i++) ctx.fillRect(94 + i * 22, 252, 10, 3);
      T('SHOP', 145, 262, 12, '#ffd36a', 'center');
      // board
      ctx.fillStyle = '#16314a'; ctx.fillRect(770, 250, 90, 36); ctx.strokeStyle = '#5be0ff'; ctx.lineWidth = 2; ctx.strokeRect(771, 251, 88, 34);
      T('BOUNTY', 815, 262, 12, '#5be0ff', 'center');
      ctx.fillStyle = '#2a3560'; ctx.fillRect(300, 360, 30, 30); ctx.fillRect(630, 360, 30, 30);
      ctx.fillStyle = '#5be0ff'; ctx.fillRect(300, 360, 30, 3); ctx.fillRect(630, 360, 30, 3);
    } else {
      for (const r of this.walls) {
        ctx.fillStyle = bio.wall; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = bio.acc; ctx.globalAlpha = .55; ctx.fillRect(r.x, r.y, r.w, 3); ctx.fillRect(r.x, r.y, 3, r.h); ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(r.x, r.y + r.h - 6, r.w, 6);
      }
      const s = this.stairs, on = this.cleared, pulse = .5 + .5 * Math.sin(this.t * 4);
      ctx.fillStyle = on ? 'rgba(80,220,255,' + (.3 + .3 * pulse) + ')' : '#2a2030'; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = on ? '#7ef0ff' : '#6a4a58'; ctx.lineWidth = 2; ctx.strokeRect(s.x, s.y, s.w, s.h);
      T(on ? 'STAIRS' : 'LOCKED', s.x + s.w / 2, s.y + 18, 12, on ? '#fff' : '#a07a88', 'center');
    }
    // interact labels / entities
    const list = [{ y: pl.y, d: () => {
      const blink = pl.inv > 0 && Math.floor(this.t * 20) % 2;
      if (!blink) drawChar(pl.x, pl.y, { outfit: OUTFITS[p.outfit], hair: HAIRS[p.hair], elc: el.color, fx: pl.fx, fy: pl.fy, moving: pl.moving }, this.t);
      if (pl.lHold > .1 && p.lvl >= ULT_LVL) { ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pl.x, pl.y - 8, 20, -1.57, -1.57 + 6.28 * clamp(pl.lHold / .45, 0, 1)); ctx.stroke(); }
      if (pl.atkT > 0) {
        const a = Math.atan2(pl.fy, pl.fx), r = 26; ctx.strokeStyle = el.color; ctx.lineWidth = 5; ctx.globalAlpha = clamp(pl.atkT / .18, 0, 1);
        ctx.beginPath(); ctx.arc(pl.x, pl.y - 8, r, a - 1.0, a + 1.0); ctx.stroke(); ctx.globalAlpha = 1;
      }
    } }];
    if (hub) {
      for (const k in CLIMBERS) { const c = CLIMBERS[k]; list.push({ y: c.y, d: () => { drawChar(c.x, c.y, { outfit: c.outfit, hair: c.hair, elc: ELEM[c.el].color, fx: 0, fy: 1, moving: false }, this.t); T(c.name, c.x, c.y - 42, 11, ELEM[c.el].color, 'center'); } }); }
      list.push({ y: 246, d: () => { drawChar(145, 246, { outfit: '#8a6a3a', hair: '#555', elc: '#ffd36a', fx: 0, fy: 1, moving: false }, this.t); } });
    }
    for (const e of this.enemies) list.push({ y: e.y, d: () => this.drawEnemy(e) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    for (const r of this.rings) { const k = 1 - r.t / r.max; ctx.strokeStyle = r.col; ctx.lineWidth = 4; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (.3 + .7 * k), 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    for (const z of this.zones) { const k = 1 - z.delay / z.max; ctx.fillStyle = z.col; ctx.globalAlpha = .12 + .2 * k; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.3); ctx.fill(); ctx.globalAlpha = .85; ctx.strokeStyle = z.col; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    for (const b of this.eb) { ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1, 0, 6.3); ctx.fill(); ctx.fillStyle = '#1a0a10'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 2, 0, 6.3); ctx.fill(); }
    for (const b of this.proj) { ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2); }
    if (pl.shieldT > 0) { ctx.strokeStyle = '#c8f08a'; ctx.lineWidth = 3; ctx.globalAlpha = .5 + .3 * Math.sin(this.t * 12); ctx.beginPath(); ctx.arc(pl.x, pl.y - 10, 20, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    for (const f of this.fx) { ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 3, 3); }
    for (const t of this.texts) T(t.s, t.x, t.y, 12, t.c, 'center');
    const near = this.nearest();
    if (near && !Dlg.active && !this.menu) { T('[J] ' + near.label, near.x, near.y - 52, 13, '#fff', 'center'); }
    ctx.restore();

    // HUD
    panel(8, 8, 214, 70, el.color);
    T(p.name + '  Lv' + p.lvl, 16, 13, 13, '#fff'); T(p.guild + ' / ' + p.element, 16, 29, 11, el.color, 'left', false);
    bar(16, 44, 140, 9, p.hp, st.maxHp, '#e0414b'); T(Math.ceil(p.hp) + '/' + st.maxHp, 162, 42, 10, '#fff', 'left', false);
    bar(16, 57, 140, 7, p.sta, st.maxSta, '#e8c23a'); bar(16, 67, 140, 4, p.xp, p.lvl * 35, '#6a8cff');
    const sk = SKILLS[p.guild], ul = ULTS[p.guild], rk = ['I', 'II', 'III'][rankOf(p) - 1], scd = sk.cd * (1 - 0.12 * (rankOf(p) - 1));
    panel(8, 84, 214, 46, el.color);
    T('[L] ' + sk.name + ' ' + rk, 16, 89, 12, pl.skCd > 0 ? '#8a93ad' : '#fff');
    bar(16, 104, 198, 3, pl.skCd > 0 ? scd - pl.skCd : scd, scd, pl.skCd > 0 ? '#5a6fa0' : '#7dffb0');
    if (p.lvl >= ULT_LVL) { T('[Hold L] ' + ul.name, 16, 111, 11, pl.ultCd > 0 ? '#8a93ad' : '#ffe08a'); bar(16, 125, 198, 3, pl.ultCd > 0 ? ULT_CD - pl.ultCd : ULT_CD, ULT_CD, pl.ultCd > 0 ? '#5a6fa0' : '#ffe08a'); }
    else T('Ultimate unlocks at Lv ' + ULT_LVL, 16, 111, 11, '#6f7a99', 'left', false);
    const bs = this.enemies.find(e => e.type === 'boss');
    if (bs && bs.active) { panel(232, 8, 340, 40, bs.col); T(bs.bname + '  -  Phase ' + bs.phase + '/3', 402, 12, 12, '#fff', 'center'); bar(242, 30, 320, 9, bs.hp, bs.max, bs.col); }
    panel(W - 190, 8, 182, 52, '#7ec8ff');
    T(hub ? 'HUB  Floor ' + p.floor : 'Floor ' + p.floor + ' / 100', W - 182, 13, 13, '#fff');
    T(p.inv.shards + ' shards  ' + p.inv.potions + ' potions', W - 182, 31, 11, '#ffd36a', 'left', false);
    if (!hub) T(this.cleared ? 'Reach the stairs' : 'Foes left: ' + this.enemies.length + '/' + this.total, W - 182, 44, 10, this.cleared ? '#7ef0ff' : '#ff9a8a', 'left', false);
    // Radar Minimap (When on Floor)
    if (!hub) {
      const mw = 90, mh = 58, mx = W - 100, my = 68;
      panel(mx, my, mw, mh, '#3a4a78');
      ctx.fillStyle = 'rgba(6,10,24,0.75)'; ctx.fillRect(mx + 2, my + 2, mw - 4, mh - 4);
      const ppx = mx + (pl.x / this.W) * (mw - 4), ppy = my + (pl.y / this.H) * (mh - 4);
      ctx.fillStyle = el.color; ctx.fillRect(ppx - 1.5, ppy - 1.5, 3, 3);
      for (const e of this.enemies) {
        const epx = mx + (e.x / this.W) * (mw - 4), epy = my + (e.y / this.H) * (mh - 4);
        ctx.fillStyle = e.type === 'boss' ? '#ffe08a' : '#ef4444'; ctx.fillRect(epx - 1, epy - 1, 2, 2);
      }
      const stx = mx + (this.stairs.x / this.W) * (mw - 4), sty = my + (this.stairs.y / this.H) * (mh - 4);
      ctx.fillStyle = this.cleared ? '#facc15' : '#64748b'; ctx.fillRect(stx - 1.5, sty - 1.5, 3, 3);
    }
    if (this.banner > 0) { ctx.globalAlpha = clamp(this.banner, 0, 1); T(this.bannerText, W / 2, 100, 18, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (toastT > 0) { ctx.globalAlpha = clamp(toastT, 0, 1); { const tw = Math.max(340, toastS.length * 8 + 30); panel(W / 2 - tw / 2, 138, tw, 26, '#7ec8ff'); } T(toastS, W / 2, 144, 13, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (this.menu) { panel(130, 100, 540, 46, '#ffd36a'); T('Merchant   Shards: ' + p.inv.shards, 150, 114, 15, '#ffd36a'); menuDraw(this.menu); T('K: leave', 150, 330, 12, '#9fc0ff', 'left', false); }
    if (this.paused) { ctx.fillStyle = 'rgba(0,0,10,.6)'; ctx.fillRect(0, 0, W, H); T('PAUSED', W / 2, 90, 28, '#fff', 'center'); menuDraw(this.pm);
      const sk = SKILLS[p.guild], ul = ULTS[p.guild], r = rankOf(p); panel(170, 330, 460, 100, el.color);
      T(sk.name + '  Rank ' + r + (r < 3 ? '  (next rank at Lv ' + (r === 1 ? 6 : 12) + ')' : '  (max)'), 186, 338, 13, '#fff');
      T(sk.desc, 186, 356, 11, '#a9c4ee', 'left', false);
      T('Ultimate: ' + ul.name + (p.lvl >= ULT_LVL ? '  (hold L)' : '  (unlocks at Lv ' + ULT_LVL + ')'), 186, 378, 13, p.lvl >= ULT_LVL ? '#ffe08a' : '#6f7a99');
      T(ul.desc, 186, 396, 11, '#a9c4ee', 'left', false);
      T('Zodiac Relics (' + p.relics.length + '): ' + (p.relics.length ? p.relics.join(', ') : 'None yet'), 186, 414, 11, '#fde047', 'left', false); }
    if (Dlg.active) Dlg.draw();
  },
  drawEnemy(e) {
    if (e.type === 'boss' && e.state === 'tele' && (e.pat === 'volley' || e.pat === 'charge' || e.pat === 'blink')) {
      if (e.pat !== 'blink') {
        const len = e.pat === 'charge' ? 460 : 280; ctx.strokeStyle = e.col; ctx.globalAlpha = .25 + .35 * (1 - e.st / PATTERNS[e.pat].tele); ctx.lineWidth = e.pat === 'charge' ? 26 : 3;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.aim) * len, e.y + Math.sin(e.aim) * len); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    const bob = Math.sin(this.t * 6 + e.ph) * 2, f = e.flash > 0;
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y + bob));
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-e.w / 2, e.h / 2 + 2 - bob, e.w, 3);
    if (e.type === 'boss') {
      const tele = e.state === 'tele', rec = e.state === 'rec', fl = f || (tele && Math.floor(this.t * 14) % 2);
      if (e.pat === 'blink' && tele) ctx.globalAlpha = .35 + .3 * Math.sin(this.t * 30);
      ctx.fillStyle = fl ? '#fff' : '#252a38'; ctx.fillRect(-16, -13, 32, 26);
      ctx.fillStyle = fl ? '#fff' : '#454c5e'; ctx.fillRect(-23, -9, 7, 18); ctx.fillRect(16, -9, 7, 18);
      ctx.fillStyle = e.col; ctx.fillRect(-16, -13, 32, 3); ctx.fillRect(-16, 10, 32, 3); ctx.fillRect(-23, -9, 7, 2); ctx.fillRect(16, -9, 7, 2);
      ctx.fillStyle = rec ? '#6a7080' : e.col; ctx.globalAlpha *= .75 + .25 * Math.sin(this.t * 8); ctx.fillRect(-6, -5, 12, 10); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.fillRect(-2, -2, 4, 4);
      for (let i = 0; i < e.phase; i++) { ctx.fillStyle = e.col; ctx.fillRect(-8 + i * 7, -19, 5, 4); }
      if (rec) T('...', 0, -34, 12, '#9fb0d0', 'center');
    } else if (e.type === 'anomaly') {
      ctx.fillStyle = f ? '#fff' : '#1f3a6e'; ctx.beginPath(); ctx.arc(0, 0, e.w / 2 + 1 + Math.sin(this.t * 5 + e.ph), 0, 6.3); ctx.fill();
      ctx.fillStyle = f ? '#fff' : '#58b2ff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ff2b2b'; ctx.fillRect(-1, -7, 3, 3);
    } else {
      const s = e.type === 'boss' ? 2 : 1; ctx.scale(s, s);
      ctx.fillStyle = f ? '#fff' : '#2a2f3a'; ctx.fillRect(-7, -5, 14, 10);
      ctx.fillStyle = f ? '#fff' : '#454c5e'; ctx.fillRect(-9, -7, 4, 2); ctx.fillRect(5, -7, 4, 2);
      ctx.fillStyle = '#ff2b2b'; ctx.globalAlpha = .7 + .3 * Math.sin(this.t * 8 + e.ph); ctx.fillRect(-2, -2, 4, 4); ctx.globalAlpha = 1;
      ctx.fillStyle = '#58b2ff'; ctx.fillRect(-6, 2, 3, 2);
    }
    ctx.restore();
    if (e.hp < e.max && e.type !== 'boss') { bar(e.x - 12, e.y - e.h / 2 - 8, 24, 3, e.hp, e.max, '#ff5a4a'); }
  }
};
function moveBox(e, dx, dy, walls, WW, HH) {
  e.x += dx; e.y += dy;
  for (const r of walls) {
    if (Math.abs(e.x - (r.x + r.w / 2)) < (e.w + r.w) / 2 && Math.abs(e.y - (r.y + r.h / 2)) < (e.h + r.h) / 2) {
      if (dx > 0) e.x = r.x - e.w / 2; else if (dx < 0) e.x = r.x + r.w + e.w / 2;
      if (dy > 0) e.y = r.y - e.h / 2; else if (dy < 0) e.y = r.y + r.h + e.h / 2;
    }
  }
  e.x = clamp(e.x, e.w / 2, WW - e.w / 2); e.y = clamp(e.y, e.h / 2 + 4, HH - e.h / 2);
}

/* ================= Game over / Victory ================= */
const Over = {
  enter() { this.t = 0; this.m = Menu([{ label: 'Reload last save', fn: () => loadSlot(G.slot) }, { label: 'Return to title', fn: () => go(Title) }], 250, 250, 300, 40); },
  update(dt) { this.t += dt; if (this.t > .6) menuStep(this.m); },
  draw() {
    ctx.fillStyle = '#12060a'; ctx.fillRect(0, 0, W, H);
    T('SYSTEM FAILURE', W / 2, 90, 38, '#ff5a6a', 'center');
    T('You fell on Floor ' + G.p.floor + '. The Spire resets its drones.', W / 2, 150, 14, '#e9b0b8', 'center', false);
    T('Your last save is waiting.', W / 2, 176, 14, '#e9b0b8', 'center', false);
    menuDraw(this.m);
  }
};
const Victory = {
  enter() { this.t = 0; const p = G.p; p.floor = 100; p.loc = 'hub'; p.hp = sx(p).maxHp; Save.write(G.slot, p); this.m = Menu([{ label: 'Return to title', fn: () => go(Title) }], 250, 330, 300, 40); },
  update(dt) { this.t += dt; menuStep(this.m); },
  draw() {
    ctx.fillStyle = '#05061a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) { ctx.fillStyle = 'rgba(255,240,180,' + (.3 + .6 * Math.abs(Math.sin(this.t + i))) + ')'; ctx.fillRect((i * 83) % W, (i * 47 + this.t * 20) % H, 2, 2); }
    T('FLOOR 100 CLEARED', W / 2, 80, 36, '#ffe08a', 'center');
    wrap('The artifact hums in your hands. The constellations wait for your command, ' + G.p.name + ' of the ' + G.p.guild + ' Guild. The stars are yours to rewrite.', 560, 17)
      .forEach((l, i) => T(l, W / 2, 150 + i * 28, 17, '#dbe9ff', 'center'));
    T('Thanks for playing Astral Spire!', W / 2, 290, 14, '#9fc0ff', 'center');
    menuDraw(this.m);
  }
};

/* ================= Import file handler ================= */
$('imp').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || typeof d.name !== 'string' || !GUILDS.some(g => g[0] === d.guild)) throw new Error('bad');
      go(Slots, { mode: 'import', data: normSave(d) });
    } catch (x) { toast('That file is not a valid save'); }
    e.target.value = '';
  };
  r.readAsText(f);
});

/* ================= Main loop ================= */
go(Title);
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  Input.update();
  scene.update(dt);
  if (scene !== World) toastT -= dt;
  ctx.clearRect(0, 0, W, H); scene.draw();
  if (scene !== World && toastT > 0) { ctx.globalAlpha = clamp(toastT, 0, 1); { const tw = Math.max(340, toastS.length * 8 + 30); panel(W / 2 - tw / 2, H - 100, tw, 26, '#7ec8ff'); } T(toastS, W / 2, H - 94, 13, '#fff', 'center'); ctx.globalAlpha = 1; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__astral = { G, get scene() { return scene; } }; // handy for debugging in the console
})();
