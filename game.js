/* ==========================================================================
   ASTRAL SPIRE: GBA / INOTIA 16-BIT PIXEL-ART EDITION
   Complete Zero-Build HTML5 Action RPG for PC & Mobile
   ========================================================================== */
(function () {
'use strict';

/* ================= 1. Basics & Math Utilities ================= */
const W = 800, H = 450;
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const int = (v, def, lo, hi) => { v = Math.floor(Number(v)); if (!isFinite(v)) v = def; return clamp(v, lo, hi); };
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ================= 2. Game Data & Guilds ================= */
const ELEM = {
  Fire:  { color: '#ef4444', cls: 'Pyromancer Vanguard',  hp: 100, sta: 50, atk: 15, spd: 105, perk: 'Deals highest flame damage & burns foes' },
  Earth: { color: '#84cc16', cls: 'Geomancer Guardian',   hp: 140, sta: 45, atk: 11, spd: 90,  perk: 'Takes 25% less damage, heavy kinetic poise' },
  Air:   { color: '#06b6d4', cls: 'Aeromancer Rogue',     hp: 90,  sta: 70, atk: 11, spd: 125, perk: 'Fastest movement speed & +15% Crit chance' },
  Water: { color: '#3b82f6', cls: 'Hydromancer Healer',   hp: 105, sta: 60, atk: 10, spd: 100, perk: 'Heals 5 HP on kill, +50% Potion potency' }
};

const GUILDS = [
  ['Aries', 'Fire', 'Vanguards of the opening charge. Aggressive, relentless, and unbreakable.'],
  ['Taurus', 'Earth', 'The unyielding bastion of the Spire. Anchors the line against all odds.'],
  ['Gemini', 'Air', 'Twin-blade rogues who strike from the shadows before enemies can react.'],
  ['Cancer', 'Water', 'Tactical battle healers who mend the party and outlast long sieges.'],
  ['Leo', 'Fire', 'Proud flame-champions who channel the solar corona into devastating slashes.'],
  ['Virgo', 'Earth', 'Precise techno-artisans who exploit enemy weak points and electrical circuits.'],
  ['Libra', 'Air', 'Balanced duelists who turn the momentum of enemy attacks against them.'],
  ['Scorpio', 'Water', 'Lethal infiltrators whose venomous blades inflict agonizing poison over time.'],
  ['Sagittarius', 'Fire', 'Far-sighted starlight marksmen who loose piercing celestial arrows.'],
  ['Capricorn', 'Earth', 'Mountain-climbers whose endurance outlasts even the deepest Spire floors.'],
  ['Aquarius', 'Air', 'Storm-callers who summon gale vortexes to blast and slow approaching foes.'],
  ['Pisces', 'Water', 'Dreamers who glide through data-streams, phasing through damage with tidal grace.']
];

const OUTFITS = ['#e11d48', '#65a30d', '#0891b2', '#2563eb', '#9333ea', '#d97706'];
const OUTFIT_N = ['Crimson Cloak', 'Olive Tunic', 'Teal Rogue', 'Azure Robe', 'Violet Mantle', 'Golden Mail'];
const HAIRS = ['#18181b', '#f1f5f9', '#f43f5e', '#0284c7', '#fbbf24', '#71717a'];
const HAIR_N = ['Midnight Raven', 'Silver Starlight', 'Rose Blossom', 'Sky Azure', 'Golden Sun', 'Ash Gray'];
const HAIR_STYLES = ['Spiky Hero', 'Twin Braids', 'Samurai Ponytail', 'Adventurer Cap', 'Mystic Locks', 'Short Bob'];

const BIOMES = [
  { name: 'Ancient Cyber-Ruins', bg: '#0d131f', wall: '#1e293b', floor: '#141c2e', acc: '#06b6d4', extra: 0 },
  { name: 'Volcanic Forge',      bg: '#170b09', wall: '#292524', floor: '#1c1917', acc: '#f97316', extra: 3 },
  { name: 'Astral Labyrinth',    bg: '#09071a', wall: '#1e1b4b', floor: '#111827', acc: '#a855f7', extra: 7 }
];

/* ================= 3. 16-Bit Chiptune Web Audio Engine ================= */
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
    this.gainMaster.gain.value = 0.22;
    this.gainMaster.connect(ctx.destination);

    this.gainMusic = ctx.createGain();
    this.gainMusic.gain.value = this.musicOn ? 0.32 : 0;
    this.gainMusic.connect(this.gainMaster);

    this.gainSfx = ctx.createGain();
    this.gainSfx.gain.value = this.sfxOn ? 0.85 : 0;
    this.gainSfx.connect(this.gainMaster);
  },

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.gainMusic) this.gainMusic.gain.value = this.musicOn ? 0.32 : 0;
    toast(this.musicOn ? '🎵 Music: ON' : '🎵 Music: OFF');
  },

  setTrack(name) {
    if (this.currentTrack === name) return;
    this.currentTrack = name;
    this.step = 0;
    this.stepTimer = 0;
    if (name === 'hub') this.bpm = 92;
    else if (name === 'floor') this.bpm = 118;
    else if (name === 'boss') this.bpm = 142;
  },

  beep(f, d = 0.08, type = 'square', v = 0.04) {
    if (!this.sfxOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.init();
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, ctx.currentTime);
      g.gain.setValueAtTime(v, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
      o.connect(g);
      g.connect(this.gainSfx || ctx.destination);
      o.start();
      o.stop(ctx.currentTime + d);
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
      const f = [440, 560, 320][combo % 3];
      o.frequency.setValueAtTime(f, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
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
      o.frequency.setValueAtTime(isCrit ? 620 : 160, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(isCrit ? 140 : 40, ctx.currentTime + 0.16);
      g.gain.setValueAtTime(isCrit ? 0.22 : 0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      o.connect(g);
      g.connect(this.gainSfx || ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.16);
      if (isCrit) setTimeout(() => this.beep(880, 0.14, 'triangle', 0.08), 25);
    } catch (e) {}
  },

  playDash() {
    if (!this.sfxOn) return;
    this.beep(260, 0.11, 'sawtooth', 0.08);
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

    // Chiptune melodic sequences (G Major Town / D Minor Dungeon / F Minor Boss)
    const hubMelody = [392, 440, 493.88, 587.33, 523.25, 493.88, 440, 392, 329.63, 392, 440, 493.88, 587.33, 659.25, 587.33, 493.88];
    const hubBass   = [196, 0, 196, 0, 164.81, 0, 164.81, 0, 146.83, 0, 146.83, 0, 174.61, 0, 196, 0];

    const dungeonMelody = [293.66, 0, 349.23, 440, 392, 349.23, 293.66, 0, 329.63, 349.23, 440, 523.25, 493.88, 440, 349.23, 329.63];
    const dungeonBass   = [73.42, 73.42, 0, 87.31, 73.42, 0, 98, 0, 73.42, 73.42, 0, 110, 87.31, 0, 73.42, 0];

    const bossMelody = [349.23, 415.3, 523.25, 466.16, 523.25, 587.33, 466.16, 415.3, 523.25, 622.25, 698.46, 622.25, 587.33, 523.25, 466.16, 415.3];
    const bossBass   = [87.31, 87.31, 103.83, 87.31, 116.54, 87.31, 130.81, 87.31, 98, 98, 116.54, 98, 130.81, 116.54, 103.83, 87.31];

    let mFreq = 0, bFreq = 0;
    if (track === 'hub') { mFreq = hubMelody[step]; bFreq = hubBass[step]; }
    else if (track === 'floor') { mFreq = dungeonMelody[step]; bFreq = dungeonBass[step]; }
    else if (track === 'boss') { mFreq = bossMelody[step]; bFreq = bossBass[step]; }

    const t = ctx.currentTime;
    if (bFreq > 0) {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = track === 'boss' ? 'sawtooth' : 'triangle';
        o.frequency.setValueAtTime(bFreq, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g);
        g.connect(this.gainMusic);
        o.start(t);
        o.stop(t + 0.16);
      } catch (e) {}
    }

    if (mFreq > 0) {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = track === 'hub' ? 'triangle' : 'square';
        o.frequency.setValueAtTime(mFreq, t);
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.13);
        o.connect(g);
        g.connect(this.gainMusic);
        o.start(t);
        o.stop(t + 0.13);
      } catch (e) {}
    }

    // Chiptune Percussion Ticks
    if ((track === 'floor' || track === 'boss') && (step % 4 === 2)) {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(30, t + 0.05);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        o.connect(g);
        g.connect(this.gainMusic);
        o.start(t);
        o.stop(t + 0.05);
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

/* ================= 4. Unified Input Manager ================= */
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
    KeyM: 'music',
    Digit1: 'num1', Digit2: 'num2', Digit3: 'num3',
    Digit4: 'num4', Digit5: 'num5', Digit6: 'num6',
    Digit7: 'num7', Digit8: 'num8', Digit9: 'num9',
    KeyB: 'bag', KeyE: 'bag'
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
        up: !!keys.up || joy.y < -0.55,
        down: !!keys.down || joy.y > 0.55,
        left: !!keys.left || joy.x < -0.55,
        right: !!keys.right || joy.x > 0.55,
        j: !!keys.j || tb.j,
        k: !!keys.k || tb.k,
        l: !!keys.l || tb.l,
        dash: !!keys.dash || tb.dash,
        p: !!keys.p || tb.p,
        music: !!keys.music,
        num1: !!keys.num1, num2: !!keys.num2, num3: !!keys.num3,
        num4: !!keys.num4, num5: !!keys.num5, num6: !!keys.num6,
        num7: !!keys.num7, num8: !!keys.num8, num9: !!keys.num9,
        bag: !!keys.bag
      };
      api.cur = cur;
      api.tap = pend;
      pend = null;

      if (this.just('music')) {
        AudioSys.toggleMusic();
      }
    },
    just(n) { return !!cur[n] && !prev[n]; },
    move() {
      let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      let y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (!x && !y && Math.hypot(joy.x, joy.y) > 0.2) {
        x = joy.x; y = joy.y;
      }
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
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

  const joy = $('joy'), knob = $('knob');
  let jid = null;
  function setJ(e) {
    const r = joy.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    Input.joy.x = dx; Input.joy.y = dy;
    knob.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
  }

  joy.addEventListener('pointerdown', e => {
    jid = e.pointerId;
    try { joy.setPointerCapture(e.pointerId); } catch (x) {}
    setJ(e);
    e.preventDefault();
  });
  joy.addEventListener('pointermove', e => { if (e.pointerId === jid) setJ(e); });
  const endJ = e => {
    if (e.pointerId === jid) {
      jid = null;
      Input.joy.x = Input.joy.y = 0;
      knob.style.transform = '';
    }
  };
  joy.addEventListener('pointerup', endJ);
  joy.addEventListener('pointercancel', endJ);

  function btn(id, key) {
    const el = $(id);
    if (!el) return;
    const on = e => {
      Input.tb[key] = true;
      el.classList.add('on');
      haptic(12);
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
    };
    const off = () => {
      Input.tb[key] = false;
      el.classList.remove('on');
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
  }

  btn('bJ', 'j');
  btn('bK', 'k');
  btn('bL', 'l');
  btn('bD', 'dash');
  btn('bP', 'p');

  const bM = $('bMusic');
  if (bM) {
    bM.addEventListener('pointerdown', e => {
      e.preventDefault();
      AudioSys.toggleMusic();
    });
  }

  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect();
    Input.setTap((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
    e.preventDefault();
  });

  window.addEventListener('pointerdown', function once(e) {
    if (e.pointerType !== 'touch') return;
    window.removeEventListener('pointerdown', once);
    try {
      const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (p && p.then) {
        p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
      }
    } catch (x) {}
  });

  document.addEventListener('contextmenu', e => e.preventDefault());
})();

/* ================= 5. GBA / Inotia Pixel-Art Engine ================= */
const PixelArt = {
  tiles: {},
  portraits: {},
  props: {},

  createOffscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: cx };
  },

  init() {
    this.createTiles();
    this.createPortraits();
    this.createProps();
  },

  createTiles() {
    // 1. Town Cobblestone Tile (Warm Inotia stone paving)
    let { canvas, ctx } = this.createOffscreen(32, 32);
    ctx.fillStyle = '#64748b'; ctx.fillRect(0, 0, 32, 32);
    const stones = [
      [2, 2, 12, 12, '#94a3b8'], [16, 2, 14, 10, '#cbd5e1'],
      [2, 16, 13, 14, '#cbd5e1'], [17, 14, 13, 16, '#94a3b8']
    ];
    for (const [x, y, w, h, col] of stones) {
      ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#f1f5f9'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
      ctx.fillStyle = '#475569'; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h);
    }
    this.tiles.town_cobble = canvas;

    // 2. Town Grass Tile (Pokemon Emerald lush green with tiny wildflowers)
    ({ canvas, ctx } = this.createOffscreen(32, 32));
    ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#16a34a'; ctx.fillRect(2, 2, 28, 28);
    ctx.fillStyle = '#22c55e';
    // Grass blade tufts
    ctx.fillRect(4, 6, 2, 4); ctx.fillRect(6, 4, 2, 4);
    ctx.fillRect(20, 18, 2, 4); ctx.fillRect(22, 16, 2, 4);
    ctx.fillRect(10, 24, 2, 4);
    // Tiny buttercups & wild red flowers
    ctx.fillStyle = '#fde047'; ctx.fillRect(8, 8, 2, 2); ctx.fillRect(24, 20, 2, 2);
    ctx.fillStyle = '#f43f5e'; ctx.fillRect(14, 14, 2, 2);
    this.tiles.town_grass = canvas;

    // 3. Ancient Cyber-Ruins Floor (Biome 1)
    ({ canvas, ctx } = this.createOffscreen(32, 32));
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(1, 1, 30, 30);
    // Glowing cyan cyber conduits
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(15, 0, 2, 32); ctx.fillRect(0, 15, 32, 2);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(14, 14, 4, 4);
    this.tiles.ruins_floor = canvas;

    // 4. Ancient Ruins Stone Wall (with 3D bevel & stone texture)
    ({ canvas, ctx } = this.createOffscreen(32, 32));
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#334155'; ctx.fillRect(2, 2, 28, 28);
    ctx.fillStyle = '#475569'; ctx.fillRect(3, 3, 26, 6); // Capstone bevel highlight
    ctx.fillStyle = '#1e293b'; ctx.fillRect(3, 10, 26, 18);
    // Mortar lines
    ctx.fillStyle = '#0f172a'; ctx.fillRect(3, 18, 26, 2); ctx.fillRect(16, 10, 2, 8);
    this.tiles.stone_wall = canvas;

    // 5. Volcanic Forge Floor (Biome 2 - Basalt & Magma fissures)
    ({ canvas, ctx } = this.createOffscreen(32, 32));
    ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#292524'; ctx.fillRect(2, 2, 28, 28);
    // Glowing lava vein
    ctx.fillStyle = '#ea580c'; ctx.fillRect(4, 12, 14, 2); ctx.fillRect(16, 12, 2, 16);
    ctx.fillStyle = '#fde047'; ctx.fillRect(8, 12, 4, 2); ctx.fillRect(16, 18, 2, 4);
    this.tiles.forge_floor = canvas;

    // 6. Astral Labyrinth Floor (Biome 3 - Cosmic Indigo & Golden runes)
    ({ canvas, ctx } = this.createOffscreen(32, 32));
    ctx.fillStyle = '#09071a'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(1, 1, 30, 30);
    ctx.fillStyle = '#a855f7'; ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#fde047'; ctx.fillRect(15, 8, 2, 16); ctx.fillRect(8, 15, 16, 2);
    this.tiles.astral_floor = canvas;
  },

  createPortraits() {
    // 1. YUNA (Pyromancer - Red twintails, gold clips, mischievous wink)
    let { canvas, ctx } = this.createOffscreen(48, 48);
    ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, 48, 48);
    // Skin
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(12, 14, 24, 22);
    // Blush
    ctx.fillStyle = '#fca5a5'; ctx.fillRect(14, 26, 4, 2); ctx.fillRect(30, 26, 4, 2);
    // Ruby Eyes (Wink on left, big ruby eye on right)
    ctx.fillStyle = '#0f172a'; ctx.fillRect(16, 22, 6, 2); // Winking left eye
    ctx.fillStyle = '#ef4444'; ctx.fillRect(28, 20, 6, 5); // Right eye iris
    ctx.fillStyle = '#0f172a'; ctx.fillRect(29, 21, 4, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(29, 21, 2, 2); // Eye gleam
    // Cute confident mouth
    ctx.fillStyle = '#b91c1c'; ctx.fillRect(22, 30, 5, 2); ctx.fillRect(25, 32, 2, 1);
    // Fiery Red Twintails & Hair
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(10, 8, 28, 10);
    ctx.fillRect(8, 14, 6, 16); ctx.fillRect(34, 14, 6, 16); // Left & right twintails
    ctx.fillRect(14, 16, 6, 4); ctx.fillRect(28, 16, 6, 4); // Bangs
    // Gold Star Hairpin
    ctx.fillStyle = '#facc15'; ctx.fillRect(10, 12, 4, 4); ctx.fillRect(34, 12, 4, 4);
    // Red Adventurer Coat Collar
    ctx.fillStyle = '#991b1b'; ctx.fillRect(10, 36, 28, 12);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(18, 38, 12, 10);
    this.portraits.yuna = canvas;

    // 2. YURI (Geomancer - Stoic olive hair, emerald headband, steadfast gaze)
    ({ canvas, ctx } = this.createOffscreen(48, 48));
    ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(12, 14, 24, 22);
    // Emerald Eyes (Determined, calm)
    ctx.fillStyle = '#15803d'; ctx.fillRect(15, 20, 6, 4); ctx.fillRect(27, 20, 6, 4);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(16, 21, 4, 3); ctx.fillRect(28, 21, 4, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(16, 21, 2, 2); ctx.fillRect(28, 21, 2, 2);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(22, 29, 4, 2); // Calm mouth
    // Olive Hair & Forest Headband
    ctx.fillStyle = '#4d7c0f'; ctx.fillRect(10, 8, 28, 10); ctx.fillRect(8, 14, 5, 20); ctx.fillRect(35, 14, 5, 20);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(10, 14, 28, 3); // Headband
    ctx.fillStyle = '#facc15'; ctx.fillRect(22, 14, 4, 3); // Gold crest
    // Armored High Collar
    ctx.fillStyle = '#365314'; ctx.fillRect(10, 36, 28, 12);
    this.portraits.yuri = canvas;

    // 3. YUMI (Aeromancer - Teal ponytail, rogue grin)
    ({ canvas, ctx } = this.createOffscreen(48, 48));
    ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(12, 14, 24, 22);
    // Cyan Eyes
    ctx.fillStyle = '#06b6d4'; ctx.fillRect(15, 20, 6, 4); ctx.fillRect(27, 20, 6, 4);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(16, 21, 4, 3); ctx.fillRect(28, 21, 4, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(16, 21, 2, 2); ctx.fillRect(28, 21, 2, 2);
    ctx.fillStyle = '#f43f5e'; ctx.fillRect(14, 26, 3, 2); ctx.fillRect(31, 26, 3, 2);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(22, 29, 5, 2); ctx.fillRect(26, 28, 2, 1); // Playful smirk
    // Teal Hair in High Ponytail
    ctx.fillStyle = '#0891b2'; ctx.fillRect(10, 8, 28, 10); ctx.fillRect(34, 4, 10, 14); // Ponytail
    ctx.fillStyle = '#06b6d4'; ctx.fillRect(14, 16, 8, 4); ctx.fillRect(26, 16, 8, 4);
    // Rogue Cowl Collar
    ctx.fillStyle = '#155e75'; ctx.fillRect(8, 34, 32, 14);
    this.portraits.yumi = canvas;

    // 4. YUKI (Hydromancer - Gentle lavender-blue veil, compassionate smile)
    ({ canvas, ctx } = this.createOffscreen(48, 48));
    ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(12, 14, 24, 22);
    // Sapphire Eyes
    ctx.fillStyle = '#2563eb'; ctx.fillRect(15, 20, 6, 4); ctx.fillRect(27, 20, 6, 4);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(16, 21, 4, 3); ctx.fillRect(28, 21, 4, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(16, 21, 2, 2); ctx.fillRect(28, 21, 2, 2);
    ctx.fillStyle = '#93c5fd'; ctx.fillRect(14, 25, 3, 2); ctx.fillRect(31, 25, 3, 2);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(22, 29, 4, 2); // Soft smile
    // Soft Blue-Violet Hair & Pearl Ribbon
    ctx.fillStyle = '#60a5fa'; ctx.fillRect(10, 8, 28, 10); ctx.fillRect(8, 16, 6, 20); ctx.fillRect(34, 16, 6, 20);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(10, 12, 28, 3); // White pearl ribbon
    // Celestial Healer Robes
    ctx.fillStyle = '#1d4ed8'; ctx.fillRect(10, 36, 28, 12);
    ctx.fillStyle = '#bfdbfe'; ctx.fillRect(20, 36, 8, 12);
    this.portraits.yuki = canvas;

    // 5. MERCHANT UNIT 7-B (Friendly Steampunk Automaton with Goggles)
    ({ canvas, ctx } = this.createOffscreen(48, 48));
    ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, 48, 48);
    // Brass Head & Neck
    ctx.fillStyle = '#d97706'; ctx.fillRect(12, 14, 24, 22);
    ctx.fillStyle = '#92400e'; ctx.fillRect(14, 16, 20, 18);
    // Big Glowing Yellow Goggles
    ctx.fillStyle = '#facc15'; ctx.fillRect(15, 18, 8, 8); ctx.fillRect(25, 18, 8, 8);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(17, 20, 3, 3); ctx.fillRect(27, 20, 3, 3);
    ctx.fillStyle = '#451a03'; ctx.fillRect(13, 21, 2, 2); ctx.fillRect(33, 21, 2, 2); ctx.fillRect(23, 21, 2, 2);
    // Brass Grinning Mouth
    ctx.fillStyle = '#facc15'; ctx.fillRect(19, 29, 10, 3);
    // Brown Merchant Top Hat
    ctx.fillStyle = '#78350f'; ctx.fillRect(8, 10, 32, 4); ctx.fillRect(14, 2, 20, 9);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(14, 9, 20, 2);
    this.portraits.merchant = canvas;
  },

  createProps() {
    // 1. Ornate Blast Gateway to Floor 1 (96x64)
    let { canvas, ctx } = this.createOffscreen(96, 64);
    // Carved Stone Flanks
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, 96, 64);
    ctx.fillStyle = '#475569'; ctx.fillRect(4, 4, 88, 56);
    // Open gateway tunnel in center (Walkable entrance)
    ctx.fillStyle = '#020617'; ctx.fillRect(28, 12, 40, 52);
    // Constellation Portal Energy inside doorway
    ctx.fillStyle = 'rgba(6, 182, 212, 0.45)'; ctx.fillRect(30, 14, 36, 50);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(34, 18, 28, 2); ctx.fillRect(36, 26, 24, 2); ctx.fillRect(34, 34, 28, 2);
    // Flanking pillars with gold eagle capitals
    ctx.fillStyle = '#64748b'; ctx.fillRect(12, 10, 14, 54); ctx.fillRect(70, 10, 14, 54);
    ctx.fillStyle = '#facc15'; ctx.fillRect(10, 6, 18, 6); ctx.fillRect(68, 6, 18, 6);
    // Archway Header Sign
    ctx.fillStyle = '#1e293b'; ctx.fillRect(20, 2, 56, 12);
    ctx.strokeStyle = '#38bdf8'; ctx.strokeRect(20.5, 2.5, 55, 11);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('FLOOR 1 PORTAL', 48, 10);
    this.props.gateway = canvas;

    // 2. Cozy Wooden Merchant Stall with Striped Awning (64x48)
    ({ canvas, ctx } = this.createOffscreen(64, 48));
    // Red & Cream striped cloth canopy
    for (let x = 0; x < 64; x += 16) {
      ctx.fillStyle = '#e11d48'; ctx.fillRect(x, 0, 8, 16);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(x + 8, 0, 8, 16);
    }
    // Wooden counter & support posts
    ctx.fillStyle = '#854d0e'; ctx.fillRect(4, 16, 4, 28); ctx.fillRect(56, 16, 4, 28);
    ctx.fillStyle = '#a16207'; ctx.fillRect(2, 28, 60, 18);
    // Counter display bottles (HP red, SP blue)
    ctx.fillStyle = '#ef4444'; ctx.fillRect(12, 22, 6, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(13, 23, 2, 2);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(22, 22, 6, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(23, 23, 2, 2);
    ctx.fillStyle = '#facc15'; ctx.fillRect(32, 24, 8, 6); // Gold coins
    this.props.stall = canvas;

    // 3. Wooden Bounty Notice Board (48x44)
    ({ canvas, ctx } = this.createOffscreen(48, 44));
    // Wooden posts & board
    ctx.fillStyle = '#78350f'; ctx.fillRect(6, 18, 4, 26); ctx.fillRect(38, 18, 4, 26);
    ctx.fillStyle = '#92400e'; ctx.fillRect(4, 4, 40, 24);
    ctx.strokeStyle = '#b45309'; ctx.strokeRect(4.5, 4.5, 39, 23);
    // Pinned parchment notes
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(8, 8, 14, 16); ctx.fillRect(26, 8, 14, 16);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(13, 7, 3, 3); ctx.fillRect(31, 7, 3, 3); // Red pins
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 12, 10, 2); ctx.fillRect(10, 16, 8, 2);
    ctx.fillRect(28, 12, 10, 2); ctx.fillRect(28, 16, 8, 2);
    this.props.board = canvas;

    // 4. Wooden Barrel
    ({ canvas, ctx } = this.createOffscreen(20, 24));
    ctx.fillStyle = '#854d0e'; ctx.fillRect(2, 2, 16, 20);
    ctx.fillStyle = '#475569'; ctx.fillRect(1, 6, 18, 2); ctx.fillRect(1, 16, 18, 2);
    this.props.barrel = canvas;

    // 5. Supply Crate
    ({ canvas, ctx } = this.createOffscreen(22, 22));
    ctx.fillStyle = '#a16207'; ctx.fillRect(1, 1, 20, 20);
    ctx.strokeStyle = '#78350f'; ctx.strokeRect(1.5, 1.5, 19, 19);
    ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(20, 20); ctx.moveTo(20, 2); ctx.lineTo(2, 20); ctx.stroke();
    this.props.crate = canvas;

    // 6. Elevator Portal to next floor (70x50)
    ({ canvas, ctx } = this.createOffscreen(70, 50));
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 70, 50);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 68, 48);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.35)'; ctx.fillRect(4, 4, 62, 42);
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(35, 25, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(35, 25, 8, 0, Math.PI * 2); ctx.fill();
    this.props.elevator = canvas;
  }
};

/* ================= 6. Save System (3 Slots + Portability) ================= */
const Save = {
  key: n => 'astralSpire.slot' + n,
  read(n) {
    try {
      const r = localStorage.getItem(Save.key(n));
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  },
  write(n, d) {
    try {
      d.lastSaved = new Date().toISOString();
      localStorage.setItem(Save.key(n), JSON.stringify(d));
      return true;
    } catch (e) { return false; }
  },
  has() { return [1, 2, 3].some(n => !!Save.read(n)); }
};

function normSave(d) {
  d = d || {};
  const g = GUILDS.find(x => x[0] === d.guild) || GUILDS[0];
  const inv = d.inv || {}, bo = d.bounty || {}, fl = d.flags || {}, up = d.upgrades || {};
  const potCount = int(inv.potions, 2, 0, 99);
  const bagCap = int(d.bagCapacity, 9, 9, 27);
  let bagArr = null;

  if (Array.isArray(d.bag) && d.bag.length > 0) {
    bagArr = d.bag.slice(0, bagCap).map(it => it ? {
      id: it.id || 'potion',
      name: it.name || 'Field Potion',
      count: int(it.count, 1, 1, 99),
      icon: it.icon || '🧪'
    } : null);
    while (bagArr.length < bagCap) bagArr.push(null);
  } else {
    bagArr = new Array(bagCap).fill(null);
    if (potCount > 0) {
      bagArr[0] = { id: 'potion', name: 'Field Potion', count: potCount, icon: '🧪' };
    }
  }

  return {
    v: 2,
    name: String(d.name || 'Climber').slice(0, 12),
    guild: g[0],
    element: g[1],
    outfit: int(d.outfit, 0, 0, 5),
    hair: int(d.hair, 0, 0, 5),
    hairStyle: int(d.hairStyle, 0, 0, 5),
    floor: int(d.floor, 1, 1, 100),
    loc: d.loc === 'floor' ? 'floor' : 'hub',
    lvl: int(d.lvl, 1, 1, 99),
    xp: int(d.xp, 0, 0, 1e9),
    hp: Math.max(1, Number(d.hp) || 1),
    sta: Math.max(0, Number(d.sta) || 0),
    inv: {
      shards: int(inv.shards, 25, 0, 1e9),
      bones: int(inv.bones, 0, 0, 1e9),
      circuits: int(inv.circuits, 0, 0, 1e9),
      potions: potCount
    },
    bagCapacity: bagCap,
    selectedSlot: int(d.selectedSlot, 0, 0, 8),
    bag: bagArr,
    upgrades: {
      weapon: int(up.weapon, 0, 0, 20),
      armor: int(up.armor, 0, 0, 20),
      stamina: int(up.stamina, 0, 0, 20)
    },
    relics: Array.isArray(d.relics) ? d.relics.slice() : [],
    kills: int(d.kills, 0, 0, 1e9),
    best: int(d.best, 1, 1, 100),
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

  return {
    maxHp: e.hp + L * 12 + hpBonus,
    maxSta: e.sta + L * 3 + staBonus,
    atk: e.atk + L * 2 + atkBonus,
    spd: e.spd + spdBonus
  };
}

const G = { slot: 1, p: null };

function autosave() {
  if (G.p && Save.write(G.slot, G.p)) toast('★ Progress Recorded in Slot ' + G.slot);
  else if (G.p) toast('Storage blocked');
}

function exportSave(n) {
  const d = Save.read(n);
  if (!d) return;
  const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = `astral-spire-${String(d.name || 'save').replace(/\\W+/g, '_')}-slot${n}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Save Exported to File');
}

function loadSlot(n) {
  const d = Save.read(n);
  if (!d) { toast('Empty Slot'); return; }
  G.slot = n;
  G.p = normSave(d);
  const st = sx(G.p);
  G.p.hp = clamp(Math.max(G.p.hp, st.maxHp * 0.5), 1, st.maxHp);
  G.p.sta = st.maxSta;
  go(World, G.p.loc === 'floor' ? 'floor' : 'hub');
}

/* ================= 7. GBA Text & Menu Helpers ================= */
function T(s, x, y, size = 14, col = '#fff', al = 'left', bold = true) {
  ctx.font = (bold ? 'bold ' : '') + size + 'px "Courier New", monospace';
  ctx.textAlign = al;
  ctx.textBaseline = 'top';
  ctx.fillStyle = col;
  ctx.fillText(s, x, y);
}

function wrap(s, maxW, size = 14) {
  ctx.font = 'bold ' + size + 'px "Courier New", monospace';
  const words = String(s).split(' '), lines = [];
  let l = '';
  for (const w of words) {
    const t = l ? l + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; }
    else l = t;
  }
  if (l) lines.push(l);
  return lines;
}

function Menu(items, x, y, w, h = 34) {
  const m = { items, idx: 0, x, y, w, h };
  m.idx = Math.max(0, items.findIndex(i => !i.enabled || i.enabled()));
  return m;
}

const lbl = (it, k) => typeof it[k] === 'function' ? it[k]() : it[k];

function menuStep(m) {
  const n = m.items.length, en = i => !m.items[i].enabled || m.items[i].enabled();
  if (Input.just('up')) {
    for (let c = 0; c < n; c++) {
      m.idx = (m.idx + n - 1) % n;
      if (en(m.idx)) break;
    }
    beep(520, .04);
  }
  if (Input.just('down')) {
    for (let c = 0; c < n; c++) {
      m.idx = (m.idx + 1) % n;
      if (en(m.idx)) break;
    }
    beep(520, .04);
  }
  if (Input.tap) {
    for (let i = 0; i < n; i++) {
      const ry = m.y + i * (m.h + 6);
      if (Input.tap.x >= m.x && Input.tap.x <= m.x + m.w && Input.tap.y >= ry && Input.tap.y <= ry + m.h && en(i)) {
        m.idx = i;
        Input.tap = null;
        beep(760, .06);
        m.items[i].fn();
        return;
      }
    }
  }
  if (Input.just('j') && en(m.idx)) {
    beep(760, .06);
    m.items[m.idx].fn();
  }
}

function menuDraw(m) {
  for (let i = 0; i < m.items.length; i++) {
    const it = m.items[i], ry = m.y + i * (m.h + 6), on = !it.enabled || it.enabled(), sel = i === m.idx;
    // GBA styled gold & parchment selection buttons
    ctx.fillStyle = sel ? 'rgba(56,189,248,.35)' : 'rgba(15,23,42,.85)';
    ctx.fillRect(m.x, ry, m.w, m.h);
    ctx.strokeStyle = sel ? '#38bdf8' : '#334155';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(m.x + 0.5, ry + 0.5, m.w - 1, m.h - 1);
    const sub = it.sub ? lbl(it, 'sub') : null;
    T(lbl(it, 'label'), m.x + 14, ry + (sub ? 7 : (m.h - 15) / 2), 15, on ? (sel ? '#fff' : '#cbd5e1') : '#64748b');
    if (sub) T(sub, m.x + 14, ry + 29, 12, on ? '#93c5fd' : '#475569', 'left', false);
  }
}

let scene = null;
function go(s, a) {
  scene = s;
  Input.reset();
  if (s.enter) s.enter(a);
}

/* ================= 8. GBA Dialogue Box with Character Portraits ================= */
const Dlg = {
  active: false, lines: [], i: 0, ch: 0, name: '', col: '#fff', portrait: null, done: null,
  say(name, col, lines, portraitName = 'narrator', done = null) {
    this.active = true;
    this.name = name;
    this.col = col;
    this.lines = lines;
    this.portrait = PixelArt.portraits[portraitName] || null;
    this.i = 0;
    this.ch = 0;
    this.done = done;
  },
  update(dt) {
    const L = this.lines[this.i];
    this.ch += dt * 60;
    const adv = Input.just('j') || Input.tap;
    if (adv) {
      if (this.ch < L.length) this.ch = L.length;
      else {
        this.i++; this.ch = 0; beep(600, .04);
        if (this.i >= this.lines.length) this.close();
      }
    }
    if (Input.just('k')) this.close();
  },
  close() {
    this.active = false;
    const d = this.done;
    this.done = null;
    if (d) d();
  },
  draw() {
    const L = this.lines[this.i];
    const boxX = 30, boxY = H - 130, boxW = W - 60, boxH = 110;

    // Classic GBA Blue-Slate Box with Double Gold Border
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);

    // Character Portrait in Gold Frame (Left side)
    const hasP = !!this.portrait;
    if (hasP) {
      const pX = boxX + 12, pY = boxY + 12;
      ctx.fillStyle = '#020617'; ctx.fillRect(pX - 2, pY - 2, 52, 52);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(pX - 2, pY - 2, 52, 52);
      ctx.drawImage(this.portrait, pX, pY);
    }

    // Nameplate Badge with Gold Trim
    const nameX = hasP ? (boxX + 74) : (boxX + 20);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(nameX, boxY - 14, Math.max(120, this.name.length * 10 + 20), 22);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(nameX + 0.5, boxY - 13.5, Math.max(120, this.name.length * 10 + 20) - 1, 21);
    T(this.name, nameX + 8, boxY - 10, 13, '#fde047');

    // Dialogue Text Content
    const textX = hasP ? (boxX + 78) : (boxX + 20);
    const maxTextW = boxW - (hasP ? 95 : 40);
    const lines = wrap(L, maxTextW, 15);
    const maxc = Math.floor(this.ch);
    let c = 0;
    for (let j = 0; j < lines.length; j++) {
      const seg = lines[j].slice(0, Math.max(0, maxc - c));
      c += lines[j].length + 1;
      T(seg, textX, boxY + 22 + j * 24, 15, '#f8fafc');
    }

    // Bouncing Golden GBA Arrow Prompt (▼)
    if (this.ch >= L.length && Math.floor(performance.now() / 320) % 2) {
      T('▼ [J]', boxX + boxW - 55, boxY + boxH - 24, 13, '#facc15');
    }
  }
};

/* ================= 9. Title Scene ================= */
const Title = {
  enter() {
    this.t = 0;
    this.stars = [];
    AudioSys.setTrack('hub');
    for (let i = 0; i < 60; i++) {
      this.stars.push({ x: Math.random() * W, y: Math.random() * H, s: rnd(.4, 1.4) });
    }
    this.m = Menu([
      { label: 'New Adventure', fn: () => go(Slots, { mode: 'new' }) },
      { label: 'Continue Journey', enabled: () => Save.has(), fn: () => go(Slots, { mode: 'load' }) },
      { label: 'Export Save (.json)', enabled: () => Save.has(), fn: () => go(Slots, { mode: 'export' }) },
      { label: 'Import Save (.json)', fn: () => $('imp').click() },
      { label: () => 'Music: ' + (AudioSys.musicOn ? 'ON' : 'OFF'), fn: () => AudioSys.toggleMusic() },
      { label: () => 'Touch Gamepad: ' + (document.body.classList.contains('touch') ? 'ON' : 'OFF'), fn: () => setTouch(!document.body.classList.contains('touch')) }
    ], 530, 130, 230, 36);
  },
  update(dt) {
    this.t += dt;
    for (const s of this.stars) {
      s.y += s.s * 8 * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }
    menuStep(this.m);
  },
  draw() {
    // Vibrant GBA Deep Indigo Night Sky
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Pixel stars
    for (const s of this.stars) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // Distant Spire silhouette with glowing runes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(250, H); ctx.lineTo(290, 40); ctx.lineTo(310, 40); ctx.lineTo(350, H);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(298, 40, 4, H); // Core laser

    // GBA Title Logo Banner
    ctx.fillStyle = '#facc15'; ctx.fillRect(40, 56, 380, 5);
    T('ASTRAL SPIRE', 40, 68, 48, '#f8fafc');
    T('CLIMB TO FLOOR 100', 44, 122, 16, '#38bdf8');
    T('Classic GBA / Inotia Pixel Action-RPG Edition', 44, 146, 12, '#94a3b8');

    // Chibi Hero Preview on Title
    drawChibiHero(ctx, 160, 260, {
      guild: 'Aries', element: 'Fire', outfit: '#e11d48', hair: '#18181b', hairStyle: 0
    }, this.t, 'down', true);

    T('Twelve Zodiac Guilds • Guardian Bosses • 100 Floors', 40, H - 45, 12, '#cbd5e1');
    T('Controls: WASD / Joystick to move | J to interact | K to attack', 40, H - 28, 11, '#64748b');

    menuDraw(this.m);
  }
};

/* ================= 10. Save Slots Scene ================= */
const Slots = {
  enter(a) {
    this.mode = a.mode; this.pending = a.data || null; this.armed = 0;
    const self = this, items = [];
    for (let n = 1; n <= 3; n++) {
      items.push({
        label: () => `Slot ${n}`,
        sub: () => {
          const d = Save.read(n);
          return d ? `${d.name} (${d.guild} - ${d.element}) • Floor ${d.floor} • Lv ${d.lvl}` : 'Empty Slot';
        },
        enabled: () => (self.mode === 'load' || self.mode === 'export') ? !!Save.read(n) : true,
        fn: () => self.pick(n)
      });
    }
    items.push({ label: 'Back to Title', fn: () => go(Title) });
    this.m = Menu(items, 150, 110, 500, 56);
  },
  pick(n) {
    if (this.mode === 'load') loadSlot(n);
    else if (this.mode === 'export') exportSave(n);
    else if (this.mode === 'import') {
      Save.write(n, this.pending);
      toast(`Save Imported to Slot ${n}!`);
      go(Title);
    } else {
      G.slot = n;
      go(Create);
    }
  },
  update() {
    if (Input.just('k')) { go(Title); return; }
    menuStep(this.m);
  },
  draw() {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
    const t = { load: 'Continue: Choose Save Slot', 'new': 'New Adventure: Select Slot', 'export': 'Export: Select Slot', 'import': 'Import: Select Target Slot' }[this.mode];
    T(t, W / 2, 45, 24, '#fde047', 'center');
    T('Press K or Tap Back to Return', W / 2, 80, 12, '#94a3b8', 'center');
    menuDraw(this.m);
  }
};

/* ================= 11. Character Creation ================= */
const Create = {
  enter() {
    this.s = { name: 'Kaelen', g: 0, o: 0, h: 0, hs: 0 };
    this.row = 0;
    this.t = 0;
  },
  ask() {
    const v = window.prompt('Name your climber (max 12 letters):', this.s.name);
    Input.reset();
    if (v !== null && v.trim()) this.s.name = v.trim().slice(0, 12);
  },
  change(d) {
    const s = this.s;
    if (this.row === 1) s.g = (s.g + d + 12) % 12;
    else if (this.row === 2) s.o = (s.o + d + 6) % 6;
    else if (this.row === 3) s.h = (s.h + d + 6) % 6;
    else if (this.row === 4) s.hs = (s.hs + d + 6) % 6;
    beep(560, .04);
  },
  begin() {
    const s = this.s, g = GUILDS[s.g], e = ELEM[g[1]];
    G.p = normSave({
      name: s.name, guild: g[0], outfit: s.o, hair: s.h,
      floor: 1, loc: 'hub', lvl: 1, hp: e.hp, sta: e.sta,
      inv: { shards: 25, potions: 2 }
    });
    G.p.hp = e.hp; G.p.sta = e.sta;
    Save.write(G.slot, G.p);
    go(Intro);
  },
  act() {
    if (this.row === 0) this.ask();
    else if (this.row === 5) this.begin();
    else this.change(1);
  },
  update(dt) {
    this.t += dt;
    if (Input.just('up')) this.row = (this.row + 5) % 6;
    if (Input.just('down')) this.row = (this.row + 1) % 6;
    const d = (Input.just('right') ? 1 : 0) - (Input.just('left') ? 1 : 0);
    if (d) this.change(d);
    if (Input.just('j')) this.act();
    if (Input.just('k')) { go(Slots, { mode: 'new' }); return; }
  },
  draw() {
    const s = this.s, g = GUILDS[s.g], e = ELEM[g[1]];
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);

    T('SWEAR YOUR ZODIAC OATH', 24, 20, 24, '#fde047');
    T('Up/Down: Choose Row | Left/Right: Cycle Option | J: Confirm', 24, 50, 11, '#94a3b8');

    const rows = [
      ['Name', s.name],
      ['Zodiac Guild', g[0]],
      ['Cloak Color', OUTFIT_N[s.o]],
      ['Hair Color', HAIR_N[s.h]],
      ['Hairstyle', HAIR_STYLES[s.hs]],
      ['', '★ BEGIN EXPEDITION ★']
    ];

    for (let i = 0; i < 6; i++) {
      const y = 80 + i * 48, sel = this.row === i;
      ctx.fillStyle = sel ? 'rgba(56,189,248,.35)' : 'rgba(30,41,59,.85)';
      ctx.fillRect(20, y, 450, 40);
      ctx.strokeStyle = sel ? '#38bdf8' : '#475569';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(20.5, y + 0.5, 449, 39);

      if (i === 5) {
        T(rows[i][1], 245, y + 12, 16, sel ? '#ffffff' : '#facc15', 'center');
      } else {
        T(rows[i][0], 36, y + 12, 14, '#93c5fd');
        if (i === 0) {
          T(rows[i][1] + '  (click/press to rename)', 160, y + 12, 14, '#fff');
        } else {
          T('< ' + rows[i][1] + ' >', 320, y + 12, 14, '#fff', 'center');
        }
      }
    }

    // Chibi Hero Live Preview Box (Right side)
    panel(500, 20, 270, 400, e.color);
    ctx.fillStyle = '#020617'; ctx.fillRect(510, 30, 250, 140);
    ctx.strokeStyle = '#facc15'; ctx.strokeRect(510.5, 30.5, 249, 139);

    drawChibiHero(ctx, 635, 120, {
      guild: g[0], element: g[1], outfit: OUTFITS[s.o], hair: HAIRS[s.h], hairStyle: s.hs
    }, this.t, 'down', true, 2.2);

    T(g[0] + ' Guild', 635, 185, 20, e.color, 'center');
    T(g[1] + ' Affinity • ' + e.cls, 635, 212, 12, '#93c5fd', 'center');

    const ds = wrap(g[2], 240, 12);
    ds.forEach((l, idx) => T(l, 635, 236 + idx * 16, 12, '#cbd5e1', 'center', false));

    T('Base HP: ' + e.hp + '  |  STA: ' + e.sta, 635, 310, 12, '#fde047', 'center');
    T('ATK: ' + e.atk + '  |  SPD: ' + e.spd, 635, 330, 12, '#fde047', 'center');
    T('Perk: ' + e.perk, 635, 355, 11, '#67e8f9', 'center');
  }
};

/* ================= 12. Intro Narrative ================= */
const Intro = {
  pages: [
    'The sky above the ruined metropolis shattered centuries ago, giving birth to the Astral Spire: a towering monolith of dark steel, shifting biomes, and forgotten technology.',
    'Humanity adapted in its shadow, drawing latent celestial power from constellations to forge the Twelve Zodiac Guilds.',
    'The Spire is an automated testing facility left behind by an unknown creator. Whoever reaches its peak at Floor 100 may claim the artifact that rewrites the stars.',
    'You stand before the heavy blast doors of Floor 1. Four elite climbers wait to greet you: Yuna (Pyromancer), Yuri (Geomancer), Yumi (Aeromancer), and Yuki (Hydromancer).',
    'The hydraulic locks hiss open, venting cold ancient air. Your ascent begins now.'
  ],
  enter() { this.i = 0; this.ch = 0; },
  update(dt) {
    this.ch += dt * 60;
    const L = this.pages[this.i].length;
    if (Input.just('j') || Input.tap) {
      if (this.ch < L) this.ch = L;
      else {
        this.i++; this.ch = 0;
        if (this.i >= this.pages.length) { go(World, 'hub'); return; }
      }
    }
    if (Input.just('k')) go(World, 'hub');
  },
  draw() {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
    wrap(this.pages[this.i], 660, 19).forEach((l, i, a) => {
      let c = 0; for (let k = 0; k < i; k++) c += a[k].length + 1;
      T(l.slice(0, Math.max(0, Math.floor(this.ch) - c)), 70, 110 + i * 32, 19, '#f8fafc');
    });
    T('Press J / Tap: Continue | K: Skip', W / 2, H - 40, 12, '#94a3b8', 'center');
  }
};

/* ================= 13. Guild Skills & Ultimates ================= */
const SKILLS = {
  Aries:       { name: 'Ram Charge',    cost: 20, cd: 7,  desc: 'Charges forward, smashing through all enemies.', run: (w, p, pl, st) => w.dash(170, st.atk * 1.8) },
  Taurus:      { name: 'Stone Guard',   cost: 20, cd: 12, desc: 'Damage immunity shield for 2.5s.', run: (w, p, pl) => { pl.shieldT = 2.5 * w.dur; w.ring(pl.x, pl.y, 48, '#84cc16'); } },
  Gemini:      { name: 'Twin Blades',   cost: 18, cd: 6,  desc: 'Throws two high-velocity piercing blades.', run: (w, p, pl, st) => { const a = Math.atan2(pl.fy, pl.fx); [-0.2, 0.2].forEach(o => w.shoot(a + o, { spd: 400, life: .7, dmg: st.atk * 1.4, r: 6, pierce: true, col: '#06b6d4' })); } },
  Cancer:      { name: 'Tidal Mend',    cost: 25, cd: 12, desc: 'Restores 40% of maximum HP.', run: (w, p, pl, st) => w.heal(st.maxHp * 0.4 * w.dur) },
  Leo:         { name: 'Solar Roar',    cost: 25, cd: 9,  desc: 'Blasts surrounding enemies back with fire.', run: (w, p, pl, st) => w.aoe(115, st.atk * 2.4, 280, '#f97316') },
  Virgo:       { name: 'Circuit Hack',  cost: 20, cd: 10, desc: 'Stuns all nearby enemies for 2.5s.', run: (w) => w.aoe(180, 0, 0, '#84cc16', { stun: 2.5 * w.dur }) },
  Libra:       { name: 'Equilibrium',   cost: 15, cd: 10, desc: 'Shockwave that instantly refills stamina.', run: (w, p, pl, st) => { w.aoe(115, st.atk * 1.4, 180, '#06b6d4'); p.sta = st.maxSta; } },
  Scorpio:     { name: 'Venom Sting',   cost: 18, cd: 7,  desc: 'Poison dart dealing damage over time.', run: (w, p, pl, st) => w.shoot(Math.atan2(pl.fy, pl.fx), { spd: 360, life: .8, dmg: st.atk * 1.1, r: 7, poison: true, col: '#a855f7' }) },
  Sagittarius: { name: 'Star Arrow',    cost: 22, cd: 6,  desc: 'A long piercing celestial starlight arrow.', run: (w, p, pl, st) => w.shoot(Math.atan2(pl.fy, pl.fx), { spd: 680, life: 1.1, dmg: st.atk * 2.8, r: 5, pierce: true, col: '#fde047' }) },
  Capricorn:   { name: 'Summit Stride', cost: 10, cd: 14, desc: 'Refills stamina and +35% speed for 6s.', run: (w, p, pl, st) => { p.sta = st.maxSta; pl.hasteT = 6 * w.dur; pl.hasteM = 1.35; w.ring(pl.x, pl.y, 40, '#84cc16'); } },
  Aquarius:    { name: 'Gale Burst',    cost: 20, cd: 8,  desc: 'Hurls foes away and slows their movement.', run: (w, p, pl, st) => w.aoe(145, st.atk * 1.1, 540, '#06b6d4', { slow: 3 * w.dur }) },
  Pisces:      { name: 'Dream Current',cost: 20, cd: 13, desc: 'Regenerates 12 HP/s for 4s, +20% speed.', run: (w, p, pl) => { pl.regenT = 4 * w.dur; pl.regenR = 12; pl.hasteT = 4 * w.dur; pl.hasteM = 1.2; w.ring(pl.x, pl.y, 44, '#3b82f6'); } }
};

const ULT_LVL = 8, ULT_COST = 35, ULT_CD = 30;
const rankOf = p => p.lvl >= 12 ? 3 : p.lvl >= 6 ? 2 : 1;

const ULTS = {
  Aries:       { name: 'Inferno Rampage',  run: (w, p, pl, st) => w.dash(290, st.atk * 3.2) },
  Taurus:      { name: 'Mountain Fortress', run: (w, p, pl, st) => { pl.shieldT = 5; w.aoe(140, 0, 0, '#84cc16', { stun: 2.2 }); } },
  Gemini:      { name: 'Blade Storm',       run: (w, p, pl, st) => { for (let i = 0; i < 8; i++) w.shoot(i * Math.PI / 4, { spd: 380, life: .8, dmg: st.atk * 1.5, r: 6, pierce: true, col: '#06b6d4' }); } },
  Cancer:      { name: 'Tsunami Blessing',  run: (w, p, pl, st) => { w.heal(st.maxHp * 0.7); pl.regenT = 6; pl.regenR = 8; } },
  Leo:         { name: 'Supernova',         run: (w, p, pl, st) => w.aoe(220, st.atk * 5.2, 450, '#f97316') },
  Virgo:       { name: 'System Crash',      run: (w, p, pl, st) => w.aoe(5000, st.atk * 1.4, 0, '#84cc16', { stun: 3.2 }) },
  Libra:       { name: 'Cosmic Balance',    run: (w, p, pl, st) => { w.aoe(180, st.atk * 2.6, 240, '#06b6d4'); w.heal(st.maxHp * 0.3); p.sta = st.maxSta; } },
  Scorpio:     { name: 'Plague Swarm',      run: (w, p, pl, st) => w.aoe(330, st.atk * 1.6, 90, '#a855f7', { poison: 6 }) },
  Sagittarius: { name: 'Starfall Volley',   run: (w, p, pl, st) => { const a = Math.atan2(pl.fy, pl.fx); for (let i = -2; i <= 2; i++) w.shoot(a + i * 0.16, { spd: 680, life: 1.1, dmg: st.atk * 2.5, r: 5, pierce: true, col: '#fde047' }); } },
  Capricorn:   { name: 'Peak Ascent',       run: (w, p, pl, st) => { pl.shieldT = 3; pl.hasteT = 8; pl.hasteM = 1.5; p.sta = st.maxSta; w.heal(st.maxHp * 0.25); } },
  Aquarius:    { name: 'Tempest',           run: (w, p, pl, st) => w.aoe(240, st.atk * 2.6, 750, '#06b6d4', { slow: 4.5 }) },
  Pisces:      { name: 'Ocean Dream',       run: (w, p, pl) => { pl.regenT = 6; pl.regenR = 15; pl.hasteT = 6; pl.hasteM = 1.35; w.aoe(150, 0, 0, '#3b82f6', { stun: 2 }); } }
};

/* ================= 14. Bosses & Telegraphed Attack AI ================= */
const BOSSES = [
  { name: 'Sentinel Prime', col: '#ef4444', pool: ['volley', 'charge', 'summon'] },
  { name: 'Forge Colossus', col: '#f97316', pool: ['slam', 'rain', 'ring'] },
  { name: 'Void Warden',    col: '#a855f7', pool: ['blink', 'ring', 'volley'] },
  { name: 'Storm Sentinel', col: '#06b6d4', pool: ['charge', 'volley', 'blink'] }
];
const ARCHITECT = { name: 'The Architect', col: '#facc15', pool: ['volley', 'ring', 'charge', 'slam', 'rain', 'summon', 'blink'] };
const bossCfg = f => f === 100 ? ARCHITECT : BOSSES[Math.floor((f / 5 - 1) % 4)];
const aimAt = (w, e) => Math.atan2(w.pl.y - 6 - e.y, w.pl.x - e.x);

const PATTERNS = {
  volley: {
    tele: .55, rec: .6, track: true,
    begin: (w, e) => { e.aim = aimAt(w, e); },
    fire: (w, e) => {
      const shot = () => {
        const a = aimAt(w, e), n = 3 + 2 * (e.phase - 1);
        for (let i = 0; i < n; i++) w.ebullet(e.x, e.y, a + (i - (n - 1) / 2) * .2, 230 + 30 * e.phase, e.dmg * .55, e.col);
        beep(300, .1, 'square', .04);
      };
      shot();
      if (e.phase >= 3) e.q.push({ t: .35, fn: shot });
    }
  },
  ring: {
    tele: .7, rec: .8,
    begin: () => {},
    fire: (w, e) => {
      const ring = (off) => {
        const n = 12 + 4 * (e.phase - 1);
        for (let i = 0; i < n; i++) w.ebullet(e.x, e.y, off + i * 6.283 / n, 175, e.dmg * .5, e.col);
        w.ring(e.x, e.y, 60, e.col);
        beep(220, .15, 'sawtooth', .04);
      };
      const o = rnd(0, 1);
      ring(o);
      if (e.phase >= 2) e.q.push({ t: .45, fn: () => ring(o + .26) });
    }
  },
  charge: {
    tele: .9, rec: .9, track: true,
    begin: (w, e) => { e.aim = aimAt(w, e); },
    fire: (w, e) => {
      const v = 500 + 40 * e.phase;
      e.dvx = Math.cos(e.aim) * v; e.dvy = Math.sin(e.aim) * v;
      beep(120, .4, 'sawtooth', .06);
    }
  },
  slam: {
    tele: 1.05, rec: .7,
    begin: (w, e) => { w.zone(w.pl.x, w.pl.y, 75 + 10 * e.phase, 1.0, e.dmg * 1.3, e.col, 8); },
    fire: () => {}
  },
  rain: {
    tele: .3, rec: 1.6,
    begin: (w, e) => {
      const n = 5 + e.phase * 2;
      w.zone(w.pl.x, w.pl.y, 44, .8, e.dmg * .9, e.col, 0);
      for (let i = 1; i < n; i++) {
        const a = rnd(0, 6.283), r = rnd(40, 240);
        w.zone(clamp(w.pl.x + Math.cos(a) * r, 40, w.W - 40), clamp(w.pl.y + Math.sin(a) * r, 40, w.H - 40), 44, .8 + i * .16, e.dmg * .9, e.col, 0);
      }
    },
    fire: () => {}
  },
  summon: {
    tele: .8, rec: 1,
    begin: (w, e) => { w.ring(e.x, e.y, 70, '#a855f7'); },
    fire: (w, e) => {
      if (w.enemies.length < 9) {
        for (let i = 0; i < 2; i++) w.mkEnemy('drone', e.x + (i ? 40 : -40), e.y + 24);
      }
      beep(260, .2, 'triangle', .05);
    }
  },
  blink: {
    tele: .45, rec: .5,
    begin: () => {},
    fire: (w, e) => {
      for (let t = 0; t < 14; t++) {
        const a = rnd(0, 6.283), x = w.pl.x + Math.cos(a) * 160, y = w.pl.y + Math.sin(a) * 160;
        if (x < 30 || y < 30 || x > w.W - 30 || y > w.H - 30 || w.walls.some(r => x > r.x - 22 && x < r.x + r.w + 22 && y > r.y - 22 && y < r.y + r.h + 22)) continue;
        w.burst(e.x, e.y, e.col, 12);
        e.x = x; e.y = y;
        w.burst(x, y, e.col, 12);
        break;
      }
      PATTERNS.volley.fire(w, e);
    }
  }
};

/* ================= 15. Climber NPCs ================= */
const CLIMBERS = {
  yuna: {
    name: 'Yuna', title: 'Pyromancer', el: 'Fire', portrait: 'yuna', x: 260, y: 220,
    lines: [
      'Hah! Another fresh climber standing before the gates? You feel that heat pulsing through the floor?',
      'That is the Spire testing our resolve. Keep your techno-staff swinging and never hesitate!',
      'Up on Floor 1, those security drones pack red laser optics. Strike them with your 3-hit combo [K] before they charge!'
    ]
  },
  yuri: {
    name: 'Yuri', title: 'Geomancer', el: 'Earth', portrait: 'yuri', x: 380, y: 220,
    lines: [
      '...Stay grounded, climber. The Spire will gladly crush anyone who charges blindly.',
      'Taurus Guild fighters know that survival is measured in patience and posture.',
      'Remember your Dodge Roll [Space / D button]: it grants invulnerability frames through laser rings!'
    ]
  },
  yumi: {
    name: 'Yumi', title: 'Aeromancer', el: 'Air', portrait: 'yumi', x: 580, y: 220,
    lines: [
      'Hey there, rookie! Think you have what it takes to reach Floor 100 with me?',
      'Gemini climbers stay light on our feet. Those drones turn slowly—roll behind them and strike their weak core!',
      'Once all drones are cleared on a floor, the golden elevator activates. Keep moving!'
    ]
  },
  yuki: {
    name: 'Yuki', title: 'Hydromancer', el: 'Water', portrait: 'yuki', x: 700, y: 220,
    lines: [
      'Welcome, newly awakened. You have traveled far. Rest here in the Sanctuary: our wounds mend freely here.',
      'Beyond these doors, every anomaly is hostile. Take this emergency potion for your climb.',
      'Visit the Merchant stall to forge permanent weapon and armor enhancements with your shards!'
    ]
  }
};

/* ================= 16. Chibi Character & Monster Renderers ================= */
function drawChibiHero(ctx, px, py, p, t, facing = 'down', isMoving = false, scale = 1.0, atkT = 0, atkDur = 0.3) {
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(scale, scale);

  const step = isMoving ? Math.floor(t * 8) % 4 : 0;
  const bob = isMoving ? (step % 2 === 1 ? -1 : 0) : Math.sin(t * 3) * 0.8;
  const legOffset = isMoving ? (step === 1 ? -2 : (step === 3 ? 2 : 0)) : 0;

  // Soft oval drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Adventurer boots with cuffs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-7, 8 + legOffset, 5, 6 - legOffset);
  ctx.fillRect(2, 8 - legOffset, 5, 6 + legOffset);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-7, 8, 5, 2); ctx.fillRect(2, 8, 5, 2);

  // Cloak / Cape (Flutters dynamically behind hero with physics)
  const capeSway = isMoving ? Math.sin(t * 12) * 3.5 : Math.sin(t * 2.5) * 1.2;
  ctx.fillStyle = p.outfit || '#e11d48';
  if (facing !== 'up') {
    ctx.beginPath();
    ctx.moveTo(-9, -4 + bob);
    ctx.lineTo(-11 + capeSway, 10 + bob);
    ctx.lineTo(11 + capeSway, 10 + bob);
    ctx.lineTo(9, -4 + bob);
    ctx.closePath();
    ctx.fill();
  }

  // Tunic & Leather Armor Body
  ctx.fillStyle = '#1e293b'; ctx.fillRect(-7, -6 + bob, 14, 12);
  ctx.fillStyle = p.outfit || '#e11d48'; ctx.fillRect(-5, -6 + bob, 10, 10);
  ctx.fillStyle = '#d97706'; ctx.fillRect(-6, 2 + bob, 12, 2); // Leather Belt
  ctx.fillStyle = '#facc15'; ctx.fillRect(-2, 1 + bob, 4, 4); // Gold Buckle

  // Elemental Crest on Chest
  const elColor = (p.element && ELEM[p.element]) ? ELEM[p.element].color : (p.elc || '#38bdf8');
  ctx.fillStyle = elColor;
  ctx.fillRect(-2, -3 + bob, 4, 4);

  // Cape in front when facing Up
  if (facing === 'up') {
    ctx.fillStyle = p.outfit || '#e11d48';
    ctx.beginPath();
    ctx.moveTo(-8, -4 + bob);
    ctx.lineTo(-10 + capeSway, 10 + bob);
    ctx.lineTo(10 + capeSway, 10 + bob);
    ctx.lineTo(8, -4 + bob);
    ctx.closePath();
    ctx.fill();
  }

  // Chibi Head & Anime Face
  ctx.fillStyle = '#fed7aa'; ctx.fillRect(-8, -20 + bob, 16, 14); // Skin
  ctx.fillStyle = '#fca5a5'; ctx.fillRect(-7, -11 + bob, 3, 2); ctx.fillRect(4, -11 + bob, 3, 2); // Rosy blush

  if (facing === 'up') {
    ctx.fillStyle = p.hair || '#18181b';
    ctx.fillRect(-8, -22 + bob, 16, 16);
  } else {
    // Big Expressive Anime Eyes with Highlights & Realistic Blinking
    const blink = Math.floor(t * 1.5) % 8 === 0;
    if (blink) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -14 + bob, 4, 1.5); ctx.fillRect(2, -14 + bob, 4, 1.5);
    } else {
      ctx.fillStyle = '#0284c7';
      if (facing === 'down') {
        ctx.fillRect(-6, -15 + bob, 4, 5); ctx.fillRect(2, -15 + bob, 4, 5);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-5, -14 + bob, 3, 3); ctx.fillRect(3, -14 + bob, 3, 3);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-5, -15 + bob, 2, 2); ctx.fillRect(3, -15 + bob, 2, 2);
      } else if (facing === 'left') {
        ctx.fillRect(-7, -15 + bob, 4, 5);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-6, -14 + bob, 3, 3);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -15 + bob, 2, 2);
      } else if (facing === 'right') {
        ctx.fillRect(3, -15 + bob, 4, 5);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(3, -14 + bob, 3, 3);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(3, -15 + bob, 2, 2);
      }
    }
  }

  // Layered Pixel Hair with Highlight Sheen
  ctx.fillStyle = p.hair || '#18181b';
  ctx.fillRect(-9, -24 + bob, 18, 7); // Hair crown
  ctx.fillRect(-10, -20 + bob, 3, 10); ctx.fillRect(7, -20 + bob, 3, 10); // Sideburns
  if (facing !== 'up') {
    ctx.fillRect(-6, -18 + bob, 4, 3); ctx.fillRect(1, -18 + bob, 4, 3); // Front bangs
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; ctx.fillRect(-6, -23 + bob, 12, 2); // Hair highlight

  // ================= DYNAMIC WEAPON SWINGING & VISIBLE BLADE =================
  const isAttacking = atkT > 0;
  if (isAttacking) {
    const progress = clamp(1 - atkT / (atkDur || 0.3), 0, 1);
    let baseAngle = 0;
    if (facing === 'down') baseAngle = Math.PI / 2;
    else if (facing === 'up') baseAngle = -Math.PI / 2;
    else if (facing === 'left') baseAngle = Math.PI;
    else if (facing === 'right') baseAngle = 0;

    // Swing from -1.1 rad to +1.1 rad across facing direction
    const swingAngle = baseAngle - 1.1 + progress * 2.2;
    const hx = Math.cos(baseAngle) * 4;
    const hy = Math.sin(baseAngle) * 4;
    const bladeLen = 22;

    ctx.save();
    ctx.translate(hx, hy + bob);
    ctx.rotate(swingAngle);

    // Metallic Blade
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -2, bladeLen, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, bladeLen - 2, 2);
    // Elemental Guard
    ctx.fillStyle = elColor;
    ctx.fillRect(0, -5, 4, 10);
    // Pommel & Hilt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, -1.5, 6, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-7, -2, 2, 4);
    ctx.restore();

    // Glowing Crescent Elemental Slash Arc Trail
    ctx.save();
    ctx.strokeStyle = elColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85 * (1 - progress);
    ctx.beginPath();
    ctx.arc(hx, hy + bob, bladeLen + 4, swingAngle - 0.7, swingAngle + 0.3);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hx, hy + bob, bladeLen + 3, swingAngle - 0.5, swingAngle + 0.2);
    ctx.stroke();

    // Spark Burst at Blade Tip
    const tipX = hx + Math.cos(swingAngle) * bladeLen;
    const tipY = hy + bob + Math.sin(swingAngle) * bladeLen;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(tipX - 2, tipY - 2, 4, 4);
    ctx.fillStyle = elColor; ctx.fillRect(tipX - 1, tipY - 1, 2, 2);
    ctx.restore();
  } else {
    // When Idle or Moving: Hero holds weapon ready in hand with glowing elemental gem guard!
    const wx = facing === 'left' ? -13 : 10;
    const wy = -1 + bob;
    // Blade
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(wx, wy - 9, 3, 17);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(wx + 2, wy - 9, 1, 17);
    // Elemental Crossguard
    ctx.fillStyle = elColor; ctx.fillRect(wx - 2, wy - 2, 7, 3);
    // Pommel
    ctx.fillStyle = '#facc15'; ctx.fillRect(wx - 0.5, wy - 11, 4, 3);
    // Leather Wrapped Grip
    ctx.fillStyle = '#78350f'; ctx.fillRect(wx, wy - 8, 3, 6);
  }

  ctx.restore();
}

function drawSlime(ctx, x, y, e, t) {
  ctx.save();
  ctx.translate(x, y);

  // Squish and stretch hopping animation
  const hop = Math.abs(Math.sin(t * 8 + e.ph));
  const squishX = 1 + (1 - hop) * 0.3;
  const squishY = 1 - (1 - hop) * 0.3;
  const hopY = -hop * 10;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 7, 10 * squishX, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, hopY);
  ctx.scale(squishX, squishY);

  // Cute Bouncy Translucent Jelly Body
  const isHit = e.flash > 0;
  ctx.fillStyle = isHit ? '#ffffff' : '#22c55e';
  ctx.beginPath();
  ctx.arc(0, 0, 11, Math.PI, 0);
  ctx.quadraticCurveTo(11, 6, 0, 6);
  ctx.quadraticCurveTo(-11, 6, -11, 0);
  ctx.fill();
  ctx.strokeStyle = '#15803d'; ctx.lineWidth = 1.5; ctx.stroke();

  // Shiny Specular Highlight Bubble
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-4, -5, 3, 1.8, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Cute Smiling Eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-5, -2, 2.5, 3); ctx.fillRect(2.5, -2, 2.5, 3);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-5, -2, 1, 1); ctx.fillRect(2.5, -2, 1, 1);

  ctx.restore();
}

function drawDrone(ctx, x, y, e, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 6 + e.ph) * 3);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brass & Iron Steampunk Shell
  const isHit = e.flash > 0;
  ctx.fillStyle = isHit ? '#ffffff' : '#475569';
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5; ctx.stroke();

  // Spinning Brass Rotor on Top
  const rotorW = Math.cos(t * 28) * 16;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-rotorW / 2, -15, rotorW, 2.5);
  ctx.fillStyle = '#78350f'; ctx.fillRect(-1.5, -14, 3, 4);

  // Glowing Blue Water Core
  ctx.fillStyle = '#0284c7';
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(-1, -1, 3, 0, Math.PI * 2); ctx.fill();

  // Pulsing Red Cyclops Eye
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(0, -5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-0.5, -5.5, 1, 1);

  ctx.restore();
}

function drawGolem(ctx, x, y, e, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * 1.5);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const isHit = e.flash > 0;
  // Heavy Chiseled Stone Body
  ctx.fillStyle = isHit ? '#ffffff' : '#334155';
  ctx.fillRect(-14, -12, 28, 24);
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.strokeRect(-14, -12, 28, 24);

  // Moss & Stone cracks
  ctx.fillStyle = '#15803d'; ctx.fillRect(-10, -8, 6, 4); ctx.fillRect(4, 4, 8, 3);

  // Glowing Magma Core
  ctx.fillStyle = '#ea580c'; ctx.fillRect(-4, -4, 8, 8);
  ctx.fillStyle = '#fde047'; ctx.fillRect(-2, -2, 4, 4);

  // Stone Head with Glowing Red Slit Eyes
  ctx.fillStyle = isHit ? '#ffffff' : '#475569';
  ctx.fillRect(-9, -22, 18, 10);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(-6, -17, 4, 2); ctx.fillRect(2, -17, 4, 2);

  // Heavy Fists
  ctx.fillStyle = '#1e293b'; ctx.fillRect(-19, -4, 6, 14); ctx.fillRect(13, -4, 6, 14);

  ctx.restore();
}

function drawBoss(ctx, x, y, e, t) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const isHit = e.flash > 0;
  // Multi-Tile Colossal Armored Guardian
  ctx.fillStyle = isHit ? '#ffffff' : '#1e293b';
  ctx.fillRect(-24, -20, 48, 42);
  ctx.strokeStyle = e.col || '#ef4444'; ctx.lineWidth = 3; ctx.strokeRect(-24, -20, 48, 42);

  // Armor Plates & Golden Filigree
  ctx.fillStyle = '#d97706'; ctx.fillRect(-20, -16, 40, 4); ctx.fillRect(-20, 16, 40, 4);

  // Core Reactor Chamber
  ctx.fillStyle = e.col || '#ef4444';
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();

  // Crowned Head
  ctx.fillStyle = isHit ? '#ffffff' : '#334155';
  ctx.fillRect(-14, -36, 28, 16);
  ctx.fillStyle = '#facc15'; ctx.fillRect(-16, -42, 32, 6); // Crown

  // Glowing Optic Visor
  ctx.fillStyle = e.col || '#ef4444'; ctx.fillRect(-10, -30, 20, 4);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -30, 4, 4);

  // Phase indicator orbs
  for (let p = 0; p < e.phase; p++) {
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(-8 + p * 8, -48, 3, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawAnomaly(ctx, x, y, e, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 5 + e.ph) * 3);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const isHit = e.flash > 0;
  // Dark Celestial Void Body
  const pulse = Math.sin(t * 7 + e.ph) * 2;
  ctx.fillStyle = isHit ? '#ffffff' : '#1e1b4b';
  ctx.beginPath(); ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; ctx.stroke();

  // Swirling Cosmic Aura
  ctx.fillStyle = '#6366f1';
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(Math.cos(t * 4) * 2, Math.sin(t * 4) * 2, 4, 0, Math.PI * 2); ctx.fill();

  // Pulsing Optic Core
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-1.5, -1.5, 3, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.5, -0.5, 1, 1);

  // Orbital Energy Shards
  for (let i = 0; i < 3; i++) {
    const a = t * 3 + (i * Math.PI * 2 / 3);
    const ox = Math.cos(a) * 16;
    const oy = Math.sin(a) * 12;
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
  }

  ctx.restore();
}

function drawEnemy(ctx, e, t) {
  if (e.type === 'boss') {
    drawBoss(ctx, e.x, e.y, e, t);
  } else if (e.type === 'drone') {
    drawDrone(ctx, e.x, e.y, e, t);
  } else if (e.type === 'slime') {
    drawSlime(ctx, e.x, e.y, e, t);
  } else if (e.type === 'golem') {
    drawGolem(ctx, e.x, e.y, e, t);
  } else if (e.type === 'anomaly') {
    drawAnomaly(ctx, e.x, e.y, e, t);
  } else {
    drawDrone(ctx, e.x, e.y, e, t);
  }
}

/* ================= 17. World Engine (Hub & 100 Floors) ================= */
const World = {
  enter(mode) {
    const p = G.p, st = sx(p);
    Object.assign(this, {
      mode, t: 0, walls: [], ints: [], enemies: [], fx: [], texts: [],
      menu: null, paused: false, pm: null, cleared: false, banner: 0,
      shake: 0, atkId: 0, dur: 1
    });

    this.pl = {
      x: 0, y: 0, w: 12, h: 10, fx: 0, fy: 1,
      atkT: 0, atkCd: 0, combo: 0, comboT: 0,
      inv: 0, regenD: 0, moving: false, kx: 0, ky: 0, kbT: 0,
      skCd: 0, shieldT: 0, hasteT: 0, hasteM: 1, regenT: 0, regenR: 0,
      dashT: 0, dvx: 0, dvy: 0, dashId: 0, dashCd: 0,
      ultCd: 0, lHold: 0, lFired: false
    };

    this.proj = [];
    this.rings = [];
    this.eb = [];
    this.zones = [];

    const pl = this.pl, self = this;

    if (mode === 'hub') {
      AudioSys.setTrack('hub');
      this.W = 960; this.H = 540;
      p.hp = st.maxHp; p.sta = st.maxSta; p.loc = 'hub';
      pl.x = 480; pl.y = 440;

      // Walls that leave a completely open 90px doorway threshold in the blast gateway
      this.walls.push(
        { x: 370, y: 10, w: 65, h: 50 },  // Left arch flank
        { x: 525, y: 10, w: 65, h: 50 },  // Right arch flank
        { x: 95, y: 250, w: 100, h: 36 }, // Merchant stall
        { x: 770, y: 250, w: 90, h: 36 },  // Bounty board
        { x: 300, y: 360, w: 30, h: 30 },
        { x: 630, y: 360, w: 30, h: 30 }
      );

      // Gateway interactable zone
      this.ints.push({ x: 480, y: 70, r: 65, label: 'Enter Floor ' + p.floor, fn: () => self.enterFloor() });

      // Four Elite Climber NPCs
      for (const k in CLIMBERS) {
        const c = CLIMBERS[k];
        this.ints.push({ x: c.x, y: c.y + 4, r: 36, label: 'Talk to ' + c.name, fn: () => self.talk(k) });
      }

      this.ints.push({ x: 145, y: 312, r: 48, label: 'Merchant', fn: () => self.openShop() });
      this.ints.push({ x: 815, y: 312, r: 48, label: 'Bounty Board', fn: () => self.board() });

      this.banner = 3;
      this.bannerText = (p.floor > 1 ? 'Sanctuary Outpost' : 'Entrance Sanctuary') + ' • Floor ' + p.floor + ' Ahead';
      autosave();

      if (p.floor === 1 && !p.flags.yuna && !p.flags.yuri && !p.flags.yumi && !p.flags.yuki) {
        Dlg.say('Yuna', '#ef4444', [
          'Welcome to the Spire, rookie! You feel that heat pulsing beneath the metal?',
          'That is the testing facility measuring our resolve. The Fire Guilds strike hard and never flinch.',
          'Talk with the four of us, then step right through the glowing stone gateway at the top to enter Floor 1!'
        ], 'yuna');
      }
    } else {
      // 100 Dungeon Floors Engine
      const f = p.floor;
      const isBoss = f % 5 === 0;
      const bi = Math.floor((f - 1) / 5) % 3;
      const bio = BIOMES[bi];
      this.bio = bio;
      this.W = 1400; this.H = 900;
      p.loc = 'floor';
      pl.x = 90; pl.y = this.H - 90;
      p.hp = Math.min(p.hp, st.maxHp);
      p.sta = st.maxSta;

      AudioSys.setTrack(isBoss ? 'boss' : 'floor');

      this.stairs = { x: this.W - 130, y: 40, w: 70, h: 50 };
      const rng = mulberry(f * 7919 + 13), nW = 10 + bio.extra;

      for (let a = 0, n = 0; n < nW && a < 200; a++) {
        const w = 40 + rng() * 120, h = 40 + rng() * 120, x = rng() * (this.W - w), y = rng() * (this.H - h);
        if (x < 280 && y > this.H - 280) continue;
        if (x + w > this.W - 280 && y < 220) continue;
        this.walls.push({ x, y, w, h });
        n++;
      }

      const count = 4 + Math.min(8, Math.floor(f / 2)) + (bi ? 1 : 0) - (isBoss ? 2 : 0);

      const spawn = (type) => {
        for (let t = 0; t < 80; t++) {
          const x = 100 + Math.random() * (this.W - 200);
          const y = 100 + Math.random() * (this.H - 200);
          if (Math.hypot(x - pl.x, y - pl.y) < 320) continue;
          if (this.walls.some(r => x > r.x - 24 && x < r.x + r.w + 24 && y > r.y - 24 && y < r.y + r.h + 24)) continue;
          if (x > this.stairs.x - 80 && y < 160) continue;

          const boss = type === 'boss', isSlime = type === 'slime', isGolem = type === 'golem', isAnomaly = type === 'anomaly';
          this.enemies.push({
            type, x, y,
            w: boss ? 36 : (isGolem ? 26 : (isSlime ? 18 : (isAnomaly ? 20 : 16))),
            h: boss ? 36 : (isGolem ? 26 : (isSlime ? 16 : (isAnomaly ? 20 : 16))),
            hp: boss ? (f === 100 ? 2400 : 160 + f * 14) : (isGolem ? 40 + f * 3.5 : (isSlime ? 24 + f * 2.5 : (isAnomaly ? 28 + f * 2.8 : 18 + f * 2.2))),
            max: 0,
            spd: boss ? 60 : (isGolem ? 45 : (isSlime ? 65 : (isAnomaly ? 70 : 60 + Math.min(28, f * .4)))),
            dmg: boss ? 16 + f * .5 : (isGolem ? 12 + f * .45 : (isSlime ? 7 + f * .35 : (isAnomaly ? 10 + f * .4 : 8 + f * .35))),
            xp: boss ? 45 + f * 3 : (isGolem ? 12 + f : (isSlime ? 7 + f : (isAnomaly ? 10 + f * 1.2 : 8 + f))),
            wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0,
            ph: Math.random() * 6
          });

          const e = this.enemies[this.enemies.length - 1];
          e.max = e.hp;
          if (boss) this.initBoss(e, f);
          return;
        }
      };

      for (let i = 0; i < count; i++) {
        let t = 'slime';
        const r = (i + f) % 4;
        if (r === 0) t = 'drone';
        else if (r === 1) t = 'slime';
        else if (r === 2) t = 'anomaly';
        else t = (f >= 2 ? 'golem' : 'drone');
        spawn(t);
      }

      if (isBoss) spawn('boss');
      this.total = this.enemies.length;
      this.banner = 3.2;
      this.bannerText = 'Floor ' + f + ' • ' + bio.name + (isBoss ? ' • ' + bossCfg(f).name : '');
      autosave();
    }
  },

  talk(k) {
    const c = CLIMBERS[k], p = G.p, ec = ELEM[c.el].color, lines = c.lines.slice();
    if (p.element === c.el) lines.push('A fellow ' + c.el + ' affinity climber! Our power draws from the exact same constellation.');
    if (p.floor > 1) lines.push('You reached Floor ' + p.floor + ' already? Impressive climb, ' + p.name + '!');
    if (!p.flags[k]) { lines.push('Here, take this field potion. Consider it an alliance for your climb!'); }
    Dlg.say(c.name + ' (' + c.title + ')', ec, lines, c.portrait, () => {
      if (!p.flags[k]) {
        p.flags[k] = true;
        p.inv.potions++;
        toast('★ +1 Field Potion from ' + c.name);
        beep(880, .1);
      }
    });
  },

  board() {
    const p = G.p, b = p.bounty;
    if (b.have >= b.need) {
      Dlg.say('Bounty Notice Board', '#facc15', [
        'Guild Bounty Complete! ' + b.need + ' Spire drones & slimes neutralized.',
        'The Zodiac brokers deliver 75 Elemental Shards and 35 EXP into your pouch!'
      ], 'merchant', () => {
        p.inv.shards += 75;
        this.gainXp(35);
        b.done++;
        b.have = 0;
        b.need = 5 + b.done * 3;
        autosave();
      });
    } else {
      Dlg.say('Bounty Notice Board', '#facc15', [
        'Active Zodiac Guild Bounty: Neutralize ' + b.need + ' monsters in the Spire.',
        'Current Progress: ' + b.have + '/' + b.need + ' cleared.',
        'Reward: 75 Shards + 35 EXP. Scavenged bones sell for 5, circuits sell for 8 at the merchant!'
      ], 'merchant');
    }
  },

  openShop() {
    const p = G.p, up = p.upgrades, self = this;
    const wCost = 50 + up.weapon * 25, aCost = 60 + up.armor * 30, sCost = 45 + up.stamina * 20;
    this.menu = Menu([
      {
        label: () => `Sell Monster Loot (+${p.inv.bones * 5 + p.inv.circuits * 8} shards)`,
        sub: () => `${p.inv.bones} bones (5 ea), ${p.inv.circuits} circuits (8 ea)`,
        enabled: () => p.inv.bones + p.inv.circuits > 0,
        fn: () => {
          const g = p.inv.bones * 5 + p.inv.circuits * 8;
          p.inv.shards += g;
          p.inv.bones = p.inv.circuits = 0;
          toast('★ Sold Loot for +' + g + ' Shards!');
          autosave();
        }
      },
      {
        label: 'Buy Field Potion (30 shards)',
        sub: () => `Stock: ${p.inv.potions} / 99 in pouch`,
        enabled: () => p.inv.shards >= 30,
        fn: () => {
          p.inv.shards -= 30;
          p.inv.potions++;
          let potSlot = p.bag.find(it => it && it.id === 'potion');
          if (potSlot) { potSlot.count++; }
          else {
            let emptyIdx = p.bag.indexOf(null);
            if (emptyIdx >= 0) p.bag[emptyIdx] = { id: 'potion', name: 'Field Potion', count: 1, icon: '🧪' };
          }
          toast('★ Potion added to Bag!');
          autosave();
        }
      },
      {
        label: () => p.bagCapacity >= 27 ? '★ Maximum Bag Capacity (27 Slots)' : `Expand Bag Pouch (+9 Slots) [${p.bagCapacity === 9 ? 60 : 120} shards]`,
        sub: () => p.bagCapacity >= 27 ? 'Your Stardew backpack is fully expanded!' : `Expands bag storage (${p.bagCapacity} -> ${p.bagCapacity + 9} slots)`,
        enabled: () => p.bagCapacity < 27 && p.inv.shards >= (p.bagCapacity === 9 ? 60 : 120),
        fn: () => {
          const cost = p.bagCapacity === 9 ? 60 : 120;
          p.inv.shards -= cost;
          p.bagCapacity += 9;
          for (let i = 0; i < 9; i++) p.bag.push(null);
          toast(`★ Bag Expanded to ${p.bagCapacity} Slots!`);
          beep(1040, .25, 'triangle', .1);
          autosave();
        }
      },
      {
        label: () => `Forge: Weapon Tuning [Lv ${up.weapon} -> ${up.weapon + 1}] (${wCost} shards)`,
        sub: () => '+3 Attack Damage permanently',
        enabled: () => p.inv.shards >= wCost,
        fn: () => {
          p.inv.shards -= wCost;
          up.weapon++;
          toast('★ Weapon Forged! ATK +3');
          beep(880, .15, 'triangle', .08);
          autosave();
        }
      },
      {
        label: () => `Forge: Nano-Armor [Lv ${up.armor} -> ${up.armor + 1}] (${aCost} shards)`,
        sub: () => '+20 Max HP permanently',
        enabled: () => p.inv.shards >= aCost,
        fn: () => {
          p.inv.shards -= aCost;
          up.armor++;
          toast('★ Armor Reinforced! Max HP +20');
          beep(880, .15, 'triangle', .08);
          autosave();
        }
      },
      {
        label: () => `Forge: Capacitors [Lv ${up.stamina} -> ${up.stamina + 1}] (${sCost} shards)`,
        sub: () => '+15 Max Stamina permanently',
        enabled: () => p.inv.shards >= sCost,
        fn: () => {
          p.inv.shards -= sCost;
          up.stamina++;
          toast('★ Capacitors Upgraded! Max Stamina +15');
          beep(880, .15, 'triangle', .08);
          autosave();
        }
      },
      {
        label: 'Leave Counter',
        fn: () => { self.menu = null; }
      }
    ], 130, 80, 540, 50);
  },

  enterFloor() {
    go(World, 'floor');
  },

  gainXp(n) {
    const p = G.p, l0 = p.lvl, r0 = rankOf(p);
    p.xp += n;
    while (p.xp >= p.lvl * 35) {
      p.xp -= p.lvl * 35;
      p.lvl++;
      const st = sx(p);
      p.hp = st.maxHp;
      p.sta = st.maxSta;
    }
    if (p.lvl > l0) {
      const m = ['★ Level Up! Lv ' + p.lvl];
      if (rankOf(p) > r0) m.push('Skill Rank ' + ['I', 'II', 'III'][rankOf(p) - 1] + '!');
      if (l0 < ULT_LVL && p.lvl >= ULT_LVL) m.push('Ultimate Unlocked (Hold L)');
      toast(m.join(' • '));
      beep(1040, .25, 'triangle', .06);
    }
  },

  getBagItemCount() {
    const p = G.p;
    if (!p || !p.bag) return 0;
    return p.bag.filter(item => item !== null).length;
  },

  openBagScreen() {
    this.inBagScreen = true;
    this.bagCursor = 0;
    this.bagMovingFrom = -1;
    this.bagActionMenu = null;
    beep(600, .05, 'triangle', .05);
  },

  closeBagScreen() {
    this.inBagScreen = false;
    this.bagMovingFrom = -1;
    this.bagActionMenu = null;
    beep(440, .05, 'triangle', .05);
  },

  drinkPotionFromSlot(slotIdx) {
    const p = G.p, st = sx(p);
    const item = p.bag[slotIdx];
    if (item && item.id === 'potion') {
      if (p.hp >= st.maxHp) {
        toast('HP is already full!');
        beep(300, .08, 'square', .04);
        return;
      }
      item.count--;
      const healAmt = (p.element === 'Water' ? 90 : 60);
      if (item.count <= 0) {
        p.bag[slotIdx] = null;
      }
      p.inv.potions = p.bag.reduce((s, it) => s + (it && it.id === 'potion' ? it.count : 0), 0);
      toast('+' + healAmt + ' HP Restored!');
      this.heal(healAmt);
      beep(880, .15, 'sine', .08);
      haptic(20);
      autosave();
    }
  },

  pauseMenu() {
    const self = this, p = G.p;
    return Menu([
      { label: 'Resume Expedition', fn: () => { self.paused = false; } },
      {
        label: () => `🎒 Bag / Inventory (${self.getBagItemCount()}/${p.bagCapacity})`,
        sub: () => 'Open Stardew-style Backpack: Arrange slots & drink potions',
        fn: () => { self.openBagScreen(); }
      },
      {
        label: () => AudioSys.musicOn ? 'Music: ON' : 'Music: OFF',
        sub: () => 'Toggle 16-Bit Chiptune Soundtrack (Hotkey: M)',
        fn: () => {
          AudioSys.toggleMusic();
          beep(660, .05);
        }
      },
      { label: 'Save Game', fn: () => { autosave(); beep(700, .1); } },
      { label: 'Return to Title', fn: () => { self.paused = false; go(Title); } }
    ], W / 2 - 190, 110, 380, 48);
  },

  nearest() {
    let best = null, bd = 1e9;
    for (const i of this.ints) {
      const d = Math.hypot(this.pl.x - i.x, this.pl.y - i.y);
      if (d < i.r && d < bd) { bd = d; best = i; }
    }
    return best;
  },

  floatText(x, y, s, c) { this.texts.push({ x, y, s, c, t: 0.9 }); },
  burst(x, y, c, n) { for (let i = 0; i < n; i++) this.fx.push({ x, y, vx: rnd(-75, 75), vy: rnd(-90, 30), t: rnd(.3, .65), c }); },

  advance() {
    const p = G.p, f = p.floor;
    p.best = Math.max(p.best, f);
    if (f >= 100) { go(Victory); return; }
    p.floor = f + 1;
    beep(660, .2, 'triangle', .05);
    go(World, f % 5 === 0 ? 'hub' : 'floor');
  },

  hurtEnemy(e, dmg, dx, dy, kb, col, isCrit = false) {
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg;
    e.flash = .12;
    const m = Math.hypot(dx, dy) || 1;
    if (e.type === 'boss') kb = 0;
    if (kb > 0) {
      e.kbT = .15;
      e.kx = dx / m * kb;
      e.ky = dy / m * kb;
    }
    this.floatText(e.x, e.y - 12, (isCrit ? 'CRIT! ' : '') + dmg, isCrit ? '#fde047' : (col || '#fff'));
    this.burst(e.x, e.y, isCrit ? '#fde047' : (col || '#fff'), isCrit ? 8 : 4);
    AudioSys.playHit(isCrit);
    if (e.hp <= 0 && !e.dead) this.killEnemy(e);
  },

  ring(x, y, r, col) { this.rings.push({ x, y, r, t: .35, max: .35, col }); },
  shoot(a, o) {
    const pl = this.pl;
    this.proj.push(Object.assign({ x: pl.x, y: pl.y - 8, vx: Math.cos(a) * o.spd, vy: Math.sin(a) * o.spd, hit: [] }, o));
    beep(420, .08, 'triangle', .04);
  },

  aoe(r, dmg, kb, col, o = {}) {
    const pl = this.pl;
    this.ring(pl.x, pl.y - 8, r, col);
    beep(150, .2, 'sawtooth', .05);
    for (const e of this.enemies.slice()) {
      const dx = e.x - pl.x, dy = e.y - (pl.y - 8);
      if (e.dead || Math.hypot(dx, dy) > r + e.w / 2) continue;
      if (o.stun) {
        if (e.type === 'boss') this.floatText(e.x, e.y - 20, 'Immune', '#ccc');
        else { e.stun = o.stun; e.flash = .15; }
      }
      if (o.slow && e.type !== 'boss') e.slow = o.slow;
      if (o.poison) { e.poison = o.poison; e.pt = .5; }
      if (dmg > 0) this.hurtEnemy(e, dmg, dx, dy || 1, kb, col);
    }
  },

  heal(n) {
    const p = G.p, st = sx(p);
    p.hp = Math.min(st.maxHp, p.hp + n);
    this.ring(this.pl.x, this.pl.y - 8, 42, '#22c55e');
    this.floatText(this.pl.x, this.pl.y - 30, '+' + Math.round(n) + ' HP', '#22c55e');
    beep(900, .2, 'sine', .05);
  },

  dash(dist, dmg) {
    const pl = this.pl;
    pl.dashT = .18;
    pl.dvx = pl.fx * dist / .18;
    pl.dvy = pl.fy * dist / .18;
    pl.dashId++;
    pl.dashDmg = dmg;
    pl.inv = Math.max(pl.inv, .3);
    pl.dashHit = [];
    AudioSys.playDash();
    haptic(20);
  },

  dodgeRoll() {
    const p = G.p, pl = this.pl;
    if (p.sta < 12 || pl.dashCd > 0) return;
    p.sta -= 12;
    pl.dashCd = 0.45;
    pl.inv = 0.24;
    pl.dashT = 0.20;
    const speed = 340;
    pl.dvx = pl.fx * speed;
    pl.dvy = pl.fy * speed;
    pl.dashDmg = 0;
    pl.dashHit = [];
    AudioSys.playDash();
    haptic(15);
  },

  castSkill() {
    const p = G.p, pl = this.pl, st = sx(p), sk = SKILLS[p.guild], r = rankOf(p);
    if (pl.skCd > 0) { toast(sk.name + ' charging (' + Math.ceil(pl.skCd) + 's)'); return; }
    if (p.sta < sk.cost) { toast('Need ' + sk.cost + ' stamina for ' + sk.name); return; }
    this.dur = 1 + 0.25 * (r - 1);
    p.sta -= sk.cost;
    pl.skCd = sk.cd * (1 - 0.12 * (r - 1));
    pl.regenD = .7;
    sk.run(this, p, pl, Object.assign({}, st, { atk: st.atk * (1 + 0.35 * (r - 1)) }));
    toast(sk.name + '!');
    haptic(25);
  },

  castUlt() {
    const p = G.p, pl = this.pl, st = sx(p), u = ULTS[p.guild];
    if (pl.ultCd > 0) { toast(u.name + ' charging (' + Math.ceil(pl.ultCd) + 's)'); return; }
    if (p.sta < ULT_COST) { toast('Need ' + ULT_COST + ' stamina for ' + u.name); return; }
    this.dur = 1;
    p.sta -= ULT_COST;
    pl.ultCd = ULT_CD;
    pl.regenD = 1;
    this.shake = .28;
    u.run(this, p, pl, st);
    toast('ULTIMATE: ' + u.name + '!');
    beep(90, .4, 'sawtooth', .06);
    haptic(40);
  },

  initBoss(e, f) {
    const c = bossCfg(f);
    Object.assign(e, {
      bname: c.name, col: c.col, pool: c.pool.slice(),
      state: 'idle', st: 1, phase: 1, pat: null, q: [],
      active: false, aim: 0, dvx: 0, dvy: 0, aimTrack: false
    });
  },

  mkEnemy(type, x, y) {
    const f = G.p.floor;
    const e = {
      type, x, y,
      w: 18, h: 18,
      hp: 24 + f * 2.5,
      max: 0,
      spd: 60 + Math.min(28, f * .4),
      dmg: 8 + f * .4,
      xp: 8 + f,
      wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0,
      ph: Math.random() * 6
    };
    e.max = e.hp;
    this.enemies.push(e);
    this.total++;
    this.burst(x, y, '#22c55e', 10);
    return e;
  },

  ebullet(x, y, a, spd, dmg, col, r = 5) {
    this.eb.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, col, r, life: 4 });
  },

  zone(x, y, r, delay, dmg, col, burst = 0) {
    this.zones.push({ x, y, r, delay, max: delay, dmg, col, burst });
  },

  hurtPlayer(raw, fx, fy) {
    const p = G.p, pl = this.pl;
    if (pl.inv > 0) return false;
    if (pl.shieldT > 0) {
      pl.inv = .4;
      this.floatText(pl.x, pl.y - 30, 'Shielded!', '#84cc16');
      beep(500, .08, 'square', .04);
      return false;
    }
    const defRed = p.element === 'Earth' ? 0.75 : 1.0;
    const dmg = Math.max(1, Math.round(raw * defRed));
    p.hp -= dmg;
    pl.inv = .9;
    this.shake = .22;
    pl.kbT = .15;
    const dx = pl.x - fx, dy = pl.y - fy, d = Math.hypot(dx, dy) || 1;
    pl.kx = dx / d * 210;
    pl.ky = dy / d * 210;

    this.floatText(pl.x, pl.y - 28, '-' + dmg, '#ef4444');
    beep(110, .15, 'sawtooth', .05);
    haptic(30);

    if (p.hp <= 0) {
      p.hp = 0;
      go(Over);
      return true;
    }
    return false;
  },

  bossUpdate(e, dt) {
    const pl = this.pl, hpr = e.hp / e.max, ph = hpr < .33 ? 3 : hpr < .66 ? 2 : 1;
    const dx = pl.x - e.x, dy = pl.y - 6 - e.y, d = Math.hypot(dx, dy) || 1;

    if (!e.active) {
      if (d < 480 || e.hp < e.max) {
        e.active = true;
        e.state = 'idle';
        e.st = 1.2;
        toast(e.bname + ' Awakens!');
        beep(70, .5, 'sawtooth', .07);
        AudioSys.setTrack('boss');
      } else return;
    }

    if (ph > e.phase) {
      e.phase = ph;
      e.state = 'idle';
      e.st = 1.3;
      e.dvx = e.dvy = 0;
      this.ring(e.x, e.y, 180, e.col);
      this.shake = .45;
      if (ph >= 3 && !e.pool.includes('rain')) e.pool.push('rain');
      toast(e.bname + ' enters Phase ' + ph + '!');
      beep(80, .5, 'sawtooth', .07);
    }

    e.q = e.q.filter(q => {
      q.t -= dt;
      if (q.t <= 0) { q.fn(); return false; }
      return true;
    });

    e.st -= dt;

    if (e.state === 'idle') {
      const sp = e.spd * (1 + .15 * (e.phase - 1));
      let vx = 0, vy = 0;
      if (d > 160) { vx = dx / d * sp * .7; vy = dy / d * sp * .7; }
      else if (d < 90) { vx = -dx / d * sp * .5; vy = -dy / d * sp * .5; }
      moveBox(e, vx * dt, 0, this.walls, this.W, this.H);
      moveBox(e, 0, vy * dt, this.walls, this.W, this.H);

      if (e.st <= 0) {
        let pool = e.pool.filter(k => k !== e.pat);
        if (!pool.length) pool = e.pool;
        e.pat = pool[Math.floor(Math.random() * pool.length)];
        const pt = PATTERNS[e.pat];
        e.state = 'tele';
        e.st = pt.tele;
        e.aimTrack = !pt.track;
        pt.begin(this, e);
        beep(500, .08, 'square', .03);
      }
    } else if (e.state === 'tele') {
      if (e.aimTrack && e.st > .2) e.aim = aimAt(this, e);
      if (e.st <= 0) {
        const pt = PATTERNS[e.pat];
        pt.fire(this, e);
        if (e.pat === 'charge') {
          e.state = 'act';
          e.st = .5;
        } else {
          e.state = 'rec';
          e.st = pt.rec * (e.phase === 3 ? .7 : 1);
        }
      }
    } else if (e.state === 'act') {
      const ox = e.x, oy = e.y;
      moveBox(e, e.dvx * dt, 0, this.walls, this.W, this.H);
      moveBox(e, 0, e.dvy * dt, this.walls, this.W, this.H);
      this.fx.push({ x: e.x, y: e.y, vx: 0, vy: 0, t: .3, c: e.col });
      const moved = Math.hypot(e.x - ox, e.y - oy), want = Math.hypot(e.dvx, e.dvy) * dt;
      if (e.st <= 0 || moved < want * .3) {
        e.state = 'rec';
        e.st = PATTERNS.charge.rec;
        e.dvx = e.dvy = 0;
        this.shake = .2;
      }
    } else if (e.state === 'rec') {
      if (e.st <= 0) {
        e.state = 'idle';
        e.st = [1.5, 1.0, .6][e.phase - 1];
      }
    }
  },

  killEnemy(e) {
    const p = G.p, st = sx(p), boss = e.type === 'boss';
    e.dead = true;

    if (boss) {
      this.eb = [];
      this.zones = [];
      e.q = [];
      p.inv.potions += 2;
      this.shake = .5;
      this.ring(e.x, e.y, 220, e.col);

      // Reward Zodiac Relic if not owned
      const RELIC_POOL = [
        'Aries Spark Core', 'Taurus Bastion Plating', 'Gemini Slipstream Prism',
        'Cancer Tide Talisman', 'Leo Solar Crest', 'Virgo Logic Chip'
      ];
      const relicAward = RELIC_POOL[Math.floor(p.floor / 5 - 1) % RELIC_POOL.length];
      if (!p.relics.includes(relicAward)) {
        p.relics.push(relicAward);
        toast('★ RELIC CLAIMED: ' + relicAward + '!');
      } else {
        toast('★ ' + e.bname + ' Defeated! +2 Potions');
      }
      AudioSys.setTrack('floor');
    }

    const sh = boss ? 75 : (e.type === 'golem' ? Math.round(rnd(8, 14)) : Math.round(rnd(4, 8)));
    p.inv.shards += sh;
    p.kills++;
    this.floatText(e.x, e.y - 14, '+' + sh + ' Shards', '#facc15');

    if (Math.random() < (boss ? 1 : .5)) {
      const n = boss ? 3 : 1;
      p.inv.bones += n;
      this.floatText(e.x, e.y - 28, '+' + n + ' Bone', '#cbd5e1');
    }
    if (Math.random() < (boss ? 1 : .35)) {
      const n = boss ? 3 : 1;
      p.inv.circuits += n;
      this.floatText(e.x, e.y - 42, '+' + n + ' Circuit', '#38bdf8');
    }

    p.bounty.have = Math.min(p.bounty.need, p.bounty.have + 1);
    if (p.element === 'Water') {
      p.hp = Math.min(st.maxHp, p.hp + 5);
    }

    this.gainXp(e.xp);
    this.burst(e.x, e.y, boss ? e.col : '#22c55e', 16);
    beep(160, .15, 'sawtooth', .04);

    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (!this.enemies.length) {
      this.cleared = true;
      toast('★ Floor Cleared! Elevator Stairs Unlocked.');
      beep(784, .25, 'triangle', .05);
    }
  },

  update(dt) {
    this.t += dt;
    toastT -= dt;
    this.banner -= dt;
    this.shake -= dt;
    AudioSys.update(dt);

    if (Dlg.active) { Dlg.update(dt); return; }
    if (this.menu) {
      if (Input.just('k')) this.menu = null;
      else menuStep(this.menu);
      return;
    }
    if (this.paused) {
      if (this.inBagScreen) {
        this.updateBagScreen();
        return;
      }
      if (Input.just('p') || Input.just('k')) { this.paused = false; return; }
      menuStep(this.pm);
      return;
    }
    if (Input.just('p')) {
      this.paused = true;
      this.pm = this.pauseMenu();
      return;
    }

    const p = G.p, st = sx(p), pl = this.pl, W2 = this.W, H2 = this.H;

    // Hotbar number key selection (1-9) & Bag Toggle (B / E)
    for (let i = 1; i <= 9; i++) {
      if (Input.just('num' + i)) {
        p.selectedSlot = i - 1;
        beep(600 + i * 25, .04);
      }
    }
    if (Input.just('bag')) {
      this.paused = true;
      this.openBagScreen();
      return;
    }

    // Touch / Mouse Tap on Stardew Hotbar or Bag Button
    if (Input.tap && !Dlg.active && !this.menu) {
      const startX = 231, startY = 402, sw = 34, gap = 4;
      // Check 🎒 Bag Button at x: 576, y: 402, w: 38, h: 38
      if (Input.tap.x >= 576 && Input.tap.x <= 614 && Input.tap.y >= 402 && Input.tap.y <= 440) {
        this.paused = true;
        this.openBagScreen();
        Input.tap = null;
        return;
      }
      // Check 9 Hotbar Slots
      for (let i = 0; i < 9; i++) {
        const sx = startX + i * (sw + gap);
        const sy = startY;
        if (Input.tap.x >= sx && Input.tap.x <= sx + sw && Input.tap.y >= sy && Input.tap.y <= sy + 38) {
          if (p.selectedSlot === i) {
            // Tapped active slot: Drink/Use potion if present!
            this.drinkPotionFromSlot(i);
          } else {
            p.selectedSlot = i;
            beep(650, .04);
          }
          Input.tap = null;
          break;
        }
      }
    }
    const mv = Input.move(), near = this.nearest(), mm = Math.hypot(mv.x, mv.y);

    pl.moving = mm > 0.05;
    if (pl.moving) {
      pl.fx = mv.x / mm;
      pl.fy = mv.y / mm;
    }

    const sprint = Input.cur.j && !near && pl.moving && p.sta > 0;
    pl.skCd -= dt;
    pl.ultCd -= dt;
    pl.dashCd -= dt;
    pl.shieldT -= dt;
    pl.hasteT -= dt;
    pl.regenT -= dt;
    pl.dashT -= dt;
    pl.comboT -= dt;
    if (pl.comboT <= 0) pl.combo = 0;

    if (pl.regenT > 0) p.hp = Math.min(st.maxHp, p.hp + pl.regenR * dt);

    const speed = st.spd * (sprint ? 1.6 : 1) * (pl.atkT > 0 ? .6 : 1) * (pl.hasteT > 0 ? pl.hasteM : 1);
    if (sprint) {
      p.sta = Math.max(0, p.sta - 20 * dt);
      pl.regenD = .5;
    } else {
      pl.regenD -= dt;
      if (pl.regenD <= 0) {
        p.sta = Math.min(st.maxSta, p.sta + (p.element === 'Air' ? 22 : 14) * dt);
      }
    }

    pl.inv -= dt;
    pl.atkT -= dt;
    pl.atkCd -= dt;

    let kx = 0, ky = 0;
    if (pl.kbT > 0) {
      pl.kbT -= dt;
      kx = pl.kx; ky = pl.ky;
    }

    // Dodge Roll
    if (Input.just('dash')) {
      this.dodgeRoll();
    }

    if (pl.dashT > 0) {
      moveBox(pl, pl.dvx * dt, 0, this.walls, W2, H2);
      moveBox(pl, 0, pl.dvy * dt, this.walls, W2, H2);
      this.fx.push({ x: pl.x, y: pl.y - 8, vx: 0, vy: 0, t: .22, c: ELEM[p.element].color });
      if (pl.dashDmg > 0) {
        for (const e of this.enemies.slice()) {
          if (!e.dead && !pl.dashHit.includes(e) && Math.abs(e.x - pl.x) < 18 + e.w / 2 && Math.abs(e.y - pl.y) < 18 + e.h / 2) {
            pl.dashHit.push(e);
            this.hurtEnemy(e, pl.dashDmg, pl.fx, pl.fy, 300, ELEM[p.element].color);
          }
        }
      }
    } else {
      moveBox(pl, (mv.x * speed + kx) * dt, 0, this.walls, W2, H2);
      moveBox(pl, 0, (mv.y * speed + ky) * dt, this.walls, W2, H2);
    }

    // CRITICAL: Gateway Walk-In Threshold (Enters Tower Floor 1 effortlessly)
    if (this.mode === 'hub' && pl.x > 435 && pl.x < 525 && pl.y <= 65) {
      this.enterFloor();
      return;
    }

    // Multi-Input Interaction (J, Enter, Screen Tap, or Walk-in)
    const cx = clamp(pl.x - W / 2, 0, Math.max(0, this.W - W));
    const cy = clamp(pl.y - H / 2, 0, Math.max(0, this.H - H));
    const tappedNear = Input.tap && near && Math.hypot(Input.tap.x - (near.x - cx), Input.tap.y - (near.y - cy)) < near.r + 35;
    const isDoor = near && near.label && near.label.startsWith('Enter Floor');

    if (near && (Input.just('j') || (Input.cur.j && isDoor) || tappedNear)) {
      beep(700, .05);
      near.fn();
      return;
    }

    // Guild Skills & Ultimates (L key)
    if (p.lvl < ULT_LVL) {
      if (Input.just('l')) this.castSkill();
      pl.lHold = 0;
    } else if (Input.cur.l) {
      pl.lHold += dt;
      if (pl.lHold >= .45 && !pl.lFired) {
        pl.lFired = true;
        this.castUlt();
      }
    } else {
      if (pl.lHold > 0 && !pl.lFired) this.castSkill();
      pl.lHold = 0;
      pl.lFired = false;
    }

    // 3-Hit Combat Attack Combo (K key)
    if (Input.just('k') && pl.atkCd <= 0 && p.sta >= 8) {
      p.sta -= 8;
      pl.atkT = .18;
      pl.atkCd = pl.combo === 2 ? .38 : .28;
      pl.regenD = .7;
      this.atkId++;

      AudioSys.playSlash(pl.combo);
      haptic(15);

      // Finisher wave projectile on 3rd combo hit
      if (pl.combo === 2) {
        const a = Math.atan2(pl.fy, pl.fx);
        this.shoot(a, { spd: 380, life: .45, dmg: st.atk * 1.2, r: 8, pierce: true, col: ELEM[p.element].color });
      }

      pl.combo = (pl.combo + 1) % 3;
      pl.comboT = 0.65;
    }

    // Attack Hitbox Calculation
    if (pl.atkT > 0) {
      const hx = pl.x + pl.fx * 24, hy = pl.y - 6 + pl.fy * 24;
      for (const e of this.enemies.slice()) {
        if (e.dead || e.last === this.atkId) continue;
        if (Math.abs(e.x - hx) < 22 + e.w / 2 && Math.abs(e.y - hy) < 22 + e.h / 2) {
          e.last = this.atkId;
          const critChance = (p.element === 'Air' ? 0.20 : 0.12) + (p.relics.includes('Gemini Slipstream Prism') ? 0.10 : 0);
          const isCrit = Math.random() < critChance;
          const comboMult = [1.0, 1.25, 1.8][(pl.combo + 2) % 3];
          const dmg = st.atk * rnd(.9, 1.25) * comboMult * (isCrit ? 1.75 : 1.0);
          this.hurtEnemy(e, dmg, pl.fx, pl.fy, pl.combo === 0 ? 260 : 180, ELEM[p.element].color, isCrit);
        }
      }
    }

    // Enemy AI & Updates
    for (const e of this.enemies.slice()) {
      if (e.dead) continue;
      e.flash -= dt;

      if (e.poison > 0) {
        e.poison -= dt;
        e.pt -= dt;
        if (e.pt <= 0) {
          e.pt = .5;
          this.hurtEnemy(e, st.atk * .35, 0, 1, 0, '#a855f7');
          if (e.dead) continue;
        }
      }

      if (e.stun > 0) { e.stun -= dt; continue; }

      const dx = pl.x - e.x, dy = (pl.y - 6) - e.y, d = Math.hypot(dx, dy) || 1;
      let vx = 0, vy = 0;

      if (e.type === 'boss') {
        this.bossUpdate(e, dt);
      } else {
        const sm = e.slow > 0 ? (e.slow -= dt, .5) : 1;
        if (d < 260) {
          vx = dx / d * e.spd * sm;
          vy = dy / d * e.spd * sm;
        } else {
          e.wt -= dt;
          if (e.wt <= 0) {
            e.wt = rnd(1, 2.5);
            const a = Math.random() * 6.28;
            e.dx = Math.cos(a) * e.spd * .4;
            e.dy = Math.sin(a) * e.spd * .4;
          }
          vx = e.dx; vy = e.dy;
        }
        if (e.kbT > 0) {
          e.kbT -= dt;
          vx = e.kx; vy = e.ky;
        }
        moveBox(e, vx * dt, 0, this.walls, W2, H2);
        moveBox(e, 0, vy * dt, this.walls, W2, H2);
      }

      // Contact damage to player
      if (pl.inv <= 0 && Math.abs(pl.x - e.x) < (e.w + pl.w) / 2 + 2 && Math.abs(pl.y - 6 - e.y) < (e.h + pl.h) / 2 + 6) {
        if (this.hurtPlayer(e.dmg * (e.state === 'act' ? 1.4 : 1), e.x, e.y)) return;
      }
    }

    // Bullets & Hazards
    for (const b of this.eb) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.x < 0 || b.y < 0 || b.x > W2 || b.y > H2 || this.walls.some(r => b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h)) {
        b.life = 0;
      }
      if (b.life > 0 && Math.hypot(b.x - pl.x, b.y - (pl.y - 8)) < b.r + 7) {
        b.life = 0;
        if (this.hurtPlayer(b.dmg, b.x, b.y)) return;
      }
    }
    this.eb = this.eb.filter(b => b.life > 0);

    for (const z of this.zones) {
      z.delay -= dt;
      if (z.delay <= 0) {
        this.ring(z.x, z.y, z.r, z.col);
        this.burst(z.x, z.y, z.col, 10);
        this.shake = Math.max(this.shake, .14);
        beep(100, .2, 'sawtooth', .05);
        if (Math.hypot(pl.x - z.x, pl.y - 8 - z.y) < z.r + 6 && this.hurtPlayer(z.dmg, z.x, z.y)) return;
        for (let i = 0; i < z.burst; i++) {
          this.ebullet(z.x, z.y, i * 6.283 / z.burst, 200, z.dmg * .35, z.col);
        }
      }
    }
    this.zones = this.zones.filter(z => z.delay > 0);

    // Elevator Stairs trigger
    if (this.mode === 'floor' && this.cleared) {
      const s = this.stairs;
      if (pl.x > s.x && pl.x < s.x + s.w && pl.y > s.y && pl.y < s.y + s.h + 20) {
        this.advance();
        return;
      }
    }

    // Player Projectiles
    for (const b of this.proj) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.x < 0 || b.y < 0 || b.x > W2 || b.y > H2 || this.walls.some(r => b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h)) {
        b.life = 0;
      }
      this.fx.push({ x: b.x, y: b.y, vx: 0, vy: 0, t: .15, c: b.col });
      for (const e of this.enemies.slice()) {
        if (e.dead || b.hit.includes(e)) continue;
        if (Math.abs(e.x - b.x) < e.w / 2 + b.r && Math.abs(e.y - b.y) < e.h / 2 + b.r) {
          b.hit.push(e);
          this.hurtEnemy(e, b.dmg, b.vx, b.vy, 160, b.col);
          if (b.poison) { e.poison = 4; e.pt = .5; }
          if (!b.pierce) { b.life = 0; break; }
        }
      }
    }
    this.proj = this.proj.filter(b => b.life > 0);

    for (const r of this.rings) r.t -= dt;
    this.rings = this.rings.filter(r => r.t > 0);

    for (const f of this.fx) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.vy += 160 * dt; f.t -= dt;
    }
    this.fx = this.fx.filter(f => f.t > 0);

    for (const t of this.texts) {
      t.y -= 22 * dt; t.t -= dt;
    }
    this.texts = this.texts.filter(t => t.t > 0);
  },

  draw() {
    const p = G.p, pl = this.pl, st = sx(p), el = ELEM[p.element];
    const cx = clamp(pl.x - W / 2, 0, Math.max(0, this.W - W));
    const cy = clamp(pl.y - H / 2, 0, Math.max(0, this.H - H));
    const ox = this.shake > 0 ? rnd(-3, 3) : 0;
    const oy = this.shake > 0 ? rnd(-3, 3) : 0;

    ctx.save();
    ctx.translate(Math.round(-cx + ox), Math.round(-cy + oy));

    const hub = this.mode === 'hub';

    // 1. Render Textured 16-Bit Tilemap
    const tileW = 32;
    const startTX = Math.floor(cx / tileW), endTX = Math.ceil((cx + W) / tileW);
    const startTY = Math.floor(cy / tileW), endTY = Math.ceil((cy + H) / tileW);

    if (hub) {
      // Inotia Town Cobblestone & Grass Edges
      for (let ty = startTY; ty <= endTY; ty++) {
        for (let tx = startTX; tx <= endTX; tx++) {
          const isEdge = (tx < 3 || tx > (this.W / tileW) - 4 || ty > (this.H / tileW) - 4);
          const tCanvas = isEdge ? PixelArt.tiles.town_grass : PixelArt.tiles.town_cobble;
          ctx.drawImage(tCanvas, tx * tileW, ty * tileW);
        }
      }

      // Render Town Props (Barrels, Crates, Stall, Board, Gateway)
      ctx.drawImage(PixelArt.props.gateway, 432, 6);
      ctx.drawImage(PixelArt.props.stall, 115, 240);
      ctx.drawImage(PixelArt.props.board, 790, 244);
      ctx.drawImage(PixelArt.props.barrel, 80, 255);
      ctx.drawImage(PixelArt.props.crate, 185, 255);
      ctx.drawImage(PixelArt.props.barrel, 760, 255);

      // Glowing entry carpet / runes leading into gateway
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(445, 52, 70, 16);
      T('▲ ENTER TOWER ▲', 480, 54, 9, '#e0f2fe', 'center');
    } else {
      // Dungeon Tiles matching Biome
      const fTile = (this.bio.name.includes('Volcanic')) ? PixelArt.tiles.forge_floor :
                    (this.bio.name.includes('Astral')) ? PixelArt.tiles.astral_floor : PixelArt.tiles.ruins_floor;
      for (let ty = startTY; ty <= endTY; ty++) {
        for (let tx = startTX; tx <= endTX; tx++) {
          ctx.drawImage(fTile, tx * tileW, ty * tileW);
        }
      }

      // Walls with 3D Bevel & Sconces
      for (const r of this.walls) {
        for (let wx = r.x; wx < r.x + r.w; wx += 32) {
          for (let wy = r.y; wy < r.y + r.h; wy += 32) {
            ctx.drawImage(PixelArt.tiles.stone_wall, wx, wy);
          }
        }
      }

      // Elevator Stairs
      const s = this.stairs;
      ctx.drawImage(PixelArt.props.elevator, s.x, s.y);
      if (this.cleared) {
        ctx.fillStyle = '#fde047';
        T('ASCEND ▲', s.x + s.w / 2, s.y + 18, 12, '#ffffff', 'center');
      } else {
        T('LOCKED', s.x + s.w / 2, s.y + 18, 12, '#94a3b8', 'center');
      }
    }

    // 2. Render Entities (NPCs, Player, Enemies) with Y-sorting
    const drawables = [];

    // Player
    drawables.push({
      y: pl.y,
      draw: () => {
        const isBlinking = pl.inv > 0 && Math.floor(this.t * 20) % 2 === 0;
        if (!isBlinking) {
          drawChibiHero(ctx, pl.x, pl.y, {
            guild: p.guild, element: p.element, outfit: OUTFITS[p.outfit], hair: HAIRS[p.hair], hairStyle: p.hairStyle || 0
          }, this.t, pl.facing, pl.moving, 1.0, pl.atkT, 0.3);
        }

        // Sword Slash Arc Effect on attack
        if (pl.atkT > 0) {
          const a = Math.atan2(pl.fy, pl.fx);
          ctx.strokeStyle = el.color; ctx.lineWidth = pl.combo === 2 ? 6 : 4;
          ctx.beginPath();
          ctx.arc(pl.x, pl.y - 6, 26, a - 1.1, a + 1.1);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pl.x, pl.y - 6, 25, a - 0.9, a + 0.9);
          ctx.stroke();
        }
      }
    });

    // Hub NPCs with floating animated '💬' bubbles
    if (hub) {
      for (const k in CLIMBERS) {
        const c = CLIMBERS[k];
        drawables.push({
          y: c.y,
          draw: () => {
            drawChibiHero(ctx, c.x, c.y, {
              guild: c.name === 'Yuna' ? 'Aries' : (c.name === 'Yuri' ? 'Taurus' : (c.name === 'Yumi' ? 'Gemini' : 'Cancer')),
              element: c.el,
              outfit: c.name === 'Yuna' ? '#e11d48' : (c.name === 'Yuri' ? '#65a30d' : (c.name === 'Yumi' ? '#0891b2' : '#2563eb')),
              hair: c.name === 'Yuna' ? '#dc2626' : (c.name === 'Yuri' ? '#4d7c0f' : (c.name === 'Yumi' ? '#0891b2' : '#60a5fa')),
              hairStyle: c.name === 'Yuna' ? 1 : (c.name === 'Yuri' ? 4 : (c.name === 'Yumi' ? 2 : 0))
            }, this.t, 'down', false);

            T(c.name, c.x, c.y - 32, 11, ELEM[c.el].color, 'center');
            // Floating Inotia-style animated speech bubble
            const bY = c.y - 44 + Math.sin(this.t * 5 + c.x) * 2;
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(c.x, bY, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#0f172a'; ctx.fillRect(c.x - 3, bY - 1, 2, 2); ctx.fillRect(c.x + 1, bY - 1, 2, 2);
          }
        });
      }
    }

    // Enemies
    for (const e of this.enemies) {
      drawables.push({
        y: e.y,
        draw: () => {
          if (e.type === 'boss') drawBoss(ctx, e.x, e.y, e, this.t);
          else if (e.type === 'golem') drawGolem(ctx, e.x, e.y, e, this.t);
          else if (e.type === 'drone') drawDrone(ctx, e.x, e.y, e, this.t);
          else drawSlime(ctx, e.x, e.y, e, this.t);

          // Enemy HP bar
          if (e.hp < e.max && e.type !== 'boss') {
            const hPct = e.hp / e.max;
            ctx.fillStyle = '#0f172a'; ctx.fillRect(e.x - 12, e.y - e.h / 2 - 12, 24, 4);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - 12, e.y - e.h / 2 - 12, 24 * hPct, 4);
          }
        }
      });
    }

    // Sort by Y position for proper 2.5D depth
    drawables.sort((a, b) => a.y - b.y).forEach(d => d.draw());

    // Telegraphs, Bullets, Zones
    for (const r of this.rings) {
      const k = 1 - r.t / r.max;
      ctx.strokeStyle = r.col; ctx.lineWidth = 4; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (.3 + .7 * k), 0, 6.3); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const z of this.zones) {
      const k = 1 - z.delay / z.max;
      ctx.fillStyle = z.col; ctx.globalAlpha = .15 + .25 * k;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.3); ctx.fill();
      ctx.strokeStyle = z.col; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const b of this.eb) {
      ctx.fillStyle = b.col;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    }

    for (const b of this.proj) {
      ctx.fillStyle = b.col;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    }

    if (pl.shieldT > 0) {
      ctx.strokeStyle = '#84cc16'; ctx.lineWidth = 3; ctx.globalAlpha = .6 + .3 * Math.sin(this.t * 12);
      ctx.beginPath(); ctx.arc(pl.x, pl.y - 6, 22, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;
    }

    for (const f of this.fx) {
      ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 3, 3);
    }

    for (const t of this.texts) {
      T(t.s, t.x, t.y, 13, t.c, 'center');
    }

    // Nearby Interaction Prompt Badge
    const near = this.nearest();
    if (near && !Dlg.active && !this.menu) {
      const isD = near.label.startsWith('Enter Floor');
      const badgeY = isD ? (near.y + 12) : (near.y - 54);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(near.x - 70, badgeY - 4, 140, 24);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
      ctx.strokeRect(near.x - 70, badgeY - 4, 140, 24);
      T('[J] ' + near.label, near.x, badgeY, 12, '#ffffff', 'center');
    }

    ctx.restore();

    // 3. Authentic Inotia / GBA Action-RPG HUD (Top-Left Status Bar)
    const hudX = 14, hudY = 14;
    // Status Bar Frame
    ctx.fillStyle = '#0f172a'; ctx.fillRect(hudX, hudY, 230, 68);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5; ctx.strokeRect(hudX + 1, hudY + 1, 228, 66);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(hudX + 4, hudY + 4, 222, 60);

    // Hero Name & Guild
    T(p.name, hudX + 12, hudY + 8, 14, '#f8fafc');
    T(p.guild + ' • ' + p.element, hudX + 105, hudY + 9, 11, el.color);

    // Heart HP Bar
    const hpPct = clamp(p.hp / st.maxHp, 0, 1);
    ctx.fillStyle = '#991b1b'; ctx.fillRect(hudX + 32, hudY + 26, 125, 10);
    ctx.fillStyle = hpPct < 0.25 ? '#ef4444' : (hpPct < 0.5 ? '#f59e0b' : '#22c55e');
    ctx.fillRect(hudX + 32, hudY + 26, 125 * hpPct, 10);
    T('♥', hudX + 14, hudY + 24, 13, '#ef4444');
    T(Math.ceil(p.hp) + '/' + st.maxHp, hudX + 162, hudY + 25, 10, '#ffffff');

    // Lightning SP / Stamina Bar
    const staPct = clamp(p.sta / st.maxStamina, 0, 1);
    ctx.fillStyle = '#78350f'; ctx.fillRect(hudX + 32, hudY + 40, 125, 8);
    ctx.fillStyle = '#facc15'; ctx.fillRect(hudX + 32, hudY + 40, 125 * staPct, 8);
    T('⚡', hudX + 14, hudY + 37, 12, '#facc15');
    T(Math.floor(p.sta) + '/' + st.maxStamina, hudX + 162, hudY + 39, 10, '#ffffff');

    // EXP Bar
    const expNeed = p.lvl * 35;
    const expPct = clamp(p.xp / expNeed, 0, 1);
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(hudX + 32, hudY + 52, 125, 5);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(hudX + 32, hudY + 52, 125 * expPct, 5);
    T('Lv ' + p.lvl, hudX + 162, hudY + 50, 10, '#fde047');

    // Skill Bar Status
    const sk = SKILLS[p.guild];
    const scd = sk.cd * (1 - 0.12 * (rankOf(p) - 1));
    const skReady = pl.skCd <= 0;
    panel(hudX, hudY + 74, 230, 36, el.color);
    T('[L] ' + sk.name, hudX + 10, hudY + 80, 12, skReady ? '#ffffff' : '#94a3b8');
    bar(hudX + 10, hudY + 98, 210, 3, skReady ? scd : scd - pl.skCd, scd, skReady ? '#22c55e' : '#64748b');

    // Top-Right Gold Shards & Floor Indicator
    panel(W - 190, 14, 176, 50, '#facc15');
    T('FLOOR ' + p.floor, W - 180, 20, 14, '#ffffff');
    T('💎 ' + p.inv.shards + '   🧪 ' + p.inv.potions, W - 180, 40, 12, '#fde047');

    // Radar Minimap (When in Floor)
    if (!hub) {
      const mw = 84, mh = 54, mx = W - 98, my = 70;
      panel(mx, my, mw, mh, '#475569');
      ctx.fillStyle = '#020617'; ctx.fillRect(mx + 2, my + 2, mw - 4, mh - 4);
      const ppx = mx + (pl.x / this.W) * (mw - 4);
      const ppy = my + (pl.y / this.H) * (mh - 4);
      ctx.fillStyle = el.color; ctx.fillRect(ppx - 1.5, ppy - 1.5, 3, 3);
      for (const e of this.enemies) {
        const epx = mx + (e.x / this.W) * (mw - 4);
        const epy = my + (e.y / this.H) * (mh - 4);
        ctx.fillStyle = e.type === 'boss' ? '#fde047' : '#ef4444';
        ctx.fillRect(epx - 1, epy - 1, 2, 2);
      }
      const stx = mx + (this.stairs.x / this.W) * (mw - 4);
      const sty = my + (this.stairs.y / this.H) * (mh - 4);
      ctx.fillStyle = this.cleared ? '#facc15' : '#64748b'; ctx.fillRect(stx - 1.5, sty - 1.5, 3, 3);
    }

    // Boss Bar
    const bs = this.enemies.find(e => e.type === 'boss');
    if (bs && bs.active) {
      panel(250, 14, 300, 40, bs.col);
      T(bs.bname + ' • Phase ' + bs.phase + '/3', 400, 18, 12, '#ffffff', 'center');
      bar(260, 36, 280, 8, bs.hp, bs.max, bs.col);
    }

    if (this.banner > 0) {
      ctx.globalAlpha = clamp(this.banner, 0, 1);
      T(this.bannerText, W / 2, 100, 18, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }

    if (toastT > 0) {
      ctx.globalAlpha = clamp(toastT, 0, 1);
      const tw = Math.max(320, toastS.length * 8 + 30);
      panel(W / 2 - tw / 2, 140, tw, 26, '#38bdf8');
      T(toastS, W / 2, 145, 13, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }

    if (this.menu) {
      panel(130, 80, 540, 50, '#facc15');
      T('Sanctuary Merchant Counter • Shards: ' + p.inv.shards, 150, 95, 14, '#fde047');
      menuDraw(this.menu);
      T('Press K or Click Leave Counter to Exit', 150, 400, 12, '#93c5fd');
    }

    // 4. Stardew Valley On-Screen Inventory Hotbar
    if (!this.paused && !Dlg.active && !this.menu) {
      this.drawStardewHotbar();
    }

    if (this.paused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, W, H);
      if (this.inBagScreen) {
        this.drawBagScreen();
      } else {
        T('EXPEDITION PAUSED', W / 2, 65, 24, '#fde047', 'center');
        menuDraw(this.pm);
      }
    }

    if (Dlg.active) Dlg.draw();
  },

  drawStardewHotbar() {
    const p = G.p;
    if (!p || !p.bag) return;
    const startX = 231, startY = 402, sw = 34, sh = 38, gap = 4;
    const totalW = 9 * sw + 8 * gap;

    // Rustic Wood & Slate Stardew Toolbar Plate
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(startX - 6, startY - 4, totalW + 12 + 46, sh + 8);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2.5;
    ctx.strokeRect(startX - 6.5, startY - 4.5, totalW + 12 + 46, sh + 8);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1;
    ctx.strokeRect(startX - 4.5, startY - 2.5, totalW + 8 + 46, sh + 4);

    // Selected Slot Item Label Banner above Hotbar
    const selItem = p.bag[p.selectedSlot];
    if (selItem) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(280, startY - 22, 240, 18);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1;
      ctx.strokeRect(280.5, startY - 21.5, 239, 17);
      T(`${selItem.icon} ${selItem.name} (x${selItem.count}) • [Click to Drink]`, 400, startY - 18, 10, '#fde047', 'center');
    } else {
      T(`[${p.selectedSlot + 1}] Empty Slot`, 400, startY - 16, 9, '#94a3b8', 'center');
    }

    // 9 Slots
    for (let i = 0; i < 9; i++) {
      const sx = startX + i * (sw + gap);
      const isSel = p.selectedSlot === i;

      // Slot Background
      ctx.fillStyle = isSel ? '#451a03' : '#292524';
      ctx.fillRect(sx, startY, sw, sh);
      ctx.strokeStyle = isSel ? '#fde047' : '#57534e';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(sx + 0.5, startY + 0.5, sw - 1, sh - 1);

      if (isSel) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
        ctx.fillRect(sx + 2, startY + 2, sw - 4, sh - 4);
      }

      // Slot Number (1 to 9)
      T(String(i + 1), sx + 3, startY + 2, 8, isSel ? '#fde047' : '#a8a29e', 'left');

      // Item Content
      const it = p.bag[i];
      if (it) {
        T(it.icon || '🧪', sx + sw / 2, startY + 18, 16, '#ffffff', 'center');
        if (it.count > 1) {
          T(String(it.count), sx + sw - 3, startY + 28, 9, '#ffffff', 'right');
        }
      }
    }

    // 🎒 Backpack Button (Opens Full Stardew Bag)
    const bx = startX + totalW + 8, by = startY;
    ctx.fillStyle = '#451a03'; ctx.fillRect(bx, by, 34, sh);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.5, by + 0.5, 33, sh - 1);
    T('🎒', bx + 17, by + 18, 16, '#ffffff', 'center');
    T(`${this.getBagItemCount()}/${p.bagCapacity}`, bx + 17, by + 30, 8, '#fde047', 'center');
  },

  updateBagScreen() {
    const p = G.p;
    const totalSlots = p.bagCapacity || 9;
    const cols = 9;

    if (this.bagActionMenu) {
      menuStep(this.bagActionMenu);
      if (Input.just('k')) {
        this.bagActionMenu = null;
        beep(440, .04);
      }
      return;
    }

    if (Input.just('k') || Input.just('p') || Input.just('bag')) {
      if (this.bagMovingFrom >= 0) {
        this.bagMovingFrom = -1;
        toast('Move cancelled');
        beep(440, .04);
      } else {
        this.closeBagScreen();
      }
      return;
    }

    if (Input.just('up')) {
      this.bagCursor = (this.bagCursor - cols + totalSlots) % totalSlots;
      beep(520, .04);
    }
    if (Input.just('down')) {
      this.bagCursor = (this.bagCursor + cols) % totalSlots;
      beep(520, .04);
    }
    if (Input.just('left')) {
      this.bagCursor = (this.bagCursor - 1 + totalSlots) % totalSlots;
      beep(520, .04);
    }
    if (Input.just('right')) {
      this.bagCursor = (this.bagCursor + 1) % totalSlots;
      beep(520, .04);
    }

    if (Input.tap) {
      const startX = 140, startY = 120, sw = 52, gap = 6;
      for (let i = 0; i < totalSlots; i++) {
        const c = i % 9, r = Math.floor(i / 9);
        const sx = startX + c * (sw + gap);
        const sy = startY + r * (sw + gap);
        if (Input.tap.x >= sx && Input.tap.x <= sx + sw && Input.tap.y >= sy && Input.tap.y <= sy + sw) {
          this.bagCursor = i;
          Input.tap = null;
          this.activateBagCursor();
          return;
        }
      }
    }

    if (Input.just('j')) {
      this.activateBagCursor();
    }
  },

  activateBagCursor() {
    const p = G.p;
    const curIdx = this.bagCursor;

    if (this.bagMovingFrom >= 0) {
      // SWAP / MOVE SLOTS
      const fromIdx = this.bagMovingFrom;
      const tmp = p.bag[curIdx];
      p.bag[curIdx] = p.bag[fromIdx];
      p.bag[fromIdx] = tmp;
      this.bagMovingFrom = -1;
      toast(`★ Arranged item to Slot ${curIdx + 1}!`);
      beep(760, .06);
      autosave();
      return;
    }

    const item = p.bag[curIdx];
    if (item) {
      beep(650, .05);
      const self = this;
      this.bagActionMenu = Menu([
        {
          label: () => item.id === 'potion' ? 'Drink Potion (+60 HP)' : 'Use Item',
          fn: () => {
            self.drinkPotionFromSlot(curIdx);
            self.bagActionMenu = null;
          }
        },
        {
          label: 'Move / Arrange Slot',
          fn: () => {
            self.bagMovingFrom = curIdx;
            self.bagActionMenu = null;
            toast('Select destination slot and press [J] to swap!');
            beep(600, .05);
          }
        },
        {
          label: 'Cancel',
          fn: () => { self.bagActionMenu = null; }
        }
      ], 420, 160, 220, 36);
    } else {
      toast('Empty Slot. Press [K] to return.');
      beep(360, .04);
    }
  },

  drawBagScreen() {
    const p = G.p, st = sx(p);
    const totalSlots = p.bagCapacity || 9;

    // Stardew Valley Rustic Wood & Gold Filigree Inventory Box
    const bx = 110, by = 50, bw = 580, bh = 350;
    ctx.fillStyle = '#1c1917'; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 5.5, by + 5.5, bw - 11, bh - 11);

    // Header Banner
    ctx.fillStyle = '#292524'; ctx.fillRect(bx + 6, by + 6, bw - 12, 38);
    T("🎒 ADVENTURER'S BACKPACK • STARDEW POUCH", bx + 20, by + 16, 14, '#fde047');
    T(`Storage Capacity: ${this.getBagItemCount()} / ${totalSlots} Slots`, bx + bw - 20, by + 18, 11, '#38bdf8', 'right');

    // 3 Rows of 9 Slots (Stardew Valley Grid)
    const startX = 140, startY = 110, sw = 52, gap = 6;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const slotIdx = r * 9 + c;
        const sx = startX + c * (sw + gap);
        const sy = startY + r * (sw + gap);
        const isUnlocked = slotIdx < totalSlots;
        const isHover = this.bagCursor === slotIdx;
        const isMoving = this.bagMovingFrom === slotIdx;

        if (isUnlocked) {
          ctx.fillStyle = isHover ? '#451a03' : '#292524';
          ctx.fillRect(sx, sy, sw, sw);
          ctx.strokeStyle = isMoving ? '#22c55e' : (isHover ? '#fde047' : '#57534e');
          ctx.lineWidth = isHover || isMoving ? 2.5 : 1;
          ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sw - 1);

          if (isHover) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
            ctx.fillRect(sx + 2, sy + 2, sw - 4, sw - 4);
          }

          // Slot Index
          T(String(slotIdx + 1), sx + 4, sy + 3, 9, isHover ? '#fde047' : '#a8a29e', 'left');

          // Item Icon & Stack Count
          const it = p.bag[slotIdx];
          if (it) {
            T(it.icon || '🧪', sx + sw / 2, sy + 28, 22, '#ffffff', 'center');
            T('x' + it.count, sx + sw - 4, sy + sw - 4, 10, '#ffffff', 'right');
          }
        } else {
          // Locked Slot (Tier 2 / 3 Upgrade Required)
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(sx, sy, sw, sw);
          ctx.strokeStyle = '#292524'; ctx.lineWidth = 1;
          ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sw - 1);
          T('🔒', sx + sw / 2, sy + 28, 14, '#57534e', 'center');
        }
      }
    }

    // Detail Panel at Bottom
    const dw = bw - 40, dh = 50, dx = bx + 20, dy = by + bh - 68;
    ctx.fillStyle = '#292524'; ctx.fillRect(dx, dy, dw, dh);
    ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1; ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

    const activeItem = p.bag[this.bagCursor];
    if (activeItem) {
      T(`${activeItem.icon} ${activeItem.name} (x${activeItem.count})`, dx + 12, dy + 10, 12, '#fde047');
      T('Emergency alchemical field tonic. Restores 60 HP (+90 for Water affinity). Press [J] to drink or arrange.', dx + 12, dy + 28, 10, '#cbd5e1', 'left', false);
    } else {
      T(`Slot ${this.bagCursor + 1}: Empty Compartment`, dx + 12, dy + 10, 11, '#94a3b8');
      T('Expand your backpack pouch at the Safe Haven Merchant for additional rows.', dx + 12, dy + 28, 10, '#64748b', 'left', false);
    }

    // Sub-Action Menu if active
    if (this.bagActionMenu) {
      menuDraw(this.bagActionMenu);
    }
  },
};

function panel(x, y, w, h, col = '#facc15') {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
}

function bar(x, y, w, h, v, max, col) {
  ctx.fillStyle = '#1e293b'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, w * clamp(v / max, 0, 1)), h);
  ctx.strokeStyle = '#020617'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

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

/* ================= 18. Game Over & Floor 100 Victory ================= */
const Over = {
  enter() {
    this.t = 0;
    this.m = Menu([
      { label: 'Reload Last Save', fn: () => loadSlot(G.slot) },
      { label: 'Return to Title', fn: () => go(Title) }
    ], 250, 240, 300, 42);
  },
  update(dt) { this.t += dt; if (this.t > .5) menuStep(this.m); },
  draw() {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
    T('SYSTEM COLLAPSE', W / 2, 85, 36, '#ef4444', 'center');
    T('You fell on Floor ' + G.p.floor + '. The Spire resets its defenses.', W / 2, 145, 14, '#cbd5e1', 'center');
    T('Your recorded memory awaits in Slot ' + G.slot + '.', W / 2, 170, 14, '#94a3b8', 'center');
    menuDraw(this.m);
  }
};

const Victory = {
  enter() {
    this.t = 0;
    const p = G.p;
    p.floor = 100;
    p.loc = 'hub';
    p.hp = sx(p).maxHp;
    Save.write(G.slot, p);
    this.m = Menu([{ label: 'Ascend to Astral Immortality (Title)', fn: () => go(Title) }], 220, 330, 360, 42);
  },
  update(dt) { this.t += dt; menuStep(this.m); },
  draw() {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
    T('FLOOR 100 CONQUERED', W / 2, 75, 36, '#fde047', 'center');
    wrap('The Astral Artifact hums in your grasp. The twelve constellations align under your command, ' + G.p.name + ' of the ' + G.p.guild + ' Guild. The stars are yours to rewrite.', 580, 16)
      .forEach((l, i) => T(l, W / 2, 140 + i * 26, 16, '#f8fafc', 'center'));
    T('Congratulations! You conquered the Astral Spire.', W / 2, 280, 14, '#38bdf8', 'center');
    menuDraw(this.m);
  }
};

/* ================= 19. Save Import File Handler ================= */
$('imp').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || typeof d.name !== 'string' || !GUILDS.some(g => g[0] === d.guild)) throw new Error('Bad Format');
      go(Slots, { mode: 'import', data: normSave(d) });
    } catch (x) {
      toast('Invalid Save File');
    }
    e.target.value = '';
  };
  r.readAsText(f);
});

/* ================= 20. Initialization & Main Game Loop ================= */
PixelArt.init();
go(Title);

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  Input.update();
  scene.update(dt);
  if (scene !== World) toastT -= dt;
  ctx.clearRect(0, 0, W, H);
  scene.draw();
  if (scene !== World && toastT > 0) {
    ctx.globalAlpha = clamp(toastT, 0, 1);
    const tw = Math.max(320, toastS.length * 8 + 30);
    panel(W / 2 - tw / 2, H - 90, tw, 26, '#38bdf8');
    T(toastS, W / 2, H - 85, 13, '#ffffff', 'center');
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__astral = { G, World, Title, Slots, Create, go, get scene() { return scene; } };
})();
