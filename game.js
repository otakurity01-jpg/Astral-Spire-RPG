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
const HAIR_STYLES = ['Spiky Hero', 'Twin-Tails', 'Samurai Ponytail', 'Neat Bob', 'Tousled Mage', 'Celestial Locks'];
const ANIM_PREVIEWS = ['Idle', 'Walk Cycle', 'Attack Slash', 'Dodge Dash', 'Guild Skill'];
const ZODIAC_SIGILS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};
const ZODIAC_WEAPONS = {
  Aries: { name: 'Ram Magma Cleavers', type: 'cleavers', desc: 'Dual horned blades roaring with volcanic fire.' },
  Taurus: { name: 'Titan Granite Shield & Mace', type: 'shield_mace', desc: 'Massive obsidian shield and heavy runic mace.' },
  Gemini: { name: 'Twin Starlight Blades', type: 'twin_swords', desc: 'Dual katana forged from starlight and cyan zephyr.' },
  Cancer: { name: 'Tidal Moonlit Scythe', type: 'scythe', desc: 'Pearl scythe channeling oceanic crests.' },
  Leo: { name: 'Solar Sun Greatsword', type: 'greatsword', desc: 'Colossal golden claymore crowned with a flaming sun.' },
  Virgo: { name: 'Circuit Codex & Arcane Wand', type: 'codex_wand', desc: 'Holographic data tablet and emerald arcane wand.' },
  Libra: { name: 'Astral Dual Chakrams', type: 'chakrams', desc: 'Twin spinning rings of celestial equilibrium.' },
  Scorpio: { name: 'Toxic Stinger Chain-Kama', type: 'chain_blade', desc: 'Venomous sickle linked with barbed astral chain.' },
  Sagittarius: { name: 'Starlight Composite Bow', type: 'bow', desc: 'Piercing astral bow firing radiant constellation arrows.' },
  Capricorn: { name: 'Alpine Crag Halberd', type: 'halberd', desc: 'Heavy horned halberd crafted from Spire bedrock.' },
  Aquarius: { name: 'Zephyr Rapier & Tempest Urn', type: 'rapier_urn', desc: 'Needle-point rapier and storm urn swirling with vortexes.' },
  Pisces: { name: 'Twin-Koi Spirit Scepter', type: 'spirit_scepter', desc: 'Pearl tidal staff with swimming constellation spirits.' }
};

/* ================= Elemental Affinity System (Fire, Wind, Earth, Water) ================= */
const ELEMENT_AFFINITY = {
  Fire: { name: 'Fire', strongVs: 'Wind', weakVs: 'Water', color: '#ff5a3c', bg: 'rgba(255,90,60,0.22)', icon: '🔥', desc: 'Blazes through Wind (+50% DMG)' },
  Wind: { name: 'Wind', strongVs: 'Earth', weakVs: 'Fire', color: '#34d399', bg: 'rgba(52,211,153,0.22)', icon: '🌪️', desc: 'Erodes Earth (+50% DMG)' },
  Earth: { name: 'Earth', strongVs: 'Water', weakVs: 'Wind', color: '#fbbf24', bg: 'rgba(251,191,36,0.22)', icon: '🌿', desc: 'Absorbs Water (+50% DMG)' },
  Water: { name: 'Water', strongVs: 'Fire', weakVs: 'Earth', color: '#38bdf8', bg: 'rgba(56,189,248,0.22)', icon: '💧', desc: 'Extinguishes Fire (+50% DMG)' }
};
ELEMENT_AFFINITY.Air = ELEMENT_AFFINITY.Wind; // Air is synonymous with Wind in the Astral Spire

function getWeaponInfo(p) {
  const g = p ? p.guild : 'Aries';
  const zw = ZODIAC_WEAPONS[g] || ZODIAC_WEAPONS.Aries;
  const wLv = (p && p.upgrades && p.upgrades.weapon) || 0;
  let tier = 'Standard';
  let tierPrefix = '';
  let color = '#94a3b8';
  if (wLv >= 20) { tier = 'Spire Godforge'; tierPrefix = 'Godforge '; color = '#f43f5e'; }
  else if (wLv >= 15) { tier = 'Mythic Celestial'; tierPrefix = 'Mythic '; color = '#c084fc'; }
  else if (wLv >= 10) { tier = 'Supernova Ascendant'; tierPrefix = 'Ascendant '; color = '#fb923c'; }
  else if (wLv >= 7) { tier = 'Astral Sovereign'; tierPrefix = 'Astral '; color = '#facc15'; }
  else if (wLv >= 4) { tier = 'Starlight Infused'; tierPrefix = 'Starlight '; color = '#38bdf8'; }
  else if (wLv >= 1) { tier = 'Refined Alloy'; tierPrefix = 'Refined '; color = '#4ade80'; }

  const fullName = `${tierPrefix}${zw.name}${wLv > 0 ? ' +' + wLv : ''}`;
  const cost = 40 + wLv * 25;
  const nextAtk = 4 + (wLv % 5 === 4 ? 6 : 0);
  return {
    baseName: zw.name,
    fullName,
    tier,
    color,
    level: wLv,
    cost,
    nextAtk,
    type: zw.type,
    desc: zw.desc
  };
}
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

  playAffinityHit() {
    if (!this.sfxOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.init();
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(587, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.connect(g);
      g.connect(this.gainSfx || ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.18);
      setTimeout(() => this.beep(1318, 0.18, 'triangle', 0.12), 40);
    } catch (e) {}
  },

  playForge() {
    if (!this.sfxOn) return;
    this.beep(523, 0.08, 'triangle', 0.1);
    setTimeout(() => this.beep(659, 0.08, 'triangle', 0.09), 65);
    setTimeout(() => this.beep(784, 0.1, 'triangle', 0.11), 130);
    setTimeout(() => this.beep(1046, 0.22, 'sine', 0.14), 195);
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
  const keys = {}, joy = { x: 0, y: 0 }, tb = { j: false, k: false, l: false, p: false, dash: false, bag: false };
  let cur = {}, prev = {}, pend = null;
  const KM = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyJ: 'j', Enter: 'j', KeyE: 'j', KeyF: 'j',
    KeyK: 'k', Backspace: 'k', KeyZ: 'k',
    KeyL: 'l', KeyX: 'l',
    Space: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyC: 'dash', KeyQ: 'dash',
    Escape: 'p', KeyP: 'p',
    KeyB: 'bag', KeyI: 'bag',
    KeyM: 'music',
    Digit1: 'num1', Digit2: 'num2', Digit3: 'num3', Digit4: 'num4', Digit5: 'num5',
    Digit6: 'num6', Digit7: 'num7', Digit8: 'num8', Digit9: 'num9',
    Numpad1: 'num1', Numpad2: 'num2', Numpad3: 'num3', Numpad4: 'num4', Numpad5: 'num5',
    Numpad6: 'num6', Numpad7: 'num7', Numpad8: 'num8', Numpad9: 'num9'
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
        dash: !!keys.dash || tb.dash, p: !!keys.p || tb.p, bag: !!keys.bag || tb.bag, music: !!keys.music
      };
      for (let i = 1; i <= 9; i++) cur['num' + i] = !!keys['num' + i];
      api.cur = cur; api.tap = pend; pend = null;
      if (this.just('music')) {
        AudioSys.toggleMusic();
      }
    },
    just(n) { return !!cur[n] && !prev[n]; },
    justNum() {
      for (let i = 1; i <= 9; i++) {
        if (this.just('num' + i)) return i;
      }
      return null;
    },
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
  btn('bJ', 'j'); btn('bK', 'k'); btn('bL', 'l'); btn('bD', 'dash'); btn('bP', 'p'); btn('bBag', 'bag');

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
  ctx.font = (bold === false ? '500 ' : '700 ') + (size || 14) + 'px "Rajdhani", "M PLUS Rounded 1c", "Segoe UI", sans-serif';
  ctx.textAlign = al || 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
}
function wrap(s, maxW, size) {
  ctx.font = '700 ' + size + 'px "Rajdhani", "M PLUS Rounded 1c", "Segoe UI", sans-serif';
  const words = String(s).split(' '), lines = []; let l = '';
  for (const w of words) { const t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; }
  if (l) lines.push(l); return lines;
}
function panel(x, y, w, h, col) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, 'rgba(10, 16, 38, 0.94)');
  g.addColorStop(1, 'rgba(5, 8, 20, 0.96)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = col || '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = col || '#38bdf8';
  ctx.fillRect(x, y, 6, 2); ctx.fillRect(x, y, 2, 6);
  ctx.fillRect(x + w - 6, y + h - 2, 6, 2); ctx.fillRect(x + w - 2, y + h - 6, 2, 6);
}
function bar(x, y, w, h, v, max, col) {
  ctx.fillStyle = 'rgba(8, 12, 26, 0.9)';
  ctx.fillRect(x, y, w, h);
  const fillW = Math.max(0, w * clamp(v / max, 0, 1));
  if (fillW > 0) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, col);
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, fillW, h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x, y, fillW, Math.max(1, Math.floor(h * 0.35)));
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
/* ================= Anime Character Sprite & Animation System ================= */
const SpriteSys = {
  sheets: new Map(),
  customSprites: new Map(),

  // Load external spritesheet image if provided (allows custom sprite loading with clean fallback)
  loadCustomSheet(id, url) {
    return new Promise((resolve) => {
      if (this.customSprites.has(id)) {
        resolve(this.customSprites.get(id));
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.customSprites.set(id, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn('Custom sprite load fallback for:', id);
        resolve(null);
      };
      img.src = url;
    });
  },

  // Unique cache key based on Zodiac Guild, Outfit, Hair Color, Hair Style, and Weapon Level
  getKey(o) {
    const g = o.guild || 'Aries';
    let out = typeof o.outfit === 'number' ? o.outfit : (OUTFITS.indexOf(o.outfit) >= 0 ? OUTFITS.indexOf(o.outfit) : 0);
    let h = typeof o.hair === 'number' ? o.hair : (HAIRS.indexOf(o.hair) >= 0 ? HAIRS.indexOf(o.hair) : 0);
    const hs = typeof o.hairStyle === 'number' ? o.hairStyle : (o.style || 0);
    const wLv = typeof o.wLevel === 'number' ? Math.min(20, o.wLevel) : (G && G.p && G.p.upgrades ? G.p.upgrades.weapon : 0);
    return `${g}_${out}_${h}_${hs}_w${wLv}`;
  },

  // Generates or retrieves the cached anime sprite sheet canvas with unclipped 80x80 cells
  getOrGenerateSheet(o) {
    const key = this.getKey(o);
    if (this.sheets.has(key)) return this.sheets.get(key);

    const fw = 112, fh = 112;
    const cols = 4, rows = 11;
    const can = document.createElement('canvas');
    can.width = fw * cols;
    can.height = fh * rows;
    const sctx = can.getContext('2d');

    const guild = o.guild || 'Aries';
    const gInfo = GUILDS.find(x => x[0] === guild) || GUILDS[0];
    const elemName = o.element || gInfo[1];
    const elc = o.elc || (ELEM[elemName] ? ELEM[elemName].color : '#38bdf8');
    const outfitCol = typeof o.outfit === 'number' ? OUTFITS[o.outfit % OUTFITS.length] : (o.outfit || OUTFITS[0]);
    const hairCol = typeof o.hair === 'number' ? HAIRS[o.hair % HAIRS.length] : (o.hair || HAIRS[0]);
    const hairStyle = (typeof o.hairStyle === 'number' ? o.hairStyle : (o.style || 0)) % HAIR_STYLES.length;
    const sigil = ZODIAC_SIGILS[guild] || '✦';
    const wLv = typeof o.wLevel === 'number' ? o.wLevel : (G && G.p && G.p.upgrades ? G.p.upgrades.weapon : 0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const fx = c * fw, fy = r * fh;
        sctx.save();
        sctx.translate(fx + 56, fy + 88); // 112x112 anchor: generous 56px lateral and 88px vertical headroom prevents any clipping
        this.renderAnimeFrame(sctx, guild, elemName, elc, outfitCol, hairCol, hairStyle, sigil, wLv, r, c);
        sctx.restore();
      }
    }

    this.sheets.set(key, can);
    return can;
  },

  // Renders a single frame with unique combat stance & animation for each weapon archetype
  renderAnimeFrame(ctx, guild, elemName, elc, outfitCol, hairCol, hairStyle, sigil, wLv, row, frame) {
    const dir = (row === 0 || row === 3 || row === 6 || row === 10) ? 'down'
              : (row === 1 || row === 4 || row === 7) ? 'up' : 'side';

    let anim = 'idle';
    if (row >= 3 && row <= 5) anim = 'walk';
    else if (row >= 6 && row <= 8) anim = 'attack';
    else if (row === 9) anim = 'dash';
    else if (row === 10) anim = 'cast';

    const zw = ZODIAC_WEAPONS[guild] || ZODIAC_WEAPONS.Aries;
    const wType = zw.type;

    let bob = 0, legL = 0, legR = 0, armL = 0, armR = 0, capeW = 0, lean = 0;
    let weaponAngle = 0, eyeSpark = false;
    let attackFx = null, magicCircle = false, sigilGlow = false, auraBurst = false, speedLines = false;
    let blink = false;

    if (anim === 'idle') {
      bob = (frame === 1 || frame === 2) ? 1 : 0;
      capeW = Math.sin(frame * 1.57) * 2.5;
      blink = (frame === 2);
    } else if (anim === 'walk') {
      if (frame === 0) { legL = 3.5; legR = -3; armL = -3; armR = 3; capeW = -3; bob = 0; }
      else if (frame === 1) { legL = 0; legR = 0; armL = 0; armR = 0; capeW = 0; bob = -1; }
      else if (frame === 2) { legL = -3; legR = 3.5; armL = 3; armR = -3; capeW = 3; bob = 0; }
      else { legL = 0; legR = 0; armL = 0; armR = 0; capeW = 0; bob = -1; }
    } else if (anim === 'dash') {
      bob = 1; lean = 6; speedLines = true; capeW = -8; weaponAngle = 1.1;
    } else if (anim === 'cast') {
      magicCircle = true;
      if (frame === 0) { bob = 0; weaponAngle = -0.5; }
      else if (frame === 1) { bob = -1; weaponAngle = -1.6; sigilGlow = true; }
      else if (frame === 2) { bob = -2; weaponAngle = -1.6; sigilGlow = true; auraBurst = true; }
      else { bob = -1; weaponAngle = -1.3; sigilGlow = true; }
    } else if (anim === 'attack') {
      // DISTINCT COMBAT ANIMATIONS FOR DIFFERENT WEAPON ARCHETYPES
      if (wType === 'cleavers' || wType === 'twin_swords') {
        // DUAL BLADES: Cross X-Slash Combo
        if (frame === 0) { bob = 1; lean = -2; eyeSpark = true; capeW = -3; weaponAngle = -0.6; }
        else if (frame === 1) { bob = 2; lean = 4; eyeSpark = true; capeW = 5; weaponAngle = 1.2; attackFx = 'x_cross'; }
        else if (frame === 2) { bob = 1; lean = 2; capeW = 4; weaponAngle = 1.5; attackFx = 'dual_flurry'; }
        else { bob = 0; capeW = 1; weaponAngle = 0.2; }
      } else if (wType === 'greatsword' || wType === 'shield_mace') {
        // HEAVY OVERHEAD: Two-Handed Titan Cleave / Ground Impact
        if (frame === 0) { bob = -2; lean = -4; eyeSpark = true; capeW = -5; weaponAngle = -2.1; } // Raised high behind shoulders
        else if (frame === 1) { bob = 3; lean = 6; eyeSpark = true; capeW = 6; weaponAngle = 0.8; attackFx = 'heavy_slam'; } // Smashes ground!
        else if (frame === 2) { bob = 2; lean = 3; capeW = 4; weaponAngle = 1.1; attackFx = 'ground_tremor'; }
        else { bob = 0; capeW = 1; weaponAngle = 0.1; }
      } else if (wType === 'scythe' || wType === 'halberd') {
        // POLEARM: 360° Crescent Whirlwind Sweep
        if (frame === 0) { bob = 2; lean = -2; eyeSpark = true; capeW = -3; weaponAngle = 1.8; } // Low crouch coil
        else if (frame === 1) { bob = 1; lean = 3; eyeSpark = true; capeW = 6; weaponAngle = -0.5; attackFx = 'crescent_whirl'; } // 360 whirl!
        else if (frame === 2) { bob = 1; lean = 1; capeW = 3; weaponAngle = 0.6; attackFx = 'tidal_sweep'; }
        else { bob = 0; capeW = 1; weaponAngle = 0.1; }
      } else if (wType === 'bow') {
        // ARCHERY: Full Draw & Sniping Starlight Arrow
        if (frame === 0) { bob = 0; lean = -1; eyeSpark = true; capeW = -2; weaponAngle = 0; attackFx = 'bow_aim'; } // Draw bowstring
        else if (frame === 1) { bob = 1; lean = 3; eyeSpark = true; capeW = 5; weaponAngle = 0.1; attackFx = 'arrow_shot'; } // Sonic boom loose!
        else if (frame === 2) { bob = 0; lean = 1; capeW = 2; weaponAngle = 0.1; attackFx = 'arrow_smoke'; }
        else { bob = 0; capeW = 0; weaponAngle = 0; }
      } else if (wType === 'codex_wand') {
        // CYBER MATRIX: Holographic Glyphs & Digital Laser Bolts
        if (frame === 0) { bob = -1; eyeSpark = true; capeW = -2; weaponAngle = -0.4; attackFx = 'codex_charge'; }
        else if (frame === 1) { bob = 0; lean = 2; eyeSpark = true; capeW = 3; weaponAngle = 0.5; attackFx = 'matrix_burst'; }
        else if (frame === 2) { bob = 0; capeW = 2; weaponAngle = 0.3; attackFx = 'cyber_grid'; }
        else { bob = 0; capeW = 0; weaponAngle = 0; }
      } else if (wType === 'chakrams') {
        // CHAKRAMS: Dual Saw-Blade Orbital Boomerang
        if (frame === 0) { bob = 1; eyeSpark = true; capeW = -2; weaponAngle = -0.8; attackFx = 'chakram_spin'; }
        else if (frame === 1) { bob = 1; lean = 3; eyeSpark = true; capeW = 4; weaponAngle = 1.1; attackFx = 'chakram_throw'; }
        else if (frame === 2) { bob = 0; capeW = 2; weaponAngle = 1.3; attackFx = 'chakram_return'; }
        else { bob = 0; capeW = 0; weaponAngle = 0; }
      } else if (wType === 'chain_blade') {
        // CHAIN SICKLE: Scorpion Tail Lash
        if (frame === 0) { bob = 1; eyeSpark = true; capeW = -2; weaponAngle = -0.9; }
        else if (frame === 1) { bob = 1; lean = 4; eyeSpark = true; capeW = 5; weaponAngle = 1.2; attackFx = 'scorpion_lash'; }
        else if (frame === 2) { bob = 0; capeW = 2; weaponAngle = 0.7; attackFx = 'venom_ripple'; }
        else { bob = 0; capeW = 0; weaponAngle = 0; }
      } else if (wType === 'rapier_urn') {
        // RAPIER & URN: Triple Gale Thrust Flurry
        if (frame === 0) { bob = 1; eyeSpark = true; capeW = -2; weaponAngle = -0.2; }
        else if (frame === 1) { bob = 1; lean = 4; eyeSpark = true; capeW = 5; weaponAngle = 0.1; attackFx = 'gale_thrust'; }
        else if (frame === 2) { bob = 0; capeW = 2; weaponAngle = 0.2; attackFx = 'vortex_swirl'; }
        else { bob = 0; capeW = 0; weaponAngle = 0; }
      } else {
        // SPIRIT SCEPTER: Twin Koi Torrent
        if (frame === 0) { bob = -1; eyeSpark = true; capeW = -2; weaponAngle = -0.6; attackFx = 'koi_call'; }
        else if (frame === 1) { bob = 0; lean = 2; eyeSpark = true; capeW = 4; weaponAngle = 0.7; attackFx = 'koi_torrent'; }
        else if (frame === 2) { bob = 0; capeW = 2; weaponAngle = 0.4; attackFx = 'water_splash'; }
        else { bob = 0; capeW = 0; weaponAngle = 0; }
      }
    }

    // 1. Soft anime drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ground Magic Circles & Speed Streaks
    if (magicCircle) {
      ctx.strokeStyle = elc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 1, 16, 5.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (speedLines) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-20, -3); ctx.lineTo(-8, -3);
      ctx.moveTo(-24, -9); ctx.lineTo(-12, -9);
      ctx.moveTo(-18, -15); ctx.lineTo(-7, -15);
      ctx.stroke();
    }
    if (auraBurst) {
      ctx.fillStyle = elc; ctx.globalAlpha = 0.28;
      ctx.beginPath(); ctx.arc(0, -18 + bob, 24, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 2. Flowing Cape (Back layer)
    if (dir !== 'up') {
      ctx.fillStyle = outfitCol;
      ctx.beginPath();
      ctx.moveTo(dir === 'side' ? -4 : -5, -14 + bob);
      ctx.lineTo(dir === 'side' ? -11 + capeW : -8 + capeW, -3 + bob);
      ctx.lineTo(dir === 'side' ? -7 + capeW : 8 + capeW, -3 + bob);
      ctx.lineTo(dir === 'side' ? 2 : 5, -14 + bob);
      ctx.closePath(); ctx.fill();

      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dir === 'side' ? -11 + capeW : -8 + capeW, -3 + bob);
      ctx.lineTo(dir === 'side' ? -7 + capeW : 8 + capeW, -3 + bob);
      ctx.stroke();

      ctx.fillStyle = '#fde047'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(sigil, dir === 'side' ? -7 + capeW * 0.7 : capeW * 0.6, -6 + bob);
    }

    // 3. Adventurer Boots & Legs
    ctx.fillStyle = '#1b1e2e';
    ctx.fillRect(-5, -6 + legL, 3.8, 6.5 - legL);
    ctx.fillRect(1.2, -6 + legR, 3.8, 6.5 - legR);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-5, -6 + legL, 3.8, 1.4);
    ctx.fillRect(1.2, -6 + legR, 3.8, 1.4);
    ctx.fillStyle = elc;
    ctx.fillRect(-5, 0, 3.8, 1);
    ctx.fillRect(1.2, 0, 3.8, 1);

    // 4. Tunic & Guild Armor Torso
    ctx.fillStyle = outfitCol;
    ctx.fillRect(-6, -16 + bob, 12, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; ctx.fillRect(-6, -16 + bob, 12, 2.2);
    ctx.fillStyle = '#b45309'; ctx.fillRect(-6, -8 + bob, 12, 2.2);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(-1.5, -9 + bob, 3, 3.2);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-8, -16 + bob, 2.6, 3.8);
    ctx.fillRect(5.4, -16 + bob, 2.6, 3.8);

    // Elemental Mana Core Gem
    ctx.fillStyle = elc; ctx.beginPath(); ctx.arc(0, -12 + bob, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-0.6, -12.6 + bob, 0.8, 0, Math.PI * 2); ctx.fill();

    // Cape (Front layer when facing up)
    if (dir === 'up') {
      ctx.fillStyle = outfitCol;
      ctx.beginPath();
      ctx.moveTo(-5, -15 + bob); ctx.lineTo(-8 + capeW, -3 + bob);
      ctx.lineTo(8 + capeW, -3 + bob); ctx.lineTo(5, -15 + bob);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fde047'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(sigil, capeW, -6 + bob);
    }

    // 5. Anime Head & Face
    ctx.fillStyle = '#ffe2d1';
    ctx.fillRect(-5.5, -25 + bob, 11, 9.5);
    ctx.fillStyle = 'rgba(255, 120, 140, 0.45)';
    ctx.fillRect(-5, -19 + bob, 2.2, 1.4); ctx.fillRect(2.8, -19 + bob, 2.2, 1.4);

    if (dir === 'up') {
      ctx.fillStyle = hairCol;
      ctx.fillRect(-6, -26 + bob, 12, 11);
    } else {
      if (blink) {
        ctx.strokeStyle = '#1e1b18'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(-2.5, -20.5 + bob, 1.5, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(2.5, -20.5 + bob, 1.5, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      } else {
        ctx.fillStyle = '#1c1917'; ctx.fillRect(-4, -22 + bob, 3.2, 1); ctx.fillRect(0.8, -22 + bob, 3.2, 1);
        ctx.fillStyle = elc; ctx.fillRect(-3.6, -21 + bob, 2.6, 3); ctx.fillRect(1.1, -21 + bob, 2.6, 3);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-3.1, -20.2 + bob, 1.7, 1.7); ctx.fillRect(1.5, -20.2 + bob, 1.7, 1.7);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-3.6, -21 + bob, 1.1, 1.1); ctx.fillRect(1.1, -21 + bob, 1.1, 1.1);
        ctx.fillRect(-2.2, -19.3 + bob, 0.7, 0.7); ctx.fillRect(2.5, -19.3 + bob, 0.7, 0.7);
      }
      if (eyeSpark) {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(3.2, -22.5 + bob, 2, 2);
        ctx.fillStyle = elc; ctx.fillRect(3.7, -23 + bob, 1, 3); ctx.fillRect(2.7, -22 + bob, 3, 1);
      }
      ctx.fillStyle = '#e07a6d'; ctx.fillRect(-0.8, -17.2 + bob, 1.6, 0.8);
    }

    // 6. Hair & Hairstyle
    ctx.fillStyle = hairCol;
    ctx.fillRect(-6, -28 + bob, 12, 5.5);
    if (hairStyle === 0) {
      ctx.beginPath();
      ctx.moveTo(-5, -28 + bob); ctx.lineTo(-3, -33 + bob); ctx.lineTo(-1, -28 + bob);
      ctx.moveTo(-1, -28 + bob); ctx.lineTo(1, -34 + bob); ctx.lineTo(3, -28 + bob);
      ctx.moveTo(3, -28 + bob); ctx.lineTo(5, -32 + bob); ctx.lineTo(6.5, -28 + bob);
      ctx.fill();
      ctx.fillRect(-7, -25 + bob, 2.5, 7); ctx.fillRect(4.5, -25 + bob, 2.5, 7);
      ctx.fillRect(-3.5, -25 + bob, 2.5, 3.5); ctx.fillRect(1, -25 + bob, 2.5, 3.5);
    } else if (hairStyle === 1) {
      ctx.fillRect(-6.5, -25 + bob, 2.5, 6); ctx.fillRect(4, -25 + bob, 2.5, 6);
      ctx.fillRect(-2.5, -25 + bob, 5, 3);
      const tailBob = Math.sin(frame * 1.5) * 2;
      ctx.fillRect(-9.5, -27 + bob, 3.5, 12 + tailBob); ctx.fillRect(6, -27 + bob, 3.5, 12 - tailBob);
      ctx.fillStyle = elc; ctx.fillRect(-9, -27 + bob, 2.5, 2); ctx.fillRect(6.5, -27 + bob, 2.5, 2);
      ctx.fillStyle = hairCol;
    } else if (hairStyle === 2) {
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-1.5, -30 + bob, 3, 2.5);
      ctx.fillStyle = hairCol; ctx.fillRect(-2, -34 + bob, 4, 4.5);
      ctx.fillRect(-4 + capeW * 0.4, -32 + bob, 3.5, 14);
      ctx.fillRect(-6.5, -25 + bob, 2.5, 8); ctx.fillRect(4, -25 + bob, 2.5, 8);
    } else if (hairStyle === 3) {
      ctx.fillRect(-7.5, -26 + bob, 3, 9.5); ctx.fillRect(4.5, -26 + bob, 3, 9.5);
      ctx.fillRect(-5, -25 + bob, 10, 3.5);
    } else if (hairStyle === 4) {
      ctx.fillRect(-7.5, -27 + bob, 2.8, 8.5); ctx.fillRect(4.7, -27 + bob, 2.8, 8.5);
      ctx.beginPath();
      ctx.moveTo(-6, -28 + bob); ctx.lineTo(-8.5, -31 + bob); ctx.lineTo(-4, -28 + bob);
      ctx.moveTo(4, -28 + bob); ctx.lineTo(7.5, -31 + bob); ctx.lineTo(5, -28 + bob);
      ctx.fill();
      ctx.fillRect(-4, -25 + bob, 3.2, 4); ctx.fillRect(1, -25 + bob, 3.2, 3.5);
    } else {
      ctx.fillRect(-8, -26 + bob, 3.2, 17); ctx.fillRect(4.8, -26 + bob, 3.2, 17);
      ctx.fillRect(-4.5, -25 + bob, 9, 3);
      ctx.fillStyle = '#fde047'; ctx.fillRect(-6.5, -26 + bob, 2, 2); ctx.fillRect(4.5, -26 + bob, 2, 2);
      ctx.fillStyle = hairCol;
    }
    // Angel ring
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; ctx.fillRect(-4, -27 + bob, 8, 1.2);

    // 7. Custom Zodiac Guild Weapon Rendering
    const wx = (dir === 'side' ? 6 : (dir === 'up' ? -8 : 7)) + armR + lean;
    const wy = -14 + bob;
    this.drawWeapon(ctx, guild, elc, wx, wy, weaponAngle, dir, bob, anim, wLv);

    // 8. DISTINCT COMBAT FX RENDERING FOR WEAPON TYPES
    if (attackFx) {
      ctx.save();
      if (attackFx === 'x_cross') {
        // Dual X-Slash
        ctx.strokeStyle = elc; ctx.lineWidth = 4 + (wLv >= 5 ? 2 : 0);
        ctx.beginPath(); ctx.moveTo(wx - 10, wy - 18); ctx.lineTo(wx + 22, wy + 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + 22, wy - 18); ctx.lineTo(wx - 10, wy + 14); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wx - 7, wy - 15); ctx.lineTo(wx + 19, wy + 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + 19, wy - 15); ctx.lineTo(wx - 7, wy + 11); ctx.stroke();
        // Spark explosion
        ctx.fillStyle = '#fde047';
        ctx.fillRect(wx + 6, wy - 2, 4, 4); ctx.fillRect(wx + 14, wy - 8, 2, 2); ctx.fillRect(wx - 4, wy + 8, 2, 2);
      } else if (attackFx === 'dual_flurry') {
        ctx.strokeStyle = elc; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(wx + 8, wy - 2, 16, -1.2, 1.2); ctx.stroke();
      } else if (attackFx === 'heavy_slam') {
        // Colossal Vertical Cleave Pillar + Ground Shockwave
        ctx.fillStyle = elc;
        ctx.beginPath();
        ctx.moveTo(wx + 4, -4); ctx.lineTo(wx + 16, -42); ctx.lineTo(wx + 26, -4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(wx + 8, -4); ctx.lineTo(wx + 16, -34); ctx.lineTo(wx + 22, -4);
        ctx.closePath(); ctx.fill();
        // Ground Shockwave
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(wx + 16, 2, 18, 5, 0, 0, Math.PI * 2); ctx.stroke();
        // Erupting Rock Shards
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(wx + 4, -8, 3, 3); ctx.fillRect(wx + 26, -10, 3, 3); ctx.fillRect(wx + 32, -4, 2, 2);
      } else if (attackFx === 'crescent_whirl') {
        // 360° Crescent Whirlwind Blade Wave
        ctx.strokeStyle = elc; ctx.lineWidth = 5 + (wLv >= 5 ? 2 : 0);
        ctx.beginPath(); ctx.arc(0, -10, 26, -2.6, 2.2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -10, 25, -2.4, 2.0); ctx.stroke();
        ctx.fillStyle = '#e0f2fe';
        for (let i = 0; i < 4; i++) {
          const a = i * 1.5; ctx.fillRect(Math.cos(a) * 28, -10 + Math.sin(a) * 16, 2, 2);
        }
      } else if (attackFx === 'arrow_shot') {
        // Supersonic Piercing Constellation Beam
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(wx + 4, wy); ctx.lineTo(wx + 34, wy); ctx.stroke();
        ctx.strokeStyle = elc; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(wx + 4, wy); ctx.lineTo(wx + 34, wy); ctx.stroke();
        // Arrow head
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(wx + 36, wy); ctx.lineTo(wx + 30, wy - 4); ctx.lineTo(wx + 30, wy + 4);
        ctx.closePath(); ctx.fill();
        // Sonic boom rings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(wx + 12, wy, 4, 8, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(wx + 22, wy, 3, 6, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (attackFx === 'matrix_burst') {
        // Cyber Matrix Laser Bolts & Hexagons
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wx + 8, wy - 4); ctx.lineTo(wx + 26, wy - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + 8, wy + 2); ctx.lineTo(wx + 28, wy + 2); ctx.stroke();
        // Floating Hexagons
        ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1;
        ctx.strokeRect(wx + 18, wy - 12, 8, 8); ctx.strokeRect(wx + 24, wy + 4, 6, 6);
      } else if (attackFx === 'chakram_throw') {
        // Orbital Saw-Blade Rings
        ctx.strokeStyle = elc; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(wx + 18, wy - 6, 12, 6, 0.3, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(wx + 24, wy + 6, 10, 5, -0.3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(wx + 22, wy - 8, 3, 3); ctx.fillRect(wx + 28, wy + 4, 3, 3);
      } else if (attackFx === 'scorpion_lash') {
        // Barbed Scorpion Chain Strike
        ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 14, wy - 8, wx + 28, wy);
        ctx.stroke();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(wx + 28, wy); ctx.lineTo(wx + 34, wy - 4); ctx.lineTo(wx + 32, wy + 4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e879f9'; ctx.fillRect(wx + 30, wy + 4, 2, 3);
      } else if (attackFx === 'gale_thrust') {
        // Triple Gale Thrust Vacuum Cone
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(wx + 4, wy - 4); ctx.lineTo(wx + 26, wy - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + 4, wy); ctx.lineTo(wx + 30, wy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + 4, wy + 4); ctx.lineTo(wx + 26, wy + 4); ctx.stroke();
        ctx.strokeStyle = elc; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(wx + 20, wy, 8, -1.2, 1.2); ctx.stroke();
      } else if (attackFx === 'koi_torrent') {
        // Swimming Spirit Koi Wave Torrent
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.beginPath();
        ctx.ellipse(wx + 18, wy - 5, 8, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(wx + 22, wy + 5, 8, 4, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx + 24, wy - 6, 2, 2); ctx.fillRect(wx + 28, wy + 4, 2, 2);
      }
      ctx.restore();
    }

    // 9. Constellation Sigil Glow in Cast
    if (sigilGlow) {
      ctx.fillStyle = '#fde047'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(sigil, 0, -38 + bob);
      ctx.strokeStyle = elc; ctx.lineWidth = 0.8; ctx.strokeText(sigil, 0, -38 + bob);
    }
  },

  // Draws distinctive anime weapons for each Zodiac Guild with upgrade visual tiers
  drawWeapon(ctx, guild, elc, wx, wy, angle, dir, bob, anim, wLv) {
    ctx.save();
    ctx.translate(wx, wy);
    if (angle) ctx.rotate(angle);

    // Weapon Level Visual Upgrade Aura
    if (wLv >= 3) {
      ctx.shadowColor = elc;
      ctx.shadowBlur = wLv >= 8 ? 10 : 5;
    }

    if (guild === 'Aries') {
      // Dual Magma Ram Cleavers
      ctx.fillStyle = '#262626'; ctx.fillRect(-2, -20, 4, 20);
      ctx.fillStyle = '#ff5a3c'; ctx.fillRect(-1, -18, 2, 16);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(-1, -20); ctx.lineTo(8, -15); ctx.lineTo(6, -6); ctx.lineTo(-1, -2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#fde047'; ctx.fillRect(1, -14, 2, 5);
      if (wLv >= 1) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1; ctx.strokeRect(-1, -20, 8, 16); }
    } else if (guild === 'Taurus') {
      // Titan Granite Greatshield & Spiked Mace
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-11, -16, 15, 22);
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.4; ctx.strokeRect(-11, -16, 15, 22);
      ctx.fillStyle = '#eab308'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♉', -3, 0);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(6, -18, 3, 20);
      ctx.fillStyle = '#475569'; ctx.fillRect(4, -23, 7, 7);
      if (wLv >= 4) { ctx.fillStyle = '#fde047'; ctx.fillRect(6, -21, 3, 3); }
    } else if (guild === 'Gemini') {
      // Twin Starlight Blades (Cyan & Gold Katana)
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-3, -24, 2.5, 24);
      ctx.fillStyle = wLv >= 4 ? '#e0f2fe' : '#38bdf8'; ctx.fillRect(-2.5, -23, 1.5, 22);
      ctx.fillStyle = '#eab308'; ctx.fillRect(3, -24, 2.5, 24);
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#fde047'; ctx.fillRect(3.5, -23, 1.5, 22);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-4, -2, 10, 2.5);
    } else if (guild === 'Cancer') {
      // Tidal Moonlit Scythe
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, -28, 2.5, 28);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(1, -27, 14, -2.4, 0.4); ctx.lineTo(1, -23);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = wLv >= 4 ? '#fef08a' : '#f8fafc'; ctx.beginPath(); ctx.arc(1, -27, 3.5, 0, Math.PI * 2); ctx.fill();
    } else if (guild === 'Leo') {
      // Solar Sun Greatsword
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-4, -30, 8, 28);
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#fef08a'; ctx.fillRect(-2, -28, 4, 24);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(-6, -4, 12, 4);
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, -3, 3, 0, Math.PI * 2); ctx.fill();
      if (wLv >= 1) { ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 1.2; ctx.strokeRect(-4, -30, 8, 28); }
    } else if (guild === 'Virgo') {
      // Circuit Codex & Arcane Wand
      ctx.fillStyle = '#84cc16'; ctx.fillRect(2, -22, 2.2, 22);
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#d9f99d'; ctx.fillRect(1.5, -24, 3.5, 3.5);
      // Floating Holographic Codex
      ctx.fillStyle = 'rgba(132, 204, 22, 0.85)'; ctx.fillRect(-13, -18, 12, 16);
      ctx.strokeStyle = '#bef264'; ctx.lineWidth = 1.2; ctx.strokeRect(-13, -18, 12, 16);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-11, -14, 8, 1.2); ctx.fillRect(-11, -11, 5, 1.2);
    } else if (guild === 'Libra') {
      // Dual Astral Chakrams
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(-2, -14, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = wLv >= 4 ? '#ffffff' : '#fde047'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(6, -11, 7, 0, Math.PI * 2); ctx.stroke();
    } else if (guild === 'Scorpio') {
      // Toxic Stinger Chain-Kama
      ctx.fillStyle = '#a855f7'; ctx.fillRect(-1, -20, 2.5, 20);
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.moveTo(-1, -20); ctx.lineTo(10, -16); ctx.lineTo(8, -8); ctx.lineTo(-1, -13);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#c084fc'; ctx.fillRect(2, -15, 2.5, 2.5);
    } else if (guild === 'Sagittarius') {
      // Starlight Composite Bow & Arrow
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(2, -12, 14, -1.3, 1.3); ctx.stroke();
      ctx.strokeStyle = wLv >= 4 ? '#67e8f9' : '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(2, -25); ctx.lineTo(2, 1); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(1, -13, 9, 2);
    } else if (guild === 'Capricorn') {
      // Alpine Crag Halberd
      ctx.fillStyle = '#78716c'; ctx.fillRect(0, -30, 2.8, 30);
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.moveTo(1, -30); ctx.lineTo(9, -25); ctx.lineTo(7, -16); ctx.lineTo(1, -21);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#fbbf24'; ctx.fillRect(1, -31, 2.5, 4.5);
    } else if (guild === 'Aquarius') {
      // Zephyr Rapier & Tempest Urn
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(2, -28, 2, 28);
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#38bdf8'; ctx.fillRect(0, -3, 7, 2.8);
      // Floating Tempest Urn
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-11, -15, 9, 11);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2; ctx.strokeRect(-11, -15, 9, 11);
    } else {
      // Pisces: Twin-Koi Spirit Scepter
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, -28, 2.5, 28);
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(1, -28, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = wLv >= 4 ? '#ffffff' : '#38bdf8';
      ctx.beginPath(); ctx.arc(1, -28, 4.2, 0, Math.PI * 2); ctx.fill();
    }

    // Orbiting Starlight Sparks for Upgraded Weapons
    if (wLv >= 6) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -26, 1.8, 1.8); ctx.fillRect(8, -12, 1.8, 1.8);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(4, -32, 2, 2);
    }

    ctx.restore();
  },

  // Main draw method that renders character from cached sprite sheet
  drawChar(targetCtx, x, y, o, t, sc) {
    sc = sc || 1.0;
    const fw = 112, fh = 112;

    // Determine Action
    let anim = 'idle';
    if (o.action) {
      anim = o.action;
    } else if (o.atkT > 0) {
      anim = 'attack';
    } else if (o.dashT > 0) {
      anim = 'dash';
    } else if (o.lHold > 0.05) {
      anim = 'cast';
    } else if (o.moving) {
      anim = 'walk';
    }

    // Determine Direction
    const up = o.fy < -0.4;
    const down = o.fy > 0.4;
    const facingLeft = o.fx < 0;

    let row = 0;
    if (anim === 'idle') {
      row = up ? 1 : (down ? 0 : 2);
    } else if (anim === 'walk') {
      row = up ? 4 : (down ? 3 : 5);
    } else if (anim === 'attack') {
      row = up ? 7 : (down ? 6 : 8);
    } else if (anim === 'dash') {
      row = 9;
    } else if (anim === 'cast') {
      row = 10;
    }

    // Frame Calculation
    let col = 0;
    if (anim === 'idle') {
      col = Math.floor(t * 3.5) % 4;
    } else if (anim === 'walk') {
      col = Math.floor(t * 8) % 4;
    } else if (anim === 'attack') {
      col = o.atkT !== undefined ? clamp(Math.floor((1 - o.atkT / 0.18) * 4), 0, 3) : Math.floor(t * 8) % 4;
    } else if (anim === 'dash') {
      col = o.dashT !== undefined ? clamp(Math.floor((1 - o.dashT / 0.25) * 4), 0, 3) : Math.floor(t * 8) % 4;
    } else if (anim === 'cast') {
      col = Math.floor(t * 6) % 4;
    }

    const sheet = this.getOrGenerateSheet(o);
    const sx = col * fw;
    const sy = row * fh;

    targetCtx.save();
    targetCtx.translate(Math.round(x), Math.round(y));
    if (sc !== 1.0) targetCtx.scale(sc, sc);

    // Flip horizontally when facing left
    if (facingLeft && (row === 2 || row === 5 || row === 8 || row === 9)) {
      targetCtx.scale(-1, 1);
    }

    // Dash ethereal afterimage streak
    if (anim === 'dash') {
      targetCtx.globalAlpha = 0.35;
      targetCtx.drawImage(sheet, sx, sy, fw, fh, -56 - 16, -88, fw, fh);
      targetCtx.globalAlpha = 1.0;
    }

    // Draw Character Frame from cached sprite canvas without any clipping
    targetCtx.drawImage(sheet, sx, sy, fw, fh, -56, -88, fw, fh);

    targetCtx.restore();
  }
};

function drawChar(x, y, o, t, sc) {
  SpriteSys.drawChar(ctx, x, y, o, t, sc);
}

function drawFullAnimeCharacter(cx, cy, sc, elName, t, opt) {
  sc = sc || 1.0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);

  const isFire = elName === 'Fire' && (opt && opt.isYuna);
  const isWater = elName === 'Water' && (opt && opt.isYuki);

  if (isFire) {
    // ==========================================
    // YUNA - PYROMANCER VANGUARD (User Reference)
    // ==========================================
    // Ground flame aura & embers
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    ctx.beginPath(); ctx.ellipse(0, 75, 55, 16, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const ex = Math.sin(t * 3.5 + i * 1.3) * 45, ey = 75 - ((t * 40 + i * 18) % 45);
      ctx.fillStyle = i % 2 === 0 ? '#ff5a3c' : '#facc15';
      ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, Math.PI * 2); ctx.fill();
    }

    // Heavy Mechanized Rocket Flame Hammer / Staff
    ctx.save();
    ctx.translate(-15, 20);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#262626'; ctx.fillRect(-95, -4, 155, 8);
    ctx.fillStyle = '#404040'; ctx.fillRect(-90, -3, 145, 2.5);
    ctx.fillStyle = '#171717'; ctx.fillRect(60, -6, 12, 12);
    // Turbine Hammer Head
    const hx = -110, hy = -20;
    ctx.fillStyle = '#1e1e24'; ctx.fillRect(hx, hy, 36, 40);
    ctx.strokeStyle = '#0a0a0c'; ctx.lineWidth = 2.5; ctx.strokeRect(hx, hy, 36, 40);
    ctx.fillStyle = '#ff5a3c'; ctx.beginPath(); ctx.arc(hx + 18, hy + 20, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(hx + 18, hy + 20, 6, 0, Math.PI * 2); ctx.fill();
    // Thruster exhaust ports
    ctx.fillStyle = '#262626'; ctx.fillRect(hx + 8, hy - 7, 8, 7); ctx.fillRect(hx + 22, hy + 40, 8, 7);
    // Roaring Giant Flame Crest
    const flw = Math.sin(t * 12) * 6;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx - 28, hy - 25, hx - 45 - flw, hy - 8);
    ctx.quadraticCurveTo(hx - 32, hy + 18, hx - 52 - flw, hy + 28);
    ctx.quadraticCurveTo(hx - 25, hy + 42, hx, hy + 40);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 8); ctx.quadraticCurveTo(hx - 18, hy - 6, hx - 30, hy + 6);
    ctx.quadraticCurveTo(hx - 18, hy + 20, hx - 35, hy + 24);
    ctx.quadraticCurveTo(hx - 10, hy + 30, hx, hy + 28);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Legs & Cyber Boots with Red Vents
    ctx.fillStyle = '#ffe0cc'; ctx.fillRect(-15, 30, 11, 24); ctx.fillRect(4, 30, 11, 24);
    ctx.fillStyle = '#1c1917'; ctx.fillRect(-17, 48, 14, 28); ctx.fillRect(3, 48, 14, 28);
    ctx.fillStyle = '#ff5a3c'; ctx.fillRect(-16, 54, 12, 2.5); ctx.fillRect(4, 54, 12, 2.5);
    ctx.fillRect(-17, 72, 14, 3.5); ctx.fillRect(3, 72, 14, 3.5);

    // Dark Pleated Cyber Skirt with Neon Slits
    ctx.fillStyle = '#171717';
    ctx.beginPath(); ctx.moveTo(-22, 22); ctx.lineTo(-28, 45); ctx.lineTo(28, 45); ctx.lineTo(22, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-16, 26, 2.5, 17); ctx.fillRect(-3, 26, 2.5, 17); ctx.fillRect(10, 26, 2.5, 17);

    // Black Tactical High-Collar Jacket
    ctx.fillStyle = '#1f2937'; ctx.fillRect(-19, -8, 38, 32);
    ctx.fillStyle = '#111827'; ctx.fillRect(-13, -5, 26, 28);
    ctx.fillStyle = '#ff5a3c'; ctx.fillRect(-13, 6, 26, 2); ctx.fillRect(-1, -5, 2.5, 28);

    // Arms & Armored Gauntlets
    ctx.fillStyle = '#1f2937'; ctx.fillRect(-27, -4, 11, 20); ctx.fillRect(16, -2, 11, 20);
    ctx.fillStyle = '#111827'; ctx.fillRect(-29, 10, 13, 12); ctx.fillRect(16, 12, 13, 12);
    ctx.fillStyle = '#ff5a3c'; ctx.fillRect(-28, 15, 11, 2.5); ctx.fillRect(17, 17, 11, 2.5);
    ctx.fillStyle = '#ffe0cc'; ctx.beginPath(); ctx.arc(-22, 24, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, 26, 4.5, 0, Math.PI * 2); ctx.fill();

    // High Collar
    ctx.fillStyle = '#111827'; ctx.fillRect(-14, -14, 28, 8);
    ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 1.2; ctx.strokeRect(-14, -14, 28, 8);

    // Anime Head & Grinning Face
    ctx.fillStyle = '#ffe0cc';
    ctx.beginPath();
    ctx.moveTo(-15, -30); ctx.lineTo(-15, -12); ctx.lineTo(0, -2); ctx.lineTo(15, -12); ctx.lineTo(15, -30);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255, 100, 130, 0.45)';
    ctx.beginPath(); ctx.ellipse(-8, -10, 3.5, 1.8, 0, 0, Math.PI * 2); ctx.ellipse(8, -10, 3.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    // Confident Sharp Anime Grin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(3, -4); ctx.lineTo(-3, -4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.2; ctx.stroke();

    // Amber Anime Eyes
    const drawEyeF = (ex, ey) => {
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(ex, ey - 2, 5.5, Math.PI + 0.2, Math.PI * 2 - 0.1); ctx.stroke();
      const g = ctx.createLinearGradient(ex, ey - 2, ex, ey + 6);
      g.addColorStop(0, '#7c2d12'); g.addColorStop(0.35, '#f97316'); g.addColorStop(1, '#fde047');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, ey + 2, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.ellipse(ex, ey + 2, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex - 1.2, ey, 1.5, 0, Math.PI * 2); ctx.fill();
    };
    drawEyeF(-7, -18); drawEyeF(7, -18);

    // Fiery Orange Hair & Giant Twintails
    ctx.fillStyle = '#ea580c';
    ctx.beginPath(); ctx.arc(0, -31, 19, Math.PI, 0); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-19, -31); ctx.lineTo(-11, -16); ctx.lineTo(-6, -24);
    ctx.lineTo(0, -14); ctx.lineTo(6, -24); ctx.lineTo(11, -16); ctx.lineTo(19, -31);
    ctx.closePath(); ctx.fill();

    // Fluffy Twintails
    const tw = Math.sin(t * 8) * 2.5;
    ctx.beginPath();
    ctx.moveTo(-17, -31); ctx.quadraticCurveTo(-38, -54 + tw, -55, -40);
    ctx.quadraticCurveTo(-60, -22, -40, -14); ctx.quadraticCurveTo(-52, -4, -36, 4);
    ctx.quadraticCurveTo(-28, -6, -18, -23); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(17, -31); ctx.quadraticCurveTo(38, -54 - tw, 55, -40);
    ctx.quadraticCurveTo(60, -22, 40, -14); ctx.quadraticCurveTo(52, -4, 36, 4);
    ctx.quadraticCurveTo(28, -6, 18, -23); ctx.closePath(); ctx.fill();
    // Highlights
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.ellipse(-38, -35, 8, 2.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(38, -35, 8, 2.5, 0.4, 0, Math.PI * 2); ctx.fill();

  } else if (isWater) {
    // ==========================================
    // YUKI - HYDROMANCER HEALER (User Reference)
    // ==========================================
    // Water puddle ring & tornadoes
    const wPulse = Math.sin(t * 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.beginPath(); ctx.ellipse(0, 75, 60, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(0, 75, 56 + wPulse * 2, 15 + wPulse * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
    // Mini tornadoes
    const vt = (vx, vy) => {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.65)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(vx, vy - i * 5, 12 - i * 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
    };
    vt(-40, 72); vt(40, 72);

    // Ornate Celestial Water Staff
    ctx.save();
    ctx.translate(35, 10);
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-2.5, -65, 5, 130);
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, -66, 13, -2.2, 2.2); ctx.stroke();
    // Swirling water orb
    ctx.save();
    ctx.translate(0, -66);
    ctx.rotate(t * 4);
    const orbG = ctx.createRadialGradient(0, 0, 1.5, 0, 0, 14);
    orbG.addColorStop(0, '#ffffff'); orbG.addColorStop(0.4, '#38bdf8'); orbG.addColorStop(1, '#0284c7');
    ctx.fillStyle = orbG; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // Cascading Light Blue Hair (Back layer)
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(-20, -18); ctx.quadraticCurveTo(-52, 10, -36, 62);
    ctx.quadraticCurveTo(-28, 80, -16, 72); ctx.quadraticCurveTo(-36, 45, -16, 14);
    ctx.closePath(); ctx.fill();

    // Legs & Winged Boots
    ctx.fillStyle = '#ffe0cc'; ctx.fillRect(-13, 30, 10, 24); ctx.fillRect(3, 30, 10, 24);
    ctx.fillStyle = '#0e7490'; ctx.fillRect(-15, 46, 12, 30); ctx.fillRect(3, 46, 12, 30);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(-15, 46, 12, 2.5); ctx.fillRect(3, 46, 12, 2.5);
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath(); ctx.moveTo(-15, 72); ctx.lineTo(-21, 66); ctx.lineTo(-15, 69);
    ctx.moveTo(15, 72); ctx.lineTo(21, 66); ctx.lineTo(15, 69); ctx.fill();

    // Split Teal & Navy Mage Dress
    ctx.fillStyle = '#0891b2';
    ctx.beginPath(); ctx.moveTo(-19, 20); ctx.lineTo(-30, 56); ctx.lineTo(30, 56); ctx.lineTo(19, 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#164e63';
    ctx.beginPath(); ctx.moveTo(-14, 20); ctx.lineTo(-19, 54); ctx.lineTo(19, 54); ctx.lineTo(14, 20); ctx.closePath(); ctx.fill();

    // Bodice
    ctx.fillStyle = '#0e7490'; ctx.fillRect(-16, -4, 32, 24);
    ctx.fillStyle = '#06b6d4'; ctx.fillRect(-10, -1, 20, 20);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.2; ctx.strokeRect(-10, -1, 20, 20);

    // Sleeves
    ctx.fillStyle = '#0891b2'; ctx.fillRect(-24, 2, 8, 20); ctx.fillRect(16, 2, 8, 20);
    ctx.fillStyle = '#ffe0cc'; ctx.beginPath(); ctx.arc(-20, 24, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(34, 12, 4, 0, Math.PI * 2); ctx.fill();

    // Anime Face
    ctx.fillStyle = '#ffe0cc';
    ctx.beginPath(); ctx.moveTo(-13, -28); ctx.lineTo(-13, -12); ctx.lineTo(0, -2); ctx.lineTo(13, -12); ctx.lineTo(13, -28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255, 110, 140, 0.35)';
    ctx.beginPath(); ctx.ellipse(-7, -10, 3, 1.5, 0, 0, Math.PI * 2); ctx.ellipse(7, -10, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(0, -7, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();

    // Sapphire Eyes
    const drawEyeW = (ex, ey) => {
      ctx.strokeStyle = '#0c4a6e'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(ex, ey - 2, 5, Math.PI + 0.3, Math.PI * 2 - 0.1); ctx.stroke();
      const g = ctx.createLinearGradient(ex, ey - 2, ex, ey + 5);
      g.addColorStop(0, '#0c4a6e'); g.addColorStop(0.35, '#0284c7'); g.addColorStop(1, '#67e8f9');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, ey + 2, 3.8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#082f49'; ctx.beginPath(); ctx.ellipse(ex, ey + 2, 1.8, 2.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex - 1.2, ey, 1.5, 0, Math.PI * 2); ctx.fill();
    };
    drawEyeW(-6, -17); drawEyeW(6, -17);

    // Cascading Light Blue Hair & Bangs
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath(); ctx.arc(0, -29, 18, Math.PI, 0); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-18, -29); ctx.lineTo(-11, -16); ctx.lineTo(-6, -22);
    ctx.lineTo(0, -14); ctx.lineTo(6, -22); ctx.lineTo(11, -16); ctx.lineTo(18, -29);
    ctx.closePath(); ctx.fill();
    // Flowing hair strands
    ctx.beginPath();
    ctx.moveTo(14, -25); ctx.quadraticCurveTo(36, 0, 28, 55);
    ctx.quadraticCurveTo(22, 70, 14, 62); ctx.quadraticCurveTo(24, 32, 12, 10);
    ctx.closePath(); ctx.fill();

    // Traditional Hairpins with Hanging Beads
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-11, -33); ctx.lineTo(-19, -43);
    ctx.moveTo(-6, -35); ctx.lineTo(-14, -45);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(-21, -40, 2.2, 0, Math.PI * 2); ctx.fill();

    // Diadem
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(0, -27, 12, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(0, -32, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath(); ctx.ellipse(0, -33, 11, 2, 0, 0, Math.PI * 2); ctx.fill();

  } else {
    // Custom Anime Character with chosen Zodiac Guild & animations
    const rad = 38;
    const elc = ELEM[elName] ? ELEM[elName].color : '#38bdf8';
    ctx.strokeStyle = elc;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
    ctx.beginPath();
    ctx.arc(0, 18, rad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = t * 0.8 + (i * Math.PI * 2) / 8;
      const px = Math.cos(a) * rad, py = 18 + Math.sin(a) * (rad * 0.35);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1.0;

    for (let i = 0; i < 6; i++) {
      const angle = t * 2.2 + i * 1.05;
      const dist = 32 + Math.sin(t * 4 + i) * 12;
      const ex = Math.cos(angle) * dist;
      const ey = (12 + Math.sin(angle) * (dist * 0.4)) - ((t * 22 + i * 14) % 45);
      ctx.fillStyle = elc;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    let action = 'idle';
    if (opt) {
      if (typeof opt.anim === 'number') {
        const acts = ['idle', 'walk', 'attack', 'dash', 'cast'];
        action = acts[opt.anim % acts.length];
      } else if (opt.action) {
        action = opt.action;
      } else if (opt.moving) {
        action = 'walk';
      }
    }

    const guild = opt && opt.g !== undefined ? GUILDS[opt.g][0] : (opt && opt.guild ? opt.guild : 'Aries');
    const outfit = opt && opt.o !== undefined ? opt.o : (opt && opt.outfit !== undefined ? opt.outfit : 0);
    const hair = opt && opt.h !== undefined ? opt.h : (opt && opt.hair !== undefined ? opt.hair : 0);
    const hairStyle = opt && opt.style !== undefined ? opt.style : (opt && opt.hairStyle !== undefined ? opt.hairStyle : 0);

    SpriteSys.drawChar(ctx, 0, 18, {
      guild,
      outfit,
      hair,
      hairStyle,
      elc,
      fx: 1,
      fy: 0.5,
      action,
      moving: action === 'walk'
    }, t, 2.0);
  }

  ctx.restore();
}

function drawAnimePortrait(x, y, w, h, key, col) {
  ctx.save();
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  bgGrad.addColorStop(0, '#101736'); bgGrad.addColorStop(1, '#080c1e');
  ctx.fillStyle = bgGrad; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = col || '#38bdf8'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);

  const cx = x + w / 2, cy = y + h / 2;
  const kl = key.toLowerCase();
  const isYuna = kl.includes('yuna'), isYuri = kl.includes('yuri'), isYumi = kl.includes('yumi'), isYuki = kl.includes('yuki');
  const isNarrator = kl.includes('narrator') || kl.includes('spire');
  const isShop = kl.includes('merchant') || kl.includes('shop');
  const isBounty = kl.includes('bounty');

  if (isNarrator) {
    ctx.fillStyle = '#060a18'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy - 6, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r = i % 2 === 0 ? 18 : 8;
      const sx = cx + Math.cos(a) * r, sy = cy - 6 + Math.sin(a) * r;
      if (i === 0) ctx.beginPath(), ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy - 6, 4, 0, Math.PI * 2); ctx.fill();
    T('ASTRAL CORE', cx, y + h - 20, 11, '#ffd36a', 'center');
    ctx.restore(); return;
  }

  let hairCol = '#ff5a3c', eyeCol = '#ff3b30', hairStyle = 'twintails', skinCol = '#ffe5d4';
  if (isYuna) { hairCol = '#ea580c'; eyeCol = '#f97316'; hairStyle = 'yuna'; }
  else if (isYuri) { hairCol = '#556b2f'; eyeCol = '#84cc16'; hairStyle = 'stoic'; }
  else if (isYumi) { hairCol = '#14b8a6'; eyeCol = '#06b6d4'; hairStyle = 'twintails'; }
  else if (isYuki) { hairCol = '#93c5fd'; eyeCol = '#0284c7'; hairStyle = 'yuki'; }
  else if (isShop) { hairCol = '#64748b'; eyeCol = '#f59e0b'; hairStyle = 'goggles'; }
  else if (isBounty) { hairCol = '#94a3b8'; eyeCol = '#eab308'; hairStyle = 'crested'; }
  else {
    const p = G.p;
    hairCol = p ? HAIRS[p.hair] : '#2b1d14';
    eyeCol = p && ELEM[p.element] ? ELEM[p.element].color : '#38bdf8';
    hairStyle = 'hero';
  }

  const hx = cx, hy = cy - 2;
  // Neck and shoulders
  if (isYuna) {
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(hx - 26, y + h); ctx.lineTo(-18 + hx, hy + 24); ctx.lineTo(18 + hx, hy + 24); ctx.lineTo(26 + hx, y + h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 2; ctx.stroke();
  } else if (isYuki) {
    ctx.fillStyle = '#0e7490';
    ctx.beginPath();
    ctx.moveTo(hx - 26, y + h); ctx.lineTo(-18 + hx, hy + 24); ctx.lineTo(18 + hx, hy + 24); ctx.lineTo(26 + hx, y + h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.stroke();
  } else {
    ctx.fillStyle = col || '#e0382d';
    ctx.beginPath();
    ctx.moveTo(hx - 24, y + h); ctx.lineTo(hx - 16, hy + 24); ctx.lineTo(hx + 16, hy + 24); ctx.lineTo(hx + 24, y + h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // Face shape
  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.moveTo(hx - 18, hy - 10); ctx.lineTo(hx - 18, hy + 10); ctx.lineTo(hx, hy + 25); ctx.lineTo(hx + 18, hy + 10); ctx.lineTo(hx + 18, hy - 10);
  ctx.closePath(); ctx.fill();

  // Anime blush
  ctx.fillStyle = 'rgba(255, 100, 130, 0.4)';
  ctx.beginPath();
  ctx.ellipse(hx - 11, hy + 11, 4, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(hx + 11, hy + 11, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  if (isYuna) {
    // Confident Grin with White Teeth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(hx - 5, hy + 11); ctx.lineTo(hx + 5, hy + 11); ctx.lineTo(hx + 3, hy + 15); ctx.lineTo(hx - 3, hy + 15); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.5; ctx.stroke();
  } else {
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hx, hy + 12, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // Expressive Large Anime Eyes
  const drawEye = (ex, ey) => {
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(ex, ey - 3, 6, Math.PI + 0.3, Math.PI * 2 - 0.1); ctx.stroke();
    const g = ctx.createLinearGradient(ex, ey - 3, ex, ey + 7);
    g.addColorStop(0, '#0f172a'); g.addColorStop(0.35, eyeCol); g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, ey + 2, 4.2, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.ellipse(ex, ey + 2, 2.2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex - 1.5, ey - 0.5, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 1.8, ey + 3.5, 1.0, 0, Math.PI * 2); ctx.fill();
  };
  drawEye(hx - 8, hy + 1); drawEye(hx + 8, hy + 1);

  // Hair with bangs
  ctx.fillStyle = hairCol;
  ctx.beginPath(); ctx.arc(hx, hy - 12, 22, Math.PI, 0); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 22, hy - 12); ctx.lineTo(hx - 14, hy + 4); ctx.lineTo(hx - 8, hy - 4);
  ctx.lineTo(hx, hy + 6); ctx.lineTo(hx + 8, hy - 4); ctx.lineTo(hx + 14, hy + 4); ctx.lineTo(hx + 22, hy - 12);
  ctx.closePath(); ctx.fill();

  if (hairStyle === 'yuna') {
    // Dynamic Fiery Orange Twintails (Image 2)
    ctx.beginPath();
    ctx.ellipse(hx - 28, hy - 4, 8, 22, 0.3, 0, Math.PI * 2);
    ctx.ellipse(hx + 28, hy - 4, 8, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5a3c';
    ctx.fillRect(hx - 24, hy - 16, 5, 5); ctx.fillRect(hx + 19, hy - 16, 5, 5);
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.ellipse(hx - 28, hy - 10, 4, 10, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 28, hy - 10, 4, 10, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (hairStyle === 'yuki') {
    // Flowing Silver-Blue Hair with Hairpins & Diadem (Image 1)
    ctx.beginPath();
    ctx.moveTo(hx - 22, hy - 8); ctx.quadraticCurveTo(hx - 35, hy + 20, hx - 24, y + h);
    ctx.lineTo(hx - 14, y + h); ctx.quadraticCurveTo(hx - 22, hy + 14, hx - 16, hy);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 22, hy - 8); ctx.quadraticCurveTo(hx + 35, hy + 20, hx + 24, y + h);
    ctx.lineTo(hx + 14, y + h); ctx.quadraticCurveTo(hx + 22, hy + 14, hx + 16, hy);
    ctx.closePath(); ctx.fill();
    // Hairpins
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(hx - 12, hy - 20); ctx.lineTo(hx - 22, hy - 32); ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(hx - 23, hy - 30, 2.5, 0, Math.PI * 2); ctx.fill();
    // Diadem
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(hx, hy - 15, 12, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(hx, hy - 20, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (hairStyle === 'twintails') {
    ctx.beginPath();
    ctx.ellipse(hx - 25, hy + 4, 6, 17, 0.2, 0, Math.PI * 2);
    ctx.ellipse(hx + 25, hy + 4, 6, 17, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (hairStyle === 'long') {
    ctx.beginPath();
    ctx.moveTo(hx - 22, hy - 8); ctx.quadraticCurveTo(hx - 28, hy + 20, hx - 20, y + h);
    ctx.lineTo(hx - 12, y + h); ctx.quadraticCurveTo(hx - 18, hy + 14, hx - 16, hy);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 22, hy - 8); ctx.quadraticCurveTo(hx + 28, hy + 20, hx + 20, y + h);
    ctx.lineTo(hx + 12, y + h); ctx.quadraticCurveTo(hx + 18, hy + 14, hx + 16, hy);
    ctx.closePath(); ctx.fill();
  }

  // Hair angel ring sheen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath(); ctx.ellipse(hx, hy - 15, 13, 2.5, 0, 0, Math.PI * 2); ctx.fill();

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
    outfit: int(d.outfit, 0, 0, 5), hair: int(d.hair, 0, 0, 5), hairStyle: int(d.hairStyle, 0, 0, 5),
    floor: int(d.floor, 1, 1, 100), loc: d.loc === 'floor' ? 'floor' : 'hub',
    lvl: int(d.lvl, 1, 1, 99), xp: int(d.xp, 0, 0, 1e9), hp: Math.max(1, Number(d.hp) || 1), sta: Math.max(0, Number(d.sta) || 0),
    inv: {
      shards: int(inv.shards, 0, 0, 1e9),
      bones: int(inv.bones, 0, 0, 1e9),
      circuits: int(inv.circuits, 0, 0, 1e9),
      potions: int(inv.potions, 0, 0, 99),
      elixirs: int(inv.elixirs, 2, 0, 99),
      bombs: int(inv.bombs, 2, 0, 99)
    },
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
    if (sel) {
      const g = ctx.createLinearGradient(m.x, ry, m.x + m.w, ry);
      g.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      g.addColorStop(1, 'rgba(14, 165, 233, 0.15)');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = 'rgba(8, 14, 32, 0.88)';
    }
    ctx.fillRect(m.x, ry, m.w, m.h);
    ctx.strokeStyle = sel ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(m.x + 1, ry + 1, m.w - 2, m.h - 2);
    if (sel) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(m.x, ry, 4, m.h);
    }
    const sub = it.sub ? lbl(it, 'sub') : null;
    const prefix = sel ? '▶ ' : '  ';
    T(prefix + lbl(it, 'label'), m.x + 8, ry + (sub ? 6 : (m.h - 16) / 2), 15, on ? (sel ? '#ffffff' : '#e0f2fe') : '#64748b');
    if (sub) T(sub, m.x + 24, ry + 28, 12, on ? '#93c5fd' : '#475569', 'left', false);
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
    const L = this.lines[this.i];
    const portraitW = 96, portraitH = 114;
    const px = 20, py = H - 140;

    // Speaker visual novel anime portrait
    drawAnimePortrait(px, py, portraitW, portraitH, this.name, this.col);

    // Text box container
    const tbX = px + portraitW + 12, tbW = W - tbX - 20, tbH = portraitH;
    panel(tbX, py, tbW, tbH, this.col);

    // Stylized Anime Nameplate
    const nameStr = '【 ' + this.name + ' 】';
    ctx.fillStyle = this.col;
    const nw = Math.max(140, this.name.length * 10 + 36);
    ctx.fillRect(tbX + 12, py - 14, nw, 22);
    ctx.fillStyle = '#050714';
    T(nameStr, tbX + 16, py - 11, 13, '#050714');

    // Dialog lines
    const lines = wrap(L, tbW - 28, 15), maxc = Math.floor(this.ch);
    let c = 0;
    for (let i = 0; i < lines.length; i++) {
      const seg = lines[i].slice(0, Math.max(0, maxc - c));
      c += lines[i].length + 1;
      T(seg, tbX + 14, py + 18 + i * 22, 15, '#eaf2ff');
    }

    // Bouncing Anime Next Indicator
    if (this.ch >= L.length && Math.floor(performance.now() / 360) % 2) {
      T('▼ NEXT [J]', tbX + tbW - 90, py + tbH - 24, 13, this.col);
    }
  }
};

/* ================= Title ================= */
const Title = {
  enter() {
    this.t = 0; this.stars = [];
    for (let i = 0; i < 110; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H, s: rnd(.4, 1.6), z: Math.random() < .25 ? 2.5 : 1.2 });
    this.m = Menu([
      { label: 'New Game', fn: () => go(Slots, { mode: 'new' }) },
      { label: 'Continue', enabled: () => Save.has(), fn: () => go(Slots, { mode: 'load' }) },
      { label: 'Export Save', enabled: () => Save.has(), fn: () => go(Slots, { mode: 'export' }) },
      { label: 'Import Save', fn: () => $('imp').click() },
      { label: () => 'Touch Controls: ' + (document.body.classList.contains('touch') ? 'ON' : 'OFF'), fn: () => setTouch(!document.body.classList.contains('touch')) },
      { label: 'Toggle Fullscreen', fn: () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} } }
    ], 540, 142, 230, 36);
    this.m.h = 36;
  },
  update(dt) {
    this.t += dt; for (const s of this.stars) { s.y += s.s * 8 * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    menuStep(this.m);
  },
  draw() {
    // Deep anime nebula sky gradient
    const g = ctx.createRadialGradient(W * 0.4, H * 0.3, 30, W * 0.5, H * 0.5, 600);
    g.addColorStop(0, '#131b4d');
    g.addColorStop(0.45, '#0b0f2a');
    g.addColorStop(1, '#03040a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Starlight twinkling
    for (const s of this.stars) {
      ctx.fillStyle = 'rgba(210,235,255,' + (.35 + .5 * Math.sin(this.t * 2.5 + s.x)) + ')';
      ctx.fillRect(s.x, s.y, s.z, s.z);
    }

    // Rotating Zodiac Constellation Rune Ring in the cosmic sky
    ctx.save();
    ctx.translate(280, 200);
    ctx.rotate(this.t * 0.08);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 140, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.beginPath(); ctx.arc(0, 0, 115, 0, Math.PI * 2); ctx.stroke();
    const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const zx = Math.cos(a) * 128, zy = Math.sin(a) * 128;
      ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(zodiacSymbols[i], zx, zy);
    }
    ctx.restore();

    // Towering Monolithic Astral Spire
    ctx.fillStyle = '#070a18';
    ctx.beginPath(); ctx.moveTo(220, H); ctx.lineTo(275, 15); ctx.lineTo(285, 15); ctx.lineTo(340, H); ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(220, H); ctx.lineTo(275, 15); ctx.lineTo(285, 15); ctx.lineTo(340, H); ctx.stroke();

    // Glowing Spire core energy beam
    ctx.fillStyle = '#0284c7'; ctx.fillRect(278, 10, 4, H);
    for (let i = 0; i < 28; i++) {
      const wy = 30 + i * 15, on = (i + Math.floor(this.t * 3)) % 4 === 0;
      ctx.fillStyle = on ? '#38bdf8' : '#fbbf24';
      ctx.fillRect(268 + ((i * 7) % 24), wy, 2.5, 2.5);
    }

    // Anime cliff in foreground with hero silhouette
    ctx.fillStyle = '#050711';
    ctx.beginPath(); ctx.moveTo(0, H - 75); ctx.lineTo(160, H - 40); ctx.lineTo(240, H - 15); ctx.lineTo(240, H); ctx.lineTo(0, H); ctx.fill();
    drawChar(120, H - 48, { guild: 'Aries', outfit: 3, hair: 0, hairStyle: 0, elc: '#38bdf8', fx: 1, fy: 0, moving: false }, this.t, 1.4);

    // Glowing Japanese Anime Logo
    T('✦ 星屑の百層塔 ✦', 36, 44, 13, '#38bdf8', 'left', false);
    T('ASTRAL', 34, 60, 48, '#f0f9ff');
    T('SPIRE', 188, 60, 48, '#38bdf8');
    T('CLIMB TO FLOOR 100 · REWRITE THE STARS', 36, 114, 14, '#93c5fd', 'left', false);
    T('Twelve Zodiac Guilds. One Tower. Conquer Destiny.', 36, 134, 12, '#64748b', 'left', false);

    T('CONTROLS: WASD/Arrows move  J/E act/sprint  K/Z attack  L/X skill  Esc pause', 36, H - 40, 11, '#64748b', 'left', false);
    T('TOUCH: Joystick + Action buttons. Auto-saves each floor.', 36, H - 24, 11, '#64748b', 'left', false);

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
  enter() {
    this.s = { name: 'Climber', g: 0, o: 0, h: 0, style: 0, anim: 0 };
    this.row = 0;
    this.t = 0;
  },
  ask() {
    const animeNames = ['Ren', 'Kaito', 'Aoi', 'Shin', 'Haruto', 'Yuki', 'Sora', 'Rin', 'Hikari', 'Akira', 'Kenji', 'Asuka'];
    try {
      const v = window.prompt('Name your anime climber (or tap to cycle names):', this.s.name);
      Input.reset();
      if (v !== null && v.trim()) { this.s.name = v.trim().slice(0, 12); return; }
    } catch (e) {}
    const idx = animeNames.indexOf(this.s.name);
    this.s.name = animeNames[(idx + 1) % animeNames.length];
    beep(560, .04);
  },
  change(d) {
    const s = this.s;
    if (this.row === 1) s.g = (s.g + d + 12) % 12;
    else if (this.row === 2) s.o = (s.o + d + 6) % 6;
    else if (this.row === 3) s.h = (s.h + d + 6) % 6;
    else if (this.row === 4) s.style = (s.style + d + 6) % 6;
    else if (this.row === 5) s.anim = (s.anim + d + 5) % 5;
    else return;
    beep(560, .04);
  },
  begin() {
    const s = this.s, g = GUILDS[s.g], e = ELEM[g[1]];
    G.p = normSave({ name: s.name, guild: g[0], outfit: s.o, hair: s.h, hairStyle: s.style, floor: 1, loc: 'hub', lvl: 1, hp: e.hp, sta: e.sta, inv: { shards: 20, potions: 2 } });
    G.p.hp = e.hp; G.p.sta = e.sta; Save.write(G.slot, G.p); go(Intro);
  },
  act() {
    if (this.row === 0) this.ask();
    else if (this.row === 6) this.begin();
    else this.change(1);
  },
  update(dt) {
    this.t += dt;
    if (Input.just('up')) this.row = (this.row + 6) % 7;
    if (Input.just('down')) this.row = (this.row + 1) % 7;
    const d = (Input.just('right') ? 1 : 0) - (Input.just('left') ? 1 : 0);
    if (d) this.change(d);
    if (Input.just('j')) this.act();
    if (Input.just('k')) { go(Slots, { mode: 'new' }); return; }
    if (Input.tap) {
      for (let i = 0; i < 7; i++) {
        const y = i === 6 ? 368 : 72 + i * 47;
        const h = i === 6 ? 48 : 42;
        if (Input.tap.x > 18 && Input.tap.x < 475 && Input.tap.y > y && Input.tap.y < y + h) {
          this.row = i;
          if (i >= 1 && i <= 5) {
            if (Input.tap.x < 270) this.change(-1);
            else this.change(1);
          } else {
            this.act();
          }
          break;
        }
      }
    }
  },
  draw() {
    const s = this.s, g = GUILDS[s.g], e = ELEM[g[1]], sig = ZODIAC_SIGILS[g[0]] || '✦';
    const zw = ZODIAC_WEAPONS[g[0]];
    ctx.fillStyle = '#080b1a'; ctx.fillRect(0, 0, W, H);

    T('CREATE YOUR ANIME CLIMBER', 24, 20, 24, '#cfe6ff');
    T('Up/Down: Row   Left/Right: Change   J: Select   K: Back', 24, 50, 11, '#7f98c8', 'left', false);

    const rows = [
      ['Name', s.name],
      ['Zodiac Guild', `${sig} ${g[0]}`],
      ['Outfit Color', OUTFIT_N[s.o]],
      ['Hair Color', HAIR_N[s.h]],
      ['Hair Style', HAIR_STYLES[s.style]],
      ['Action Preview', ANIM_PREVIEWS[s.anim]],
      ['', '✦ ENTER THE ASTRAL SPIRE ✦']
    ];

    for (let i = 0; i < 7; i++) {
      const isStart = i === 6;
      const y = isStart ? 368 : 72 + i * 47;
      const h = isStart ? 48 : 42;
      const sel = this.row === i;

      ctx.fillStyle = sel ? (isStart ? 'rgba(56,189,248,.35)' : 'rgba(80,150,255,.32)') : 'rgba(10,16,34,.85)';
      ctx.fillRect(20, y, 450, h);
      ctx.strokeStyle = sel ? (isStart ? '#38bdf8' : '#bfe0ff') : '#3a4a78';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(20.5, y + 0.5, 449, h - 1);

      if (isStart) {
        T(rows[i][1], 245, y + 16, 17, sel ? '#ffffff' : '#38bdf8', 'center', true);
      } else {
        T(rows[i][0], 36, y + 13, 14, '#9fc0ff');
        if (i === 0) {
          T(rows[i][1] + '  (tap to change)', 140, y + 13, 14, '#fff');
        } else {
          T('◀', 254, y + 13, 14, sel ? '#38bdf8' : '#7f98c8');
          T(rows[i][1], 350, y + 13, 14, '#ffffff', 'center', true);
          T('▶', 442, y + 13, 14, sel ? '#38bdf8' : '#7f98c8');
        }
      }
    }

    // Preview Panel
    panel(490, 20, 290, 420, e.color);
    drawFullAnimeCharacter(635, 126, 1.25, g[1], this.t, s);

    T(`${sig} ${g[0]} Guild`, 635, 186, 19, e.color, 'center', true);
    T(`${g[1]} Element  •  ${e.cls}`, 635, 208, 12, '#cfe6ff', 'center');
    T(`Weapon: ${zw ? zw.name : 'Guild Blade'}`, 635, 226, 11, '#ffe08a', 'center', false);

    const ds = wrap(g[2], 260, 11);
    ds.forEach((l, i) => T(l, 635, 244 + i * 14, 11, '#a9c4ee', 'center', false));

    T(`HP ${e.hp}    STA ${e.sta}    ATK ${e.atk}    SPD ${e.spd}`, 635, 278, 12, '#cfe6ff', 'center');
    wrap('Perk: ' + e.perk, 260, 11).forEach((l, i) => T(l, 635, 298 + i * 14, 11, '#fde047', 'center', false));

    const sk = SKILLS[g[0]];
    T(`Guild Skill [L]: ${sk.name}`, 635, 332, 12, '#7dffb0', 'center');
    wrap(sk.desc + ' (cd ' + sk.cd + 's)', 260, 11).forEach((l, i) => T(l, 635, 348 + i * 13, 11, '#a9c4ee', 'center', false));

    // Preview action badge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(505, 390, 260, 24);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeRect(505.5, 390.5, 259, 23);
    T(`Mode: ${ANIM_PREVIEWS[s.anim]} (Row 5 to cycle)`, 635, 396, 11, '#38bdf8', 'center', false);
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
  yuna: { name: 'Yuna', title: 'Pyromancer', el: 'Fire', guild: 'Aries', outfit: 0, hair: 2, hairStyle: 1, x: 250, y: 215,
    lines: ['Hah! Another fresh face at the blast doors? Don\'t flinch. The Spire can smell hesitation.',
      'Fire Guilds break things first and ask questions never. Keep up if you can.'] },
  yuri: { name: 'Yuri', title: 'Geomancer', el: 'Earth', guild: 'Taurus', outfit: 1, hair: 0, hairStyle: 4, x: 370, y: 215,
    lines: ['...You are still standing. Good. Most people sprint until their stamina is gone.',
      'Hold the line, watch the gauge, and let the enemy come to you.'] },
  yumi: { name: 'Yumi', title: 'Aeromancer', el: 'Air', guild: 'Aquarius', outfit: 2, hair: 1, hairStyle: 3, x: 590, y: 215,
    lines: ['Ooh, a newbie! Bet you three shards you can\'t reach Floor 5 before I get bored.',
      'Tip: hold J to sprint, and press L for your guild skill. Mind your stamina.'] },
  yuki: { name: 'Yuki', title: 'Hydromancer', el: 'Water', guild: 'Pisces', outfit: 3, hair: 3, hairStyle: 5, x: 710, y: 215,
    lines: ['Welcome. You look tired already. Rest here: hubs are the only safe ground.',
      'Every hub heals you fully. Please don\'t push past your limits.'] }
};

/* ================= Distinct Anime Weapon Combat Animation System ================= */
function renderWeaponAttackFx(ctx, pl, p, zw, combo, prog) {
  const a = Math.atan2(pl.fy, pl.fx);
  const px = pl.x, py = pl.y - 8;
  const elc = ELEM[p.element] ? ELEM[p.element].color : '#38bdf8';
  const wType = zw ? zw.type : 'cleavers';
  const wLv = (p.upgrades && p.upgrades.weapon) || 0;
  const alpha = clamp((1 - prog) * 1.5, 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (wType === 'cleavers' || wType === 'twin_swords') {
    // DUAL BLADES / CLEAVERS (Aries, Gemini)
    if (combo === 0) {
      const r = 34;
      ctx.strokeStyle = elc; ctx.lineWidth = 5 + (wLv >= 4 ? 2 : 0);
      ctx.beginPath(); ctx.arc(px, py, r, a - 1.1, a + 1.1); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, r, a - 0.9, a + 0.9); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.fillRect(px + Math.cos(a + 0.8) * r, py + Math.sin(a + 0.8) * r, 3, 3);
    } else if (combo === 1) {
      const cosA = Math.cos(a), sinA = Math.sin(a);
      const nx = -sinA * 16, ny = cosA * 16;
      ctx.strokeStyle = elc; ctx.lineWidth = 5 + (wLv >= 4 ? 2 : 0);
      ctx.beginPath();
      ctx.moveTo(px + cosA * 6 - nx, py + sinA * 6 - ny); ctx.lineTo(px + cosA * 36 + nx, py + sinA * 36 + ny); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + cosA * 6 + nx, py + sinA * 6 + ny); ctx.lineTo(px + cosA * 36 - nx, py + sinA * 36 - ny); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + cosA * 10 - nx * 0.7, py + sinA * 10 - ny * 0.7); ctx.lineTo(px + cosA * 32 + nx * 0.7, py + sinA * 32 + ny * 0.7); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + cosA * 10 + nx * 0.7, py + sinA * 10 + ny * 0.7); ctx.lineTo(px + cosA * 32 - nx * 0.7, py + sinA * 32 - ny * 0.7); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px + cosA * 21, py + sinA * 21, 5, 0, 6.28); ctx.fill();
    } else {
      const r = 38;
      ctx.strokeStyle = elc; ctx.lineWidth = 6 + (wLv >= 4 ? 2 : 0);
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px, py, r - 2, 0, 6.28); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const ang = a + i * 1.57 + prog * 4;
        ctx.fillStyle = '#fde047'; ctx.fillRect(px + Math.cos(ang) * (r + 4), py + Math.sin(ang) * (r + 4), 4, 4);
      }
    }
  } else if (wType === 'greatsword' || wType === 'shield_mace') {
    // HEAVY TITAN WEAPONS (Leo, Taurus)
    const cosA = Math.cos(a), sinA = Math.sin(a);
    if (combo === 0) {
      ctx.strokeStyle = elc; ctx.lineWidth = 10 + (wLv >= 4 ? 4 : 0);
      ctx.beginPath(); ctx.moveTo(px + cosA * 6, py + sinA * 6); ctx.lineTo(px + cosA * 46, py + sinA * 46); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(px + cosA * 8, py + sinA * 8); ctx.lineTo(px + cosA * 44, py + sinA * 44); ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(px + cosA * 46, py + sinA * 46, 7, 0, 6.28); ctx.fill();
    } else if (combo === 1) {
      const r = 40;
      ctx.strokeStyle = elc; ctx.lineWidth = 8 + (wLv >= 4 ? 2 : 0);
      ctx.beginPath(); ctx.arc(px, py, r, a - 1.57, a + 1.57); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, r, a - 1.3, a + 1.3); ctx.stroke();
    } else {
      const r = 48 * Math.min(1, prog * 1.5);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = elc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, r * 0.7, 0, 6.28); ctx.stroke();
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < 6; i++) {
        const ang = i * 1.05;
        ctx.fillRect(px + Math.cos(ang) * (r + 4), py + Math.sin(ang) * (r + 4), 4, 4);
      }
    }
  } else if (wType === 'scythe' || wType === 'halberd') {
    // POLEARMS & SCYTHES (Cancer, Capricorn)
    if (combo === 0) {
      const r = 38;
      ctx.strokeStyle = elc; ctx.lineWidth = 6 + (wLv >= 4 ? 2 : 0);
      ctx.beginPath(); ctx.arc(px, py, r, a - 1.8, a + 1.8); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, r, a - 1.6, a + 1.6); ctx.stroke();
    } else if (combo === 1) {
      const r = 42;
      ctx.strokeStyle = elc; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(px, py, r, a - 0.9, a + 1.6); ctx.stroke();
      ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px, py, r, a - 0.7, a + 1.4); ctx.stroke();
    } else {
      const r = 44;
      ctx.strokeStyle = elc; ctx.lineWidth = 7 + (wLv >= 4 ? 2 : 0);
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px, py, r - 3, 0, 6.28); ctx.stroke();
    }
  } else if (wType === 'bow') {
    // ARCHERY (Sagittarius)
    const cosA = Math.cos(a), sinA = Math.sin(a);
    if (combo === 0 || combo === 1) {
      const len = 48;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cosA * len, py + sinA * len); ctx.stroke();
      ctx.strokeStyle = elc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cosA * len, py + sinA * len); ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(px + cosA * 16, py + sinA * 16, 7, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + cosA * 32, py + sinA * 32, 5, 0, 6.28); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(px + cosA * len, py + sinA * len, 4, 0, 6.28); ctx.fill();
    } else {
      const len = 70;
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cosA * len, py + sinA * len); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cosA * len, py + sinA * len); ctx.stroke();
      ctx.strokeStyle = elc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 18, 0, 6.28); ctx.stroke();
    }
  } else if (wType === 'rapier_urn') {
    // RAPIER & URN (Aquarius)
    const cosA = Math.cos(a), sinA = Math.sin(a);
    if (combo === 0) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cosA * 42, py + sinA * 42); ctx.stroke();
      ctx.strokeStyle = elc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px + cosA * 30, py + sinA * 30, 8, a - 1.2, a + 1.2); ctx.stroke();
    } else if (combo === 1) {
      for (let i = -1; i <= 1; i++) {
        const ang = a + i * 0.25;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(ang) * 40, py + Math.sin(ang) * 40); ctx.stroke();
      }
    } else {
      for (let d = 12; d <= 44; d += 10) {
        ctx.strokeStyle = elc; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px + cosA * d, py + sinA * d, d * 0.28, a - 1.57, a + 1.57); ctx.stroke();
      }
    }
  } else if (wType === 'codex_wand' || wType === 'spirit_scepter') {
    // CATALYSTS & SCEPTERS (Virgo, Pisces)
    const cosA = Math.cos(a), sinA = Math.sin(a);
    if (combo === 0 || combo === 1) {
      ctx.strokeStyle = elc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px + cosA * 24, py + sinA * 24, 14, 0, 6.28); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px + cosA * 34, py + sinA * 34, 4, 0, 6.28); ctx.fill();
    } else {
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px + cosA * 26, py + sinA * 26, 24, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = elc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px + cosA * 26, py + sinA * 26, 16, 0, 6.28); ctx.stroke();
    }
  } else if (wType === 'chain_blade') {
    // SCORPION CHAIN-KAMA (Scorpio)
    const cosA = Math.cos(a), sinA = Math.sin(a);
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + cosA * 24 - sinA * 14, py + sinA * 24 + cosA * 14, px + cosA * 46, py + sinA * 46);
    ctx.stroke();
    ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(px + cosA * 46, py + sinA * 46, 5, 0, 6.28); ctx.fill();
  } else {
    // CHAKRAMS (Libra)
    const cosA = Math.cos(a), sinA = Math.sin(a);
    ctx.strokeStyle = elc; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px + cosA * 28, py + sinA * 28, 12, 0, 6.28); ctx.stroke();
    ctx.fillStyle = '#fde047'; ctx.fillRect(px + cosA * 28 - 2, py + sinA * 28 - 2, 4, 4);
  }

  ctx.restore();
}

/* ================= Stardew Valley Style Bag & Hotbar System ================= */
const BagSystem = {
  getSlots(p) {
    const winfo = getWeaponInfo(p);
    const slots = [];
    // Slot 0 [Hotbar 1]: Equipped Zodiac Weapon
    slots.push({
      id: 'weapon', slotNum: 1, type: 'gear', icon: '⚔️',
      name: winfo.fullName, count: winfo.level > 0 ? '+' + winfo.level : '',
      color: winfo.color, desc: `${winfo.desc} Tier: ${winfo.tier}. Upgrade in forge.`,
      canUse: true, actionLabel: 'Upgrade Forge'
    });
    // Slot 1 [Hotbar 2]: Healing Potion
    slots.push({
      id: 'potion', slotNum: 2, type: 'consumable', icon: '🧪',
      name: 'Healing Potion', count: p.inv.potions || 0,
      color: '#f43f5e', desc: 'Restores 60 HP immediately. Essential for dungeon survival.',
      canUse: (p.inv.potions || 0) > 0, actionLabel: 'Drink Potion'
    });
    // Slot 2 [Hotbar 3]: Aether Stamina Tonic
    slots.push({
      id: 'elixir', slotNum: 3, type: 'consumable', icon: '⚡',
      name: 'Aether Stamina Tonic', count: p.inv.elixirs !== undefined ? p.inv.elixirs : 2,
      color: '#fbbf24', desc: 'Instantly restores 100 Stamina to maximum.',
      canUse: (p.inv.elixirs !== undefined ? p.inv.elixirs : 2) > 0, actionLabel: 'Drink Tonic'
    });
    // Slot 3 [Hotbar 4]: Starlight Bomb
    slots.push({
      id: 'bomb', slotNum: 4, type: 'consumable', icon: '💣',
      name: 'Starlight Bomb', count: p.inv.bombs !== undefined ? p.inv.bombs : 2,
      color: '#a855f7', desc: 'Hurls an explosive astral grenade dealing 85 AOE damage.',
      canUse: (p.inv.bombs !== undefined ? p.inv.bombs : 2) > 0, actionLabel: 'Throw Bomb'
    });
    // Slot 4 [Hotbar 5]: Astral Shards
    slots.push({
      id: 'shards', slotNum: 5, type: 'currency', icon: '💎',
      name: 'Astral Shards', count: p.inv.shards || 0,
      color: '#38bdf8', desc: `Radiant Spire currency. Forge Upgrade Cost: ${winfo.cost} shards.`,
      canUse: true, actionLabel: 'Inspect Forge'
    });
    // Slot 5 [Hotbar 6]: Automata Bones
    slots.push({
      id: 'bones', slotNum: 6, type: 'material', icon: '🦴',
      name: 'Automata Bones', count: p.inv.bones || 0,
      color: '#e2e8f0', desc: 'Scavenged composite skeletons. Sells for 5 shards each.',
      canUse: (p.inv.bones || 0) > 0, actionLabel: 'Sell Bones'
    });
    // Slot 6 [Hotbar 7]: Cyber Circuits
    slots.push({
      id: 'circuits', slotNum: 7, type: 'material', icon: '💽',
      name: 'Cyber Circuits', count: p.inv.circuits || 0,
      color: '#67e8f9', desc: 'Advanced drone processing cores. Sells for 8 shards each.',
      canUse: (p.inv.circuits || 0) > 0, actionLabel: 'Sell Circuits'
    });
    // Slot 7 [Hotbar 8]: Zodiac Relics
    slots.push({
      id: 'relics', slotNum: 8, type: 'relic', icon: '🌟',
      name: 'Zodiac Relics', count: (p.relics ? p.relics.length : 0),
      color: '#fde047', desc: 'Bound Relics: ' + (p.relics && p.relics.length ? p.relics.join(', ') : 'None yet (defeat Bosses)'),
      canUse: true, actionLabel: 'View Relics'
    });
    // Slot 8 [Hotbar 9]: Backpack / Bag
    slots.push({
      id: 'bag', slotNum: 9, type: 'tool', icon: '🎒',
      name: 'Astral Bag & Gear', count: '27',
      color: '#f59e0b', desc: 'Full Stardew Valley gear, storage grid & celestial forge.',
      canUse: true, actionLabel: 'Open Bag Grid'
    });

    // Row 2: Storage Row (Slots 10 to 18)
    const pElem = (p.element === 'Air' ? 'Wind' : p.element) || 'Fire';
    const pAff = ELEMENT_AFFINITY[pElem] || ELEMENT_AFFINITY.Fire;
    slots.push({
      id: 'affinity_core', slotNum: 10, type: 'crystal', icon: pAff.icon,
      name: `${pAff.name} Constellation Core`, count: '∞',
      color: pAff.color, desc: `Inscribed with Zodiac astral runes. Deals +50% WEAKNESS damage to ${pAff.strongVs} foes!`,
      canUse: true, actionLabel: 'Inspect Core'
    });
    slots.push({
      id: 'radar', slotNum: 11, type: 'module', icon: '📡',
      name: 'Spire Radar Module', count: '1',
      color: '#38bdf8', desc: 'Holographic radar mapping enemy positions, stair portal, and room telemetry.',
      canUse: true, actionLabel: 'Scan Floor'
    });
    slots.push({
      id: 'anvil', slotNum: 12, type: 'forge', icon: '⚒️',
      name: 'Celestial Forge Anvil', count: `+${winfo.level}`,
      color: '#fbbf24', desc: `Portable forge for ${winfo.fullName}. Upgrade cost: ${winfo.cost} Astral Shards.`,
      canUse: true, actionLabel: 'Forge Weapon'
    });
    slots.push({
      id: 'ambrosia', slotNum: 13, type: 'consumable', icon: '🍶',
      name: 'Ambrosia Healing Draught', count: 1,
      color: '#4ade80', desc: 'Rare celestial elixir distilled from stellar nebula. Fully restores HP and Stamina.',
      canUse: true, actionLabel: 'Drink Ambrosia'
    });
    slots.push({
      id: 'starlight_core', slotNum: 14, type: 'material', icon: '⭐',
      name: 'Starlight Core Prism', count: Math.max(1, Math.floor((p.floor || 1) / 3)),
      color: '#fde047', desc: 'Condensed star matter harvested from Spire automata. Powers weapon forge overclocks.',
      canUse: false, actionLabel: 'Inspect Material'
    });
    slots.push({
      id: 'cpu', slotNum: 15, type: 'material', icon: '🧠',
      name: 'Overlord Neural CPU', count: (p.floor > 5 ? 2 : 0),
      color: '#c084fc', desc: 'Neural matrix recovered from Spire Bosses. Sells to merchant for 25 Astral Shards.',
      canUse: (p.floor > 5), actionLabel: 'Sell Neural CPU'
    });
    slots.push({
      id: 'obsidian', slotNum: 16, type: 'mineral', icon: '🪨',
      name: 'Volcanic Obsidian Shard', count: (p.inv.bones || 0) + 1,
      color: '#f97316', desc: 'Spire geological fragment rich in pyretic resonance. Absorbs thermal shocks.',
      canUse: false, actionLabel: 'Inspect Mineral'
    });
    slots.push({
      id: 'wind_chime', slotNum: 17, type: 'charm', icon: '🎐',
      name: 'Zephyr Astral Chime', count: '1',
      color: '#34d399', desc: 'Chimes when enemies prepare ranged volleys, steadying evasive movements.',
      canUse: false, actionLabel: 'Inspect Charm'
    });
    slots.push({
      id: 'pearl', slotNum: 18, type: 'mineral', icon: '🔮',
      name: 'Tidal Pearl Crystal', count: '1',
      color: '#67e8f9', desc: 'Pure condensation of subterranean waters. Grants refreshing focus.',
      canUse: false, actionLabel: 'Inspect Crystal'
    });

    // Row 3: Relics & Artifacts Row (Slots 19 to 27)
    for (let i = 18; i < 27; i++) {
      const relicName = p.relics && p.relics[i - 18];
      if (relicName) {
        slots.push({
          id: 'relic_' + (i - 18), slotNum: i + 1, type: 'relic', icon: '👑',
          name: relicName, count: '★', color: '#fde047',
          desc: 'Spire Boss Relic: ' + relicName + '. Passively strengthens your Zodiac abilities.',
          canUse: true, actionLabel: 'Inspect Relic'
        });
      } else {
        slots.push({
          id: 'slot_' + i, slotNum: i + 1, type: 'empty', icon: '',
          name: 'Empty Pouch Slot', count: '', color: '#475569',
          desc: 'Empty bag compartment. Fill with Boss relics & Spire artifacts.',
          canUse: false, actionLabel: ''
        });
      }
    }
    return slots;
  },

  sellAllLoot(world) {
    const p = G.p;
    if (!p) return;
    const b = p.inv.bones || 0, c = p.inv.circuits || 0;
    if (b === 0 && c === 0) {
      toast('No monster bones or circuits in bag to sell.');
      return;
    }
    const earned = b * 5 + c * 8;
    p.inv.shards = (p.inv.shards || 0) + earned;
    p.inv.bones = 0;
    p.inv.circuits = 0;
    toast(`💰 Sold all loot (+${b} bones, +${c} circuits) for +${earned} shards!`);
    AudioSys.beep(880, 0.15, 'triangle', 0.1);
    if (world && world.ring && world.pl) world.ring(world.pl.x, world.pl.y - 8, 70, '#fde047');
    autosave();
  },

  useSlot(idx, world) {
    const p = G.p;
    if (!p) return;
    const winfo = getWeaponInfo(p);

    if (idx === 0 || idx === 11) {
      if (p.inv.shards >= winfo.cost && winfo.level < 20) {
        p.inv.shards -= winfo.cost;
        p.upgrades.weapon = (p.upgrades.weapon || 0) + 1;
        AudioSys.playForge();
        toast('★ ' + winfo.baseName + ' upgraded to +' + p.upgrades.weapon + '!');
        if (world && world.ring && world.pl) world.ring(world.pl.x, world.pl.y - 8, 85, '#fde047');
        autosave();
      } else if (winfo.level >= 20) {
        toast('★ Weapon is already at Maximum Level (Godforge)!');
      } else {
        toast(`Need ${winfo.cost} shards to upgrade weapon! (Have: ${p.inv.shards})`);
        AudioSys.beep(220, 0.1, 'sawtooth', 0.08);
      }
    } else if (idx === 1) {
      world.usePotion();
    } else if (idx === 2) {
      const elixirs = p.inv.elixirs !== undefined ? p.inv.elixirs : 2;
      if (elixirs > 0) {
        p.inv.elixirs = elixirs - 1;
        p.sta = sx(p).maxSta;
        toast('+100 Stamina Restored!');
        AudioSys.beep(880, 0.15, 'sine', 0.08);
        if (world && world.ring && world.pl) {
          world.ring(world.pl.x, world.pl.y - 8, 55, '#fbbf24');
          world.floatText(world.pl.x, world.pl.y - 25, '+100 STA', '#fbbf24');
        }
      } else {
        toast('No Stamina Tonics left!');
      }
    } else if (idx === 3) {
      const bombs = p.inv.bombs !== undefined ? p.inv.bombs : 2;
      if (bombs > 0) {
        p.inv.bombs = bombs - 1;
        if (world && world.aoe && world.pl) {
          world.aoe(70, 85, 360, '#a855f7', { stun: 0.6 });
          world.burst(world.pl.x + world.pl.fx * 36, world.pl.y - 8 + world.pl.fy * 36, '#c084fc', 22);
        }
        AudioSys.beep(120, 0.25, 'sawtooth', 0.12);
        toast('💣 Starlight Bomb detonated! (85 AOE)');
      } else {
        toast('No Starlight Bombs left!');
      }
    } else if (idx === 4) {
      toast(`Shards: ${p.inv.shards} | Weapon Upgrade Cost: ${winfo.cost}`);
    } else if (idx === 5) {
      if (p.inv.bones > 0) {
        const earned = p.inv.bones * 5;
        p.inv.shards += earned;
        p.inv.bones = 0;
        toast(`Sold all bones for +${earned} shards!`);
        AudioSys.beep(784, 0.1, 'triangle', 0.08);
        autosave();
      } else {
        toast('No bones in bag to sell.');
      }
    } else if (idx === 6) {
      if (p.inv.circuits > 0) {
        const earned = p.inv.circuits * 8;
        p.inv.shards += earned;
        p.inv.circuits = 0;
        toast(`Sold all circuits for +${earned} shards!`);
        AudioSys.beep(880, 0.1, 'triangle', 0.08);
        autosave();
      } else {
        toast('No circuits in bag to sell.');
      }
    } else if (idx === 7) {
      toast(p.relics && p.relics.length ? ('Bound: ' + p.relics.join(', ')) : 'Defeat Bosses on Floor 5, 10, 15 to claim Relics!');
    } else if (idx === 8) {
      if (world.bagOpen) world.closeBag();
      else world.openBag();
    } else if (idx === 9) {
      const pElem = (p.element === 'Air' ? 'Wind' : p.element) || 'Fire';
      const pAff = ELEMENT_AFFINITY[pElem] || ELEMENT_AFFINITY.Fire;
      toast(`${pAff.icon} ${pAff.name} Affinity: Deals +50% Weakness DMG to ${pAff.strongVs} foes!`);
      AudioSys.beep(750, 0.1, 'sine', 0.08);
    } else if (idx === 10) {
      if (world && world.stairs) {
        world.ring(world.pl.x, world.pl.y - 8, 200, '#38bdf8');
        toast(`📡 Radar Ping: Stairs at (${Math.round(world.stairs.x)}, ${Math.round(world.stairs.y)})!`);
        AudioSys.beep(600, 0.15, 'triangle', 0.08);
      } else {
        toast('📡 Radar: Safe Hub Zone. Ascend through portal above.');
      }
    } else if (idx === 12) {
      p.hp = sx(p).maxHp;
      p.sta = sx(p).maxSta;
      if (world && world.ring && world.pl) world.ring(world.pl.x, world.pl.y - 8, 80, '#4ade80');
      toast('✨ Ambrosia consumed: Full HP & Stamina Restored!');
      AudioSys.beep(980, 0.2, 'sine', 0.1);
    } else if (idx === 14) {
      toast('🧠 Neural CPU: Sell in Hub or Forge for 25 Shards.');
    } else {
      const s = this.getSlots(p)[idx];
      if (s && s.desc) toast(s.name + ': ' + s.desc.slice(0, 48));
    }
  }
};
const World = {
  enter(mode) {
    const p = G.p, st = sx(p);
    Object.assign(this, { mode, t: 0, walls: [], ints: [], enemies: [], fx: [], texts: [], menu: null, paused: false, pm: null, cleared: false, banner: 0, shake: 0, atkId: 0, bagOpen: false, bagSel: 0, bagTab: 0, selectedSlot: 0 });
    this.pl = { x: 0, y: 0, w: 12, h: 10, fx: 0, fy: 1, atkT: 0, atkCd: 0, combo: 0, comboT: 0, atkCombo: 0, inv: 0, regenD: 0, moving: false, kx: 0, ky: 0, kbT: 0, skCd: 0, shieldT: 0, hasteT: 0, hasteM: 1, regenT: 0, regenR: 0, dashT: 0, dvx: 0, dvy: 0, dashId: 0, dashCd: 0, ultCd: 0, lHold: 0, lFired: false };
    this.proj = []; this.rings = []; this.eb = []; this.zones = [];
    const pl = this.pl, self = this;
    if (mode === 'hub') {
      AudioSys.setTrack('hub');
      this.W = 960; this.H = 540; this.bio = null;
      p.hp = st.maxHp; p.sta = st.maxSta; p.loc = 'hub'; pl.x = 480; pl.y = 480;
      this.walls.push({ x: 430, y: 10, w: 100, h: 50 }, { x: 95, y: 250, w: 100, h: 36 }, { x: 770, y: 250, w: 90, h: 36 },
        { x: 300, y: 360, w: 30, h: 30 }, { x: 630, y: 360, w: 30, h: 30 });
      this.ints.push({ x: 480, y: 82, r: 72, label: 'Enter Floor ' + p.floor, isDoor: true, fn: () => self.enterFloor() });
      for (const k in CLIMBERS) { const c = CLIMBERS[k]; this.ints.push({ x: c.x, y: c.y + 4, r: 38, label: 'Talk to ' + c.name, fn: () => self.talk(k) }); }
      this.ints.push({ x: 145, y: 312, r: 48, label: 'Merchant', fn: () => self.openShop() });
      this.ints.push({ x: 815, y: 312, r: 48, label: 'Bounty board', fn: () => self.board() });
      this.banner = 3; this.bannerText = (p.floor > 1 ? 'Checkpoint Hub' : 'Entrance Hub') + ' - Floor ' + p.floor + ' ahead';
      autosave();
      if (p.floor === 1 && !p.flags.yuna && !p.flags.yuri && !p.flags.yumi && !p.flags.yuki)
        Dlg.say('Narrator', '#7ec8ff', ['The sanctuary hums with neon. Talk to the four elite climbers, then step through the blast door at the top.', 'Controls: move with WASD / joystick, J to interact (hold to sprint), K to attack, L for your guild skill. Press B or 1-9 for your Stardew Bag!']);
    } else {
      const f = p.floor, bi = Math.floor((f - 1) / 5) % 3, bio = BIOMES[bi]; this.bio = bio;
      this.W = 1400; this.H = 900; p.loc = 'floor';
      const isBoss = f % 5 === 0;
      AudioSys.setTrack(isBoss ? 'boss' : 'floor');
      pl.x = 90; pl.y = this.H - 90; p.hp = Math.min(p.hp, st.maxHp); p.sta = st.maxSta;
      this.stairs = { x: this.W - 130, y: 40, w: 70, h: 50 };
      const rng = mulberry(f * 7919 + 13), nW = 10 + bio.extra;
      for (let a = 0, n = 0; n < nW && a < 200; a++) {
        const w = 40 + rng() * 120, h = 40 + rng() * 120, x = rng() * (this.W - w), y = rng() * (this.H - h);
        if (x < 280 && y > this.H - 280) continue; if (x + w > this.W - 280 && y < 220) continue;
        this.walls.push({ x, y, w, h }); n++;
      }
      const count = 4 + Math.min(8, Math.floor(f / 2)) + (bi ? 1 : 0) - (isBoss ? 2 : 0);
      const spawn = (type) => {
        for (let t = 0; t < 80; t++) {
          const x = 100 + Math.random() * (this.W - 200), y = 100 + Math.random() * (this.H - 200);
          if (Math.hypot(x - pl.x, y - pl.y) < 320) continue;
          if (this.walls.some(r => x > r.x - 24 && x < r.x + r.w + 24 && y > r.y - 24 && y < r.y + r.h + 24)) continue;
          if (x > this.stairs.x - 80 && y < 160) continue;
          const boss = type === 'boss', an = type === 'anomaly', slime = type === 'slime', briar = type === 'briar', colossus = type === 'colossus';
          const ELEMS = ['Fire', 'Wind', 'Earth', 'Water'];
          let eEl = 'Wind';
          if (boss) {
            const bossElems = ['Fire', 'Wind', 'Water', 'Earth'];
            eEl = bossElems[Math.floor((f / 5 - 1) % bossElems.length)] || 'Fire';
          } else if (colossus) {
            eEl = Math.random() < 0.75 ? 'Fire' : 'Earth';
          } else if (briar) {
            eEl = Math.random() < 0.75 ? 'Earth' : 'Wind';
          } else if (type === 'drone') {
            eEl = Math.random() < 0.65 ? 'Water' : 'Wind';
          } else if (bio && bio.name.includes('Volcanic')) {
            eEl = Math.random() < 0.6 ? 'Fire' : (Math.random() < 0.5 ? 'Earth' : 'Wind');
          } else if (bio && bio.name.includes('Labyrinth')) {
            eEl = Math.random() < 0.5 ? 'Wind' : 'Water';
          } else {
            eEl = ELEMS[Math.floor(Math.random() * ELEMS.length)];
          }
          const ew = boss ? 28 : (colossus ? 28 : (briar ? 24 : (slime ? 20 : 18)));
          const eh = boss ? 28 : (colossus ? 28 : (briar ? 24 : (slime ? 18 : 18)));
          const ehp = boss ? (f === 100 ? 2200 : 150 + f * 14) :
                      colossus ? 52 + f * 4.5 :
                      briar ? 36 + f * 3.6 :
                      an ? 30 + f * 3.2 :
                      slime ? 22 + f * 2.5 : 18 + f * 2.2;
          const espd = boss ? 58 :
                       colossus ? 38 + Math.min(18, f * .25) :
                       briar ? 52 + Math.min(22, f * .35) :
                       an ? 42 :
                       slime ? 64 + Math.min(25, f * .4) : 60 + Math.min(28, f * .4);
          const edmg = boss ? 16 + f * .5 :
                       colossus ? 14 + f * .5 :
                       briar ? 11 + f * .45 :
                       an ? 10 + f * .45 :
                       slime ? 8 + f * .4 : 7 + f * .35;
          const exp = boss ? 40 + f * 3 :
                      colossus ? 18 + f * 1.5 :
                      briar ? 12 + f :
                      an ? 9 + f :
                      slime ? 8 + f : 6 + f;
          this.enemies.push({
            type, element: eEl, x, y,
            w: ew, h: eh,
            hp: ehp, max: 0,
            spd: espd, dmg: edmg, xp: exp,
            wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0, ph: Math.random() * 6,
            jumpT: rnd(0.4, 1.3), jumping: 0, jz: 0,
            atkCd: rnd(1.5, 3.5), atkState: 0
          }); const e = this.enemies[this.enemies.length - 1]; e.max = e.hp; if (boss) this.initBoss(e, f); return;
        }
      };
      for (let i = 0; i < count; i++) {
        let eType = 'drone';
        if (f <= 10) {
          // Feature user's reference monsters across first 10 floors!
          // Photo 1: Vortex Sub-Drone ('drone')
          // Photo 2: Overgrown Briar Mech ('briar')
          // Photo 3: Molten Magma Colossus ('colossus')
          // + Astral Slime ('slime')
          if (f === 1) {
            eType = (i % 2 === 0) ? 'drone' : 'slime';
          } else if (f === 2) {
            eType = (i % 3 === 0) ? 'drone' : (i % 3 === 1 ? 'briar' : 'slime');
          } else if (f === 3 || f === 4) {
            eType = (i % 4 === 0) ? 'drone' : (i % 4 === 1 ? 'briar' : (i % 4 === 2 ? 'colossus' : 'slime'));
          } else {
            // Floors 5-10
            const pool10 = ['drone', 'briar', 'colossus', 'slime', 'drone', 'briar'];
            eType = pool10[i % pool10.length];
          }
        } else {
          const poolHigh = (bio && bio.name.includes('Volcanic')) ? ['colossus', 'drone', 'anomaly'] :
                           (bio && bio.name.includes('Labyrinth')) ? ['briar', 'drone', 'anomaly'] :
                           ['drone', 'briar', 'colossus', 'anomaly'];
          eType = poolHigh[i % poolHigh.length];
        }
        spawn(eType);
      }
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
  openBag() {
    this.bagOpen = true;
    AudioSys.beep(650, 0.1, 'triangle', 0.08);
    haptic(15);
  },
  closeBag() {
    this.bagOpen = false;
    AudioSys.beep(420, 0.08, 'triangle', 0.06);
  },
  handleBagTap(tx, ty) {
    const bw = 640, bh = 390;
    const bx = Math.floor((W - bw) / 2), by = Math.floor((H - bh) / 2);
    // Close button [ ✕ ]
    if (tx >= bx + bw - 44 && tx <= bx + bw - 14 && ty >= by + 12 && ty <= by + 44) {
      this.closeBag();
      return;
    }
    // 27 Slots Grid (3 rows of 9)
    const sw = 40, gap = 4, gridX = bx + 22;
    for (let r = 0; r < 3; r++) {
      const rowY = by + 60 + r * 48;
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const sx = gridX + c * (sw + gap);
        if (tx >= sx && tx <= sx + sw && ty >= rowY && ty <= rowY + sw) {
          if (this.bagSel === idx) {
            BagSystem.useSlot(idx, this);
          } else {
            this.bagSel = idx;
            if (idx < 9) this.selectedSlot = idx;
            AudioSys.beep(520, 0.05, 'triangle', 0.04);
          }
          return;
        }
      }
    }
    // Primary Action Button in Inspector:
    const inspX = bx + 22, inspY = by + 210;
    const btn1X = inspX + 360, btn1Y = inspY + 14, btn1W = 224, btn1H = 34;
    if (tx >= btn1X && tx <= btn1X + btn1W && ty >= btn1Y && ty <= btn1Y + btn1H) {
      BagSystem.useSlot(this.bagSel, this);
      return;
    }
    // Sell All Loot Button:
    const btn2X = inspX + 360, btn2Y = inspY + 54, btn2W = 224, btn2H = 30;
    if (tx >= btn2X && tx <= btn2X + btn2W && ty >= btn2Y && ty <= btn2Y + btn2H) {
      BagSystem.sellAllLoot(this);
      return;
    }
    // Click outside modal: close
    if (tx < bx || tx > bx + bw || ty < by || ty > by + bh) {
      this.closeBag();
      return;
    }
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
    const p = G.p;
    const playerElem = (p && p.element === 'Air' ? 'Wind' : (p ? p.element : 'Fire')) || 'Fire';
    const enemyElem = e.element || 'Wind';
    const pAff = ELEMENT_AFFINITY[playerElem] || ELEMENT_AFFINITY.Fire;
    const isSuperEffective = pAff.strongVs === enemyElem;
    const isResisted = pAff.weakVs === enemyElem;

    if (isSuperEffective) {
      dmg = Math.round(dmg * 1.5);
    } else if (isResisted) {
      dmg = Math.max(1, Math.round(dmg * 0.75));
    }

    dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.flash = .14;
    const m = Math.hypot(dx, dy) || 1;
    if (e.type === 'boss') kb = 0;
    if (kb > 0) { e.kbT = .15; e.kx = dx / m * kb; e.ky = dy / m * kb; }

    if (isSuperEffective) {
      this.floatText(e.x, e.y - 24, `${pAff.icon} ${pAff.name.toUpperCase()} CRUSH! +${dmg}`, pAff.color);
      this.ring(e.x, e.y, 90, pAff.color);
      this.ring(e.x, e.y, 50, '#ffffff');
      this.shake = Math.max(this.shake, 0.22);
      for (let i = 0; i < 22; i++) {
        this.fx.push({
          x: e.x, y: e.y,
          vx: rnd(-130, 130), vy: rnd(-140, 50),
          t: rnd(0.4, 0.8), c: i % 3 === 0 ? '#ffffff' : (i % 2 === 0 ? pAff.color : '#fde047')
        });
      }
      AudioSys.playAffinityHit();
      haptic(25);
    } else if (isResisted) {
      this.floatText(e.x, e.y - 12, `🛡️ RESIST ${dmg}`, '#94a3b8');
      this.burst(e.x, e.y, '#64748b', 4);
      AudioSys.playHit(false);
    } else {
      this.floatText(e.x, e.y - 12, (isCrit ? 'CRIT! ' : '') + dmg, isCrit ? '#fde047' : (col || '#fff'));
      this.burst(e.x, e.y, isCrit ? '#fde047' : (col || '#fff'), isCrit ? 8 : 4);
      AudioSys.playHit(isCrit);
    }

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
    const f = G.p.floor, an = type === 'anomaly', slime = type === 'slime', briar = type === 'briar', colossus = type === 'colossus';
    const ELEMS = ['Fire', 'Wind', 'Earth', 'Water'];
    let eEl = 'Wind';
    if (colossus) eEl = Math.random() < 0.75 ? 'Fire' : 'Earth';
    else if (briar) eEl = Math.random() < 0.75 ? 'Earth' : 'Wind';
    else if (type === 'drone') eEl = Math.random() < 0.65 ? 'Water' : 'Wind';
    else eEl = ELEMS[Math.floor(Math.random() * ELEMS.length)];

    const ew = colossus ? 28 : (briar ? 24 : (slime ? 20 : 18));
    const eh = colossus ? 28 : (briar ? 24 : (slime ? 18 : 18));
    const ehp = colossus ? 52 + f * 4.5 : briar ? 36 + f * 3.6 : an ? 30 + f * 3.2 : slime ? 22 + f * 2.5 : 18 + f * 2.2;
    const espd = colossus ? 38 + Math.min(18, f * .25) : briar ? 52 + Math.min(22, f * .35) : an ? 42 : slime ? 64 + Math.min(25, f * .4) : 60 + Math.min(28, f * .4);
    const edmg = colossus ? 14 + f * .5 : briar ? 11 + f * .45 : an ? 10 + f * .45 : slime ? 8 + f * .4 : 7 + f * .35;
    const exp = colossus ? 18 + f * 1.5 : briar ? 12 + f : an ? 9 + f : slime ? 8 + f : 6 + f;

    const e = {
      type, element: eEl,
      x, y,
      w: ew, h: eh,
      hp: ehp, max: 0,
      spd: espd, dmg: edmg, xp: exp,
      wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0, ph: Math.random() * 6,
      jumpT: rnd(0.4, 1.3), jumping: 0, jz: 0,
      atkCd: rnd(1.5, 3.5), atkState: 0
    };
    e.max = e.hp; this.enemies.push(e); this.total++;
    const burstCol = colossus ? '#f97316' : briar ? '#22c55e' : slime ? '#38bdf8' : '#b06bff';
    this.burst(x, y, burstCol, 10);
    return e;
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
    const isSlime = e.type === 'slime', isBriar = e.type === 'briar', isColossus = e.type === 'colossus';
    const sh = boss ? 60 : isColossus ? Math.round(rnd(10, 18)) : isBriar ? Math.round(rnd(6, 11)) : an ? Math.round(rnd(5, 9)) : isSlime ? Math.round(rnd(4, 8)) : Math.round(rnd(3, 6));
    p.inv.shards += sh; p.kills++; this.floatText(e.x, e.y - 14, '+' + sh + ' shards', '#ffd36a');
    if (Math.random() < (boss ? 1 : isColossus ? .75 : isBriar ? .6 : isSlime ? .55 : .45)) {
      const n = (boss || isColossus) ? 3 : 1;
      const lootName = isColossus ? ' basalt core' : isBriar ? ' thorn vine' : isSlime ? ' slime gel' : ' bone';
      p.inv.bones += n; this.floatText(e.x, e.y - 28, '+' + n + lootName, '#e9e2cc');
    }
    if (Math.random() < (boss ? 1 : isColossus ? .5 : isBriar ? .35 : .3)) {
      const n = (boss || isColossus) ? 2 : 1;
      p.inv.circuits += n; this.floatText(e.x, e.y - 42, '+' + n + ' circuit', '#7ee8ff');
    }
    if ((isSlime || isBriar || isColossus) && Math.random() < 0.25) {
      p.inv.potions = Math.min(99, p.inv.potions + 1);
      this.floatText(e.x, e.y - 56, '+1 potion', '#f43f5e');
    }
    if (e.type === 'drone' || isSlime || isBriar || isColossus) p.bounty.have = Math.min(p.bounty.need, p.bounty.have + 1);
    if (p.element === 'Water') p.hp = Math.min(st.maxHp, p.hp + 4);
    const deathBurstCol = isColossus ? '#f97316' : isBriar ? '#22c55e' : isSlime ? (ELEMENT_AFFINITY[e.element] ? ELEMENT_AFFINITY[e.element].color : '#38bdf8') : (an ? '#4a9bff' : '#ff5a4a');
    this.gainXp(e.xp); this.burst(e.x, e.y, deathBurstCol, isColossus ? 24 : isBriar ? 18 : 14); beep(160, .15, 'sawtooth', .04);
    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (!this.enemies.length) { this.cleared = true; toast('Floor cleared! Stairs unlocked.'); beep(784, .25, 'triangle', .05); }
  },
  update(dt) {
    this.t += dt; toastT -= dt; this.banner -= dt; this.shake -= dt; AudioSys.update(dt);
    if (Dlg.active) { Dlg.update(dt); return; }
    if (this.menu) { if (Input.just('k')) this.menu = null; else menuStep(this.menu); return; }
    if (this.paused) { if (Input.just('p') || Input.just('k')) { this.paused = false; return; } menuStep(this.pm); return; }
    if (Input.just('p')) { this.paused = true; this.pm = this.pauseMenu(); return; }

    // Bag Modal Active: process modal navigation, hotkeys, and taps
    if (this.bagOpen) {
      if (Input.just('bag') || Input.just('p') || Input.just('k') || Input.just('dash')) {
        this.closeBag();
        return;
      }
      const numKey = Input.justNum();
      if (numKey !== null) {
        this.bagSel = numKey - 1;
        this.selectedSlot = numKey - 1;
        BagSystem.useSlot(numKey - 1, this);
        return;
      }
      if (Input.just('left')) { this.bagSel = (this.bagSel + 26) % 27; AudioSys.beep(480, 0.04, 'triangle', 0.03); }
      if (Input.just('right')) { this.bagSel = (this.bagSel + 1) % 27; AudioSys.beep(480, 0.04, 'triangle', 0.03); }
      if (Input.just('up')) { this.bagSel = (this.bagSel + 18) % 27; AudioSys.beep(480, 0.04, 'triangle', 0.03); }
      if (Input.just('down')) { this.bagSel = (this.bagSel + 9) % 27; AudioSys.beep(480, 0.04, 'triangle', 0.03); }
      if (Input.just('j')) {
        BagSystem.useSlot(this.bagSel, this);
        return;
      }
      if (Input.tap) {
        this.handleBagTap(Input.tap.x, Input.tap.y);
      }
      return;
    }

    // Toggle Bag with 'B', 'I' or touch bag button
    if (Input.just('bag')) {
      this.openBag();
      return;
    }

    // Number keys 1-9 directly select & use hotbar items (like Stardew Valley)
    const hotbarNum = Input.justNum();
    if (hotbarNum !== null) {
      const sIdx = hotbarNum - 1;
      this.selectedSlot = sIdx;
      this.bagSel = sIdx;
      BagSystem.useSlot(sIdx, this);
    }

    // Canvas click on Stardew Hotbar at bottom of screen
    if (Input.tap) {
      const tx = Input.tap.x, ty = Input.tap.y;
      const hX = 195, hY = 398;
      if (ty >= hY - 4 && ty <= hY + 48 && tx >= hX && tx <= hX + 414) {
        const clickedSlot = Math.floor((tx - hX) / 46);
        if (clickedSlot >= 0 && clickedSlot < 9) {
          this.selectedSlot = clickedSlot;
          this.bagSel = clickedSlot;
          BagSystem.useSlot(clickedSlot, this);
          return;
        }
      }
    }

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

    // Pulse touch button if near interactable
    const bJ = $('bJ');
    if (bJ) {
      if (near && !Dlg.active && !this.menu) bJ.classList.add('pulse-enter');
      else bJ.classList.remove('pulse-enter');
    }

    if (near) {
      const cx = clamp(pl.x - W / 2, 0, Math.max(0, this.W - W)), cy = clamp(pl.y - H / 2, 0, Math.max(0, this.H - H));
      let tapped = false;
      if (Input.tap) {
        const twx = Input.tap.x + cx, twy = Input.tap.y + cy;
        if (Math.hypot(twx - near.x, twy - near.y) < near.r + 35) tapped = true;
      }
      const steppedDoor = near.isDoor && Math.abs(pl.x - near.x) < 36 && pl.y <= near.y + 16;
      if (Input.just('j') || tapped || steppedDoor) {
        beep(700, .05);
        near.fn();
        return;
      }
    }
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
      else if (e.type === 'slime') {
        const sm = e.slow > 0 ? (e.slow -= dt, .5) : 1;
        e.jumpT = (e.jumpT || 0.8) - dt;
        if (e.jumpT <= 0) {
          e.jumping = 0.45;
          e.jumpT = rnd(0.7, 1.4);
          if (d < 220) beep(360, 0.05, 'triangle', 0.02);
        }
        if (e.jumping > 0) {
          e.jumping -= dt;
          const jNorm = 1 - e.jumping / 0.45;
          e.jz = Math.sin(jNorm * Math.PI) * 14;
          vx = (dx / d) * e.spd * 1.5 * sm;
          vy = (dy / d) * e.spd * 1.5 * sm;
        } else {
          e.jz = 0;
          vx = (dx / d) * e.spd * 0.35 * sm;
          vy = (dy / d) * e.spd * 0.35 * sm;
        }
        if (e.kbT > 0) { e.kbT -= dt; vx = e.kx; vy = e.ky; }
        moveBox(e, vx * dt, 0, this.walls, W2, H2); moveBox(e, 0, vy * dt, this.walls, W2, H2);
      }
      else if (e.type === 'briar') {
        const sm = e.slow > 0 ? (e.slow -= dt, .5) : 1;
        if (d < 280) { vx = (dx / d) * e.spd * sm; vy = (dy / d) * e.spd * sm; }
        else { e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1, 2.5); const a = Math.random() * 6.28; e.dx = Math.cos(a) * e.spd * .4; e.dy = Math.sin(a) * e.spd * .4; } vx = e.dx; vy = e.dy; }
        if (e.kbT > 0) { e.kbT -= dt; vx = e.kx; vy = e.ky; }
        moveBox(e, vx * dt, 0, this.walls, W2, H2); moveBox(e, 0, vy * dt, this.walls, W2, H2);

        // Briar Thorn Lash attack
        e.atkCd = (e.atkCd || 2.5) - dt;
        if (e.atkCd <= 0 && d < 200) {
          e.atkCd = rnd(2.5, 4.2);
          e.flash = 0.22;
          this.ring(e.x, e.y, 48, '#22c55e');
          this.zone(pl.x, pl.y, 34, 0.75, e.dmg * 0.9, '#15803d', 4);
          AudioSys.beep(260, 0.12, 'sawtooth', 0.05);
          this.floatText(e.x, e.y - 20, 'Briar Lash!', '#4ade80');
        }
      }
      else if (e.type === 'colossus') {
        const sm = e.slow > 0 ? (e.slow -= dt, .5) : 1;
        if (d < 300) { vx = (dx / d) * e.spd * sm; vy = (dy / d) * e.spd * sm; }
        else { e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1.2, 3); const a = Math.random() * 6.28; e.dx = Math.cos(a) * e.spd * .4; e.dy = Math.sin(a) * e.spd * .4; } vx = e.dx; vy = e.dy; }
        if (e.kbT > 0) { e.kbT -= dt; vx = e.kx; vy = e.ky; }
        moveBox(e, vx * dt, 0, this.walls, W2, H2); moveBox(e, 0, vy * dt, this.walls, W2, H2);

        // Colossus Magma Earth Shatter attack
        e.atkCd = (e.atkCd || 3.0) - dt;
        if (e.atkCd <= 0 && d < 240) {
          e.atkCd = rnd(3.2, 5.0);
          e.flash = 0.3;
          this.shake = Math.max(this.shake, 0.22);
          this.ring(e.x, e.y, 65, '#ea580c');
          this.zone(e.x, e.y, 50, 0.65, e.dmg * 1.3, '#f97316', 6);
          const aim = Math.atan2((pl.y - 6) - e.y, pl.x - e.x);
          for (let i = -1; i <= 1; i++) {
            this.ebullet(e.x, e.y, aim + i * 0.25, 170, e.dmg * 0.7, '#f97316', 5);
          }
          AudioSys.beep(95, 0.35, 'sawtooth', 0.08);
          this.floatText(e.x, e.y - 24, 'MAGMA SLAM!', '#fb923c');
        }
      }
      else {
        const sm = e.slow > 0 ? (e.slow -= dt, .5) : 1;
        if (d < 260) { vx = dx / d * e.spd * sm; vy = dy / d * e.spd * sm; }
        else { e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1, 2.5); const a = Math.random() * 6.28; e.dx = Math.cos(a) * e.spd * .4; e.dy = Math.sin(a) * e.spd * .4; } vx = e.dx; vy = e.dy; }
        if (e.kbT > 0) { e.kbT -= dt; vx = e.kx; vy = e.ky; }
        moveBox(e, vx * dt, 0, this.walls, W2, H2); moveBox(e, 0, vy * dt, this.walls, W2, H2);

        // Vortex Sub-Drone hydro projectile
        e.atkCd = (e.atkCd || 2.4) - dt;
        if (e.atkCd <= 0 && d < 260) {
          e.atkCd = rnd(2.5, 4.5);
          const aim = Math.atan2((pl.y - 6) - e.y, pl.x - e.x);
          this.ebullet(e.x, e.y, aim, 210, e.dmg * 0.75, '#38bdf8', 4);
          AudioSys.beep(460, 0.08, 'sine', 0.04);
        }
      }
      const enemyHitY = e.y - (e.jz || 0);
      if (pl.inv <= 0 && Math.abs(pl.x - e.x) < (e.w + pl.w) / 2 + 2 && Math.abs(pl.y - 6 - enemyHitY) < (e.h + pl.h) / 2 + 6) {
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
      // Anime Astral Blast Portal Gate (Entrance to Spire Floor)
      const gatePulse = 0.5 + 0.5 * Math.sin(this.t * 3.5);
      ctx.fillStyle = '#0f1738'; ctx.fillRect(400, 6, 160, 60);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.strokeRect(400, 6, 160, 60);
      const pGrad = ctx.createLinearGradient(480, 10, 480, 64);
      pGrad.addColorStop(0, '#0284c7');
      pGrad.addColorStop(0.5, 'rgba(56, 189, 248, ' + (0.55 + 0.3 * gatePulse) + ')');
      pGrad.addColorStop(1, '#67e8f9');
      ctx.fillStyle = pGrad; ctx.fillRect(420, 12, 120, 52);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(480, 38, 18 + gatePulse * 4, 0, 6.28); ctx.stroke();
      T('✦ 階層突入 PORTAL ✦', 480, 14, 11, '#ffffff', 'center');
      T('FLOOR ' + p.floor, 480, 30, 20, '#ffffff', 'center');
      for (let i = 0; i < 5; i++) {
        const py = 66 + i * 14;
        ctx.fillStyle = 'rgba(56, 189, 248, ' + (0.85 - i * 0.15) + ')';
        ctx.fillRect(445, py, 70, 2);
      }
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
      const s = this.stairs, on = this.cleared, pulse = .5 + .5 * Math.sin(this.t * 5);
      const stairGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      if (on) {
        stairGrad.addColorStop(0, 'rgba(56, 189, 248, ' + (0.4 + 0.3 * pulse) + ')');
        stairGrad.addColorStop(1, '#0284c7');
      } else {
        stairGrad.addColorStop(0, '#1c192b'); stairGrad.addColorStop(1, '#0f0e1a');
      }
      ctx.fillStyle = stairGrad; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = on ? '#67e8f9' : '#57485e'; ctx.lineWidth = 2.5; ctx.strokeRect(s.x, s.y, s.w, s.h);
      T(on ? '▲ NEXT FLOOR' : '🔒 LOCKED', s.x + s.w / 2, s.y + 16, 13, on ? '#ffffff' : '#94a3b8', 'center');
    }
    // interact labels / entities
    const list = [{ y: pl.y, d: () => {
      const blink = pl.inv > 0 && Math.floor(this.t * 20) % 2;
      if (!blink) drawChar(pl.x, pl.y, {
        guild: p.guild, element: p.element, outfit: p.outfit, hair: p.hair,
        hairStyle: p.hairStyle || 0, elc: el.color,
        fx: pl.fx, fy: pl.fy, moving: pl.moving,
        atkT: pl.atkT, dashT: pl.dashT, lHold: pl.lHold
      }, this.t);
      if (pl.lHold > .1 && p.lvl >= ULT_LVL) { ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pl.x, pl.y - 8, 20, -1.57, -1.57 + 6.28 * clamp(pl.lHold / .45, 0, 1)); ctx.stroke(); }
      if (pl.atkT > 0) {
        const a = Math.atan2(pl.fy, pl.fx), r = 32;
        ctx.strokeStyle = el.color; ctx.lineWidth = 6; ctx.globalAlpha = clamp(pl.atkT / .18, 0, 1);
        ctx.beginPath(); ctx.arc(pl.x, pl.y - 8, r, a - 1.2, a + 1.2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pl.x, pl.y - 8, r, a - 1.0, a + 1.0); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } }];
    if (hub) {
      for (const k in CLIMBERS) {
        const c = CLIMBERS[k];
        list.push({ y: c.y, d: () => {
          drawChar(c.x, c.y, {
            guild: c.guild, outfit: c.outfit, hair: c.hair, hairStyle: c.hairStyle,
            element: c.el, elc: ELEM[c.el].color, fx: 0, fy: 1, moving: false
          }, this.t);
          T(c.name, c.x, c.y - 42, 12, ELEM[c.el].color, 'center');
        } });
      }
      list.push({ y: 246, d: () => {
        drawChar(145, 246, {
          guild: 'Capricorn', outfit: 1, hair: 5, hairStyle: 2,
          element: 'Earth', elc: '#ffd36a', fx: 0, fy: 1, moving: false
        }, this.t);
      } });
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
    if (near && !Dlg.active && !this.menu) {
      const isDoor = near.isDoor || near.label.includes('Floor');
      const badgeW = isDoor ? 220 : 180;
      const bx = near.x - badgeW / 2, by = near.y - 62;
      ctx.fillStyle = 'rgba(10, 16, 38, 0.94)'; ctx.fillRect(bx, by, badgeW, 30);
      ctx.strokeStyle = isDoor ? '#38bdf8' : '#fbbf24'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, badgeW, 30);
      ctx.fillStyle = isDoor ? '#38bdf8' : '#fbbf24'; ctx.fillRect(bx + 6, by + 6, 4, 18);
      T((isDoor ? '▶ [J / TAP] ' : '[J] ') + near.label, bx + 16, by + 6, 14, '#ffffff');
    }
    ctx.restore();

    // HUD: Render canvas fallback only if HTML HUD is not in DOM
    const hasRpgHud = !!document.getElementById('rpg-hud');
    if (!hasRpgHud) {
      panel(8, 8, 220, 72, el.color);
      drawChar(24, 44, { guild: p.guild, element: p.element, outfit: p.outfit, hair: p.hair, hairStyle: p.hairStyle || 0, elc: el.color, fx: 1, fy: 1, moving: false }, this.t, 1.4);
      T(p.name + '  Lv.' + p.lvl, 46, 13, 14, '#fff'); T(p.guild + ' / ' + p.element, 46, 29, 12, el.color, 'left', false);
      bar(46, 45, 120, 9, p.hp, st.maxHp, '#e0414b'); T(Math.ceil(p.hp) + '/' + st.maxHp, 170, 43, 11, '#fff', 'left', false);
      bar(46, 57, 120, 7, p.sta, st.maxSta, '#e8c23a'); bar(46, 67, 120, 4, p.xp, p.lvl * 35, '#6a8cff');
      const sk = SKILLS[p.guild], ul = ULTS[p.guild], rk = ['I', 'II', 'III'][rankOf(p) - 1], scd = sk.cd * (1 - 0.12 * (rankOf(p) - 1));
      panel(8, 84, 214, 46, el.color);
      T('[L] ' + sk.name + ' ' + rk, 16, 89, 12, pl.skCd > 0 ? '#8a93ad' : '#fff');
      bar(16, 104, 198, 3, pl.skCd > 0 ? scd - pl.skCd : scd, scd, pl.skCd > 0 ? '#5a6fa0' : '#7dffb0');
      if (p.lvl >= ULT_LVL) { T('[Hold L] ' + ul.name, 16, 111, 11, pl.ultCd > 0 ? '#8a93ad' : '#ffe08a'); bar(16, 125, 198, 3, pl.ultCd > 0 ? ULT_CD - pl.ultCd : ULT_CD, ULT_CD, pl.ultCd > 0 ? '#5a6fa0' : '#ffe08a'); }
      else T('Ultimate unlocks at Lv ' + ULT_LVL, 16, 111, 11, '#6f7a99', 'left', false);
    }
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
        ctx.fillStyle = e.type === 'boss' ? '#ffe08a' : (e.type === 'colossus' ? '#f97316' : (e.type === 'briar' ? '#22c55e' : (e.type === 'slime' ? '#38bdf8' : '#06b6d4'))); ctx.fillRect(epx - 1, epy - 1, 2, 2);
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
    // Draw Stardew Valley Hotbar on HUD
    this.drawHotbar();

    // Draw Stardew Valley Full Bag Window if open
    if (this.bagOpen) this.drawBag();

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
    const p = G.p;
    const playerElem = (p && p.element === 'Air' ? 'Wind' : (p ? p.element : 'Fire')) || 'Fire';
    const eElem = e.element || 'Wind';
    const pAff = ELEMENT_AFFINITY[playerElem] || ELEMENT_AFFINITY.Fire;
    const eAff = ELEMENT_AFFINITY[eElem] || ELEMENT_AFFINITY.Wind;
    const isWeak = pAff.strongVs === eElem;

    // Glowing Elemental Aura Ring around enemy
    ctx.save();
    ctx.strokeStyle = eAff.color;
    ctx.lineWidth = isWeak ? 2.5 : 1.2;
    ctx.globalAlpha = isWeak ? (0.6 + 0.35 * Math.sin(this.t * 8 + e.ph)) : 0.4;
    ctx.beginPath();
    ctx.ellipse(Math.round(e.x), Math.round(e.y + bob), (e.w / 2) + (isWeak ? 6 : 3), (e.h / 2) + (isWeak ? 6 : 3), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y + bob));
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-e.w / 2, e.h / 2 + 2 - bob, e.w, 3);
    const isColossus = (e.type === 'colossus') || (e.type === 'boss' && e.bname === 'Forge Colossus');

    if (isColossus) {
      // PHOTO 3 REFERENCE: Molten Magma Colossus / Forge Colossus
      const isBossCol = (e.type === 'boss');
      const colScale = isBossCol ? 1.6 : 1.35;
      ctx.save();
      ctx.scale(colScale, colScale);

      // 1. Heavy Basalt Charcoal Stone Body
      ctx.fillStyle = f ? '#fff' : '#1c1917';
      ctx.fillRect(-12, -10, 24, 20);
      ctx.strokeStyle = f ? '#fff' : '#292524';
      ctx.lineWidth = 2; ctx.strokeRect(-12, -10, 24, 20);

      // 2. Molten Magma Cracks & Veins running through chest and torso
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-9, -6); ctx.lineTo(0, 0); ctx.lineTo(9, -6);
      ctx.moveTo(0, 0); ctx.lineTo(0, 7);
      ctx.moveTo(-6, 4); ctx.lineTo(0, 7); ctx.lineTo(6, 4);
      ctx.stroke();
      // Inner blazing core fissure
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(0, 0); ctx.lineTo(4, -2); ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Basalt Plated Legs & Lava Toes
      ctx.fillStyle = f ? '#fff' : '#292524';
      ctx.fillRect(-11, 10, 8, 9);
      ctx.fillRect(3, 10, 8, 9);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-11, 12, 8, 2);
      ctx.fillRect(3, 12, 8, 2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-12, 18, 9, 2.5);
      ctx.fillRect(3, 18, 9, 2.5);

      // 4. Horned Volcanic Knight Helmet & Curved Magma Ram Horns
      ctx.fillStyle = f ? '#fff' : '#292524';
      ctx.fillRect(-8, -19, 16, 9);
      ctx.strokeStyle = f ? '#fff' : '#0c0a09'; ctx.strokeRect(-8, -19, 16, 9);

      // Left Ram Horn
      ctx.fillStyle = '#ea580c'; ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, -17);
      ctx.bezierCurveTo(-14, -24, -18, -18, -15, -12);
      ctx.bezierCurveTo(-17, -16, -11, -19, -6, -15);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.fillRect(-12, -18, 2.5, 2);

      // Right Ram Horn
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(7, -17);
      ctx.bezierCurveTo(14, -24, 18, -18, 15, -12);
      ctx.bezierCurveTo(17, -16, 11, -19, 6, -15);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.fillRect(10, -18, 2.5, 2);

      // Glowing Molten Eyes in Helmet Slit
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 5;
      ctx.fillRect(-5, -15, 3.5, 2);
      ctx.fillRect(1.5, -15, 3.5, 2);
      ctx.shadowBlur = 0;

      // 5. Heavy Magma Fists Dripping Molten Lava
      ctx.fillStyle = f ? '#fff' : '#1c1917';
      ctx.fillRect(-19, -3, 8, 12);
      ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 1.5; ctx.strokeRect(-19, -3, 8, 12);
      ctx.fillRect(11, -3, 8, 12);
      ctx.strokeRect(11, -3, 8, 12);

      // Dripping Molten Lava from fists
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-18, 9); ctx.lineTo(-16, 14 + Math.sin(this.t * 8) * 2); ctx.lineTo(-14, 9);
      ctx.moveTo(14, 9); ctx.lineTo(16, 13 + Math.cos(this.t * 8) * 2); ctx.lineTo(18, 9);
      ctx.fill();

      // Lava Pool beneath fist
      ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.beginPath(); ctx.ellipse(-16, 19, 5, 2, 0, 0, 6.3); ctx.fill();

      // Floating Embers & Sparks
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-14 + Math.sin(this.t * 6) * 4, -12 - (this.t * 15 % 12), 1.5, 1.5);
      ctx.fillRect(12 + Math.cos(this.t * 7) * 4, -14 - (this.t * 18 % 12), 1.5, 1.5);

      ctx.restore();
    } else if (e.type === 'boss') {
      const tele = e.state === 'tele', rec = e.state === 'rec', fl = f || (tele && Math.floor(this.t * 14) % 2);
      if (e.pat === 'blink' && tele) ctx.globalAlpha = .35 + .3 * Math.sin(this.t * 30);
      ctx.fillStyle = fl ? '#fff' : '#252a38'; ctx.fillRect(-16, -13, 32, 26);
      ctx.fillStyle = fl ? '#fff' : '#454c5e'; ctx.fillRect(-23, -9, 7, 18); ctx.fillRect(16, -9, 7, 18);
      ctx.fillStyle = e.col; ctx.fillRect(-16, -13, 32, 3); ctx.fillRect(-16, 10, 32, 3); ctx.fillRect(-23, -9, 7, 2); ctx.fillRect(16, -9, 7, 2);
      ctx.fillStyle = rec ? '#6a7080' : e.col; ctx.globalAlpha *= .75 + .25 * Math.sin(this.t * 8); ctx.fillRect(-6, -5, 12, 10); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.fillRect(-2, -2, 4, 4);
      for (let i = 0; i < e.phase; i++) { ctx.fillStyle = e.col; ctx.fillRect(-8 + i * 7, -19, 5, 4); }
      if (rec) T('...', 0, -34, 12, '#9fb0d0', 'center');
    } else if (e.type === 'briar') {
      // PHOTO 2 REFERENCE: Overgrown Briar Mech / Thornstalker Behemoth
      const sway = Math.sin(this.t * 5 + e.ph) * 1.5;
      ctx.save();
      ctx.scale(1.15, 1.15);

      // 1. Back Industrial Smokestacks with Toxic Green Vapor
      ctx.fillStyle = f ? '#fff' : '#292524';
      ctx.fillRect(-7, -18, 4, 9);
      ctx.fillRect(3, -19, 4, 10);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.beginPath(); ctx.arc(-5 + Math.sin(this.t * 8) * 2, -22 - (this.t * 12 % 8), 3, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(5 + Math.cos(this.t * 8) * 2, -23 - (this.t * 14 % 8), 3.5, 0, 6.3); ctx.fill();

      // 2. Heavy Rusted Cybernetic Torso & Legs
      ctx.fillStyle = f ? '#fff' : '#3f3228';
      ctx.fillRect(-9, -8, 18, 16);
      ctx.strokeStyle = f ? '#fff' : '#1c1917';
      ctx.lineWidth = 1.5; ctx.strokeRect(-9, -8, 18, 16);

      // Glowing Green Power Conduits
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(7, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(4, 4); ctx.stroke();

      // Legs & Heavy Claws
      ctx.fillStyle = f ? '#fff' : '#26221f';
      ctx.fillRect(-8, 8, 5, 8);
      ctx.fillRect(3, 8, 5, 8);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-10, 15, 7, 2);
      ctx.fillRect(3, 15, 7, 2);

      // 3. Cybernetic Skull Head with Glowing Green Visor & Fanged Jaws
      ctx.fillStyle = f ? '#fff' : '#292524';
      ctx.fillRect(-6, -14, 12, 7);
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 5;
      ctx.fillRect(-4, -13, 8, 2.5);
      ctx.shadowBlur = 0;
      // Fanged Jaw Teeth
      ctx.fillStyle = f ? '#fff' : '#bef264';
      for (let i = -4; i <= 3; i += 2) {
        ctx.beginPath(); ctx.moveTo(i, -7); ctx.lineTo(i + 1, -5); ctx.lineTo(i + 2, -7); ctx.fill();
      }

      // 4. Left Heavy Arm (Spiked Gauntlet & Steel Talons)
      ctx.fillStyle = f ? '#fff' : '#44403c';
      ctx.fillRect(-14, -6, 5, 11);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.moveTo(-14, 5); ctx.lineTo(-17, 10); ctx.lineTo(-12, 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-11, 5); ctx.lineTo(-13, 10); ctx.lineTo(-9, 6); ctx.fill();

      // 5. Massive Right Arm: Whipping Thorn Brambles with Steel Scythe Blades
      ctx.save();
      ctx.translate(9, -2);
      ctx.rotate(Math.sin(this.t * 6 + e.ph) * 0.25);
      ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(8, -8 + sway, 14, 2 - sway, 16, 12 + sway);
      ctx.stroke();
      ctx.strokeStyle = '#166534'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.bezierCurveTo(6, 6 + sway, 15, -4 - sway, 14, 14 + sway);
      ctx.stroke();

      // Spikes & Thorns along the vine
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.moveTo(5, -4); ctx.lineTo(8, -8); ctx.lineTo(6, -2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(16, -2); ctx.lineTo(12, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, 8); ctx.lineTo(18, 9); ctx.lineTo(13, 11); ctx.fill();

      // Embedded Steel Scythe Blades on the vine whip tips
      ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(15, 11 + sway); ctx.lineTo(21, 15 + sway); ctx.lineTo(15, 17 + sway); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, 6 + sway); ctx.lineTo(18, 5 + sway); ctx.lineTo(14, 8 + sway); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();

      // 6. Overgrown Foliage & Creeping Vine Leaves
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(-5, -6, 2, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(4, 3, 2, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(-7, 2, 1.8, 0, 6.3); ctx.fill();

      ctx.restore();
    } else if (e.type === 'drone') {
      // PHOTO 1 REFERENCE: Vortex Sub-Drone / Hydro-Core Automaton
      const hover = Math.sin(this.t * 7 + e.ph) * 3;
      ctx.save();
      ctx.translate(0, hover);

      // 1. Rear Stabilizer Fins & Jet Thrusters
      ctx.fillStyle = f ? '#fff' : '#27272a';
      // Top fin
      ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-14, -13); ctx.lineTo(-9, -4); ctx.closePath(); ctx.fill();
      // Bottom fin
      ctx.beginPath(); ctx.moveTo(-7, 7); ctx.lineTo(-14, 13); ctx.lineTo(-9, 4); ctx.closePath(); ctx.fill();
      // Jet nozzle
      ctx.fillStyle = f ? '#fff' : '#3f3f46';
      ctx.fillRect(-12, -4, 4, 8);
      // Jet exhaust plasma & water bubbles
      ctx.fillStyle = '#38bdf8';
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.t * 15);
      ctx.fillRect(-16, -2, 4, 4);
      ctx.beginPath(); ctx.arc(-18 - (this.t * 20 % 6), -3 + Math.sin(this.t * 10) * 3, 1.5, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(-22 - (this.t * 15 % 8), 2 + Math.cos(this.t * 8) * 3, 2, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1;

      // 2. Central Hull & Glass Containment Cylinder
      ctx.fillStyle = f ? '#fff' : '#334155';
      ctx.fillRect(-7, -8, 15, 16);
      ctx.strokeStyle = f ? '#fff' : '#1e293b';
      ctx.lineWidth = 1; ctx.strokeRect(-7, -8, 15, 16);

      // Glass pressure chamber
      ctx.fillStyle = f ? '#fff' : 'rgba(6, 182, 212, 0.25)';
      ctx.fillRect(-5, -6, 11, 12);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 0.8; ctx.strokeRect(-5, -6, 11, 12);

      // Swirling Hydro-Vortex inside glass cylinder
      ctx.save();
      ctx.translate(0.5, 0);
      ctx.rotate(this.t * 6 + e.ph);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, 4.2); ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(0, 0, 2, 2.5, 6.0); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.3); ctx.fill();
      ctx.restore();

      // Glowing Cyan Coolant Tubes
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-4, -6); ctx.bezierCurveTo(-9, -8, -9, 0, -5, 4);
      ctx.stroke();

      // Hazard Warning Stripe Badge (Yellow/Black diagonal)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(4, -2, 5, 5);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(5, -2, 1.5, 5);

      // 3. Top Sensor Head / Cyclops Camera
      ctx.fillStyle = f ? '#fff' : '#1e293b';
      ctx.fillRect(-4, -12, 10, 6);
      ctx.strokeStyle = '#475569'; ctx.strokeRect(-4, -12, 10, 6);
      // Glowing Red Optic Eye / Visor
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(3, -9, 2.2, 0, 6.3); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(2.2, -10, 1, 1);

      // 4. Side sensor probe
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-8, -1, 3, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-8, 0, 1, 1);

      // 5. Lower Robotic Claw Arms
      ctx.strokeStyle = f ? '#fff' : '#64748b';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(2, 8); ctx.lineTo(4, 12); ctx.lineTo(7, 13); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, 12); ctx.lineTo(3, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(-6, 12); ctx.lineTo(-3, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(-8, 13); ctx.stroke();

      ctx.restore();
    } else if (e.type === 'anomaly') {
      ctx.fillStyle = f ? '#fff' : '#1f3a6e'; ctx.beginPath(); ctx.arc(0, 0, e.w / 2 + 1 + Math.sin(this.t * 5 + e.ph), 0, 6.3); ctx.fill();
      ctx.fillStyle = f ? '#fff' : '#58b2ff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ff2b2b'; ctx.fillRect(-1, -7, 3, 3);
    } else if (e.type === 'slime') {
      const jz = e.jz || 0;
      const isAir = jz > 2;
      const sx = isAir ? 0.84 : (e.jumping > 0 ? 0.92 : 1.15 + Math.sin(this.t * 8 + e.ph) * 0.08);
      const sy = isAir ? 1.25 : (e.jumping > 0 ? 1.08 : 0.85 - Math.sin(this.t * 8 + e.ph) * 0.08);

      if (jz > 0) {
        ctx.save();
        ctx.translate(0, jz);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 7, Math.max(2, 11 * (1 - jz / 25)), Math.max(1, 4 * (1 - jz / 25)), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(0, -jz);
      ctx.scale(sx, sy);

      // Translucent Jelly Body tinted by Elemental Affinity
      const jellyCol = f ? '#ffffff' : (eAff.color || '#38bdf8');
      ctx.fillStyle = jellyCol;
      ctx.globalAlpha = f ? 0.95 : 0.82;
      ctx.beginPath();
      ctx.moveTo(-10, 7);
      ctx.bezierCurveTo(-11, 7, -12, 2, -10, -3);
      ctx.bezierCurveTo(-8, -9, -3, -11, 0, -11);
      ctx.bezierCurveTo(3, -11, 8, -9, 10, -3);
      ctx.bezierCurveTo(12, 2, 11, 7, 10, 7);
      ctx.closePath();
      ctx.fill();

      // Slime Border
      ctx.strokeStyle = f ? '#ffffff' : (eAff.color || '#0284c7');
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner Elemental Core
      if (!f) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -2, 3.5 + Math.sin(this.t * 10 + e.ph) * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = eAff.color;
        ctx.beginPath();
        ctx.arc(0, -2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Specular gloss reflection
      ctx.globalAlpha = f ? 0.4 : 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-3.5, -6.5, 3.5, 2, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Tracking Eyes
      const pl = World.pl;
      const eyeDx = pl ? clamp((pl.x - e.x) * 0.015, -1.8, 1.8) : 0;
      const eyeDy = pl ? clamp(((pl.y - 6) - e.y) * 0.015, -1, 1) : 0;

      ctx.globalAlpha = 1;
      ctx.fillStyle = f ? '#ff4a4a' : '#0f172a';
      ctx.beginPath();
      ctx.arc(-4 + eyeDx, -1 + eyeDy, 2, 0, Math.PI * 2);
      ctx.arc(4 + eyeDx, -1 + eyeDy, 2, 0, Math.PI * 2);
      ctx.fill();

      if (!f) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.5 + eyeDx, -1.8 + eyeDy, 0.8, 0, Math.PI * 2);
        ctx.arc(3.5 + eyeDx, -1.8 + eyeDy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    } else {
      const s = e.type === 'boss' ? 2 : 1; ctx.scale(s, s);
      ctx.fillStyle = f ? '#fff' : '#2a2f3a'; ctx.fillRect(-7, -5, 14, 10);
      ctx.fillStyle = f ? '#fff' : '#454c5e'; ctx.fillRect(-9, -7, 4, 2); ctx.fillRect(5, -7, 4, 2);
      ctx.fillStyle = '#ff2b2b'; ctx.globalAlpha = .7 + .3 * Math.sin(this.t * 8 + e.ph); ctx.fillRect(-2, -2, 4, 4); ctx.globalAlpha = 1;
      ctx.fillStyle = '#58b2ff'; ctx.fillRect(-6, 2, 3, 2);
    }

    // Draw Enemy Elemental Indicator Badge & Weakness Signal
    const badgeY = (e.type === 'boss' || isColossus) ? -32 : (e.type === 'briar' ? -25 : (e.type === 'slime' ? -18 - (e.jz || 0) : -18));
    ctx.save();
    ctx.font = '10px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(eAff.icon, 0, badgeY);
    if (isWeak) {
      ctx.font = 'bold 9px "Rajdhani", sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 5;
      ctx.fillText('⚡ WEAK +50%', 0, badgeY - 11);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    ctx.restore();
    if (e.hp < e.max && e.type !== 'boss') { bar(e.x - 14, e.y - (e.jz || 0) - e.h / 2 - 14, 28, 3.5, e.hp, e.max, isWeak ? '#fbbf24' : '#ff5a4a'); }
  },

  drawHotbar() {
    const p = G.p;
    if (!p) return;
    const slots = BagSystem.getSlots(p);
    const sw = 42, sh = 42, gap = 4;
    const totalW = 9 * sw + 8 * gap;
    const startX = Math.floor((W - totalW) / 2);
    const startY = H - 48;

    ctx.save();
    // Stardew Valley Wood Hotbar Tray Frame
    const trayG = ctx.createLinearGradient(startX - 8, startY - 6, startX - 8, startY + sh + 6);
    trayG.addColorStop(0, '#452614');
    trayG.addColorStop(1, '#231209');
    ctx.fillStyle = trayG;
    ctx.fillRect(startX - 8, startY - 6, totalW + 16, sh + 12);
    ctx.strokeStyle = '#6d3c1d'; ctx.lineWidth = 2;
    ctx.strokeRect(startX - 8, startY - 6, totalW + 16, sh + 12);

    // Brass rivets
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(startX - 5, startY - 3, 3, 3);
    ctx.fillRect(startX + totalW + 2, startY - 3, 3, 3);
    ctx.fillRect(startX - 5, startY + sh, 3, 3);
    ctx.fillRect(startX + totalW + 2, startY + sh, 3, 3);

    for (let i = 0; i < 9; i++) {
      const slot = slots[i];
      const sx = startX + i * (sw + gap), sy = startY;
      const isSel = (this.selectedSlot === i);

      // Slot Background
      ctx.fillStyle = isSel ? '#352115' : '#1c130d';
      ctx.fillRect(sx, sy, sw, sh);

      // Wood bevels
      ctx.strokeStyle = isSel ? '#b45309' : '#452614';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy, sw, sh);

      // Inner shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(sx + 1, sy + 1, sw - 2, 2);
      ctx.fillRect(sx + 1, sy + 1, 2, sh - 2);

      // Slot Number Badge (1-9) in top-left
      ctx.font = 'bold 9px "Rajdhani", sans-serif';
      ctx.fillStyle = isSel ? '#fde047' : '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i + 1), sx + 3, sy + 2);

      // Item Icon in center
      if (slot && slot.icon) {
        ctx.font = '18px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.icon, sx + sw / 2, sy + sh / 2 + 1);
      }

      // Quantity / Level Badge in bottom-right
      if (slot && slot.count !== '' && slot.count !== undefined && slot.count !== 0) {
        ctx.font = 'bold 10px "Rajdhani", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(String(slot.count), sx + sw - 2, sy + sh - 1);
        ctx.shadowBlur = 0;
      }

      // Stardew Valley Golden Selection Box
      if (isSel) {
        const pulse = 0.35 + 0.25 * Math.sin(this.t * 8);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(sx - 1.5, sy - 1.5, sw + 3, sh + 3);
        ctx.strokeStyle = `rgba(253, 224, 71, ${pulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 3, sy - 3, sw + 6, sh + 6);
      }
    }

    // Active Slot Tooltip Banner above Hotbar
    const curSlot = slots[this.selectedSlot || 0];
    if (curSlot) {
      const tipText = `[ ${curSlot.slotNum} ] ${curSlot.name} ${curSlot.count ? '(' + curSlot.count + ')' : ''}  •  ${curSlot.actionLabel ? curSlot.actionLabel + ' [Click / 1-9]' : 'Selected'}`;
      ctx.font = 'bold 11px "Rajdhani", sans-serif';
      const tw = ctx.measureText(tipText).width + 24;
      const tx = Math.floor((W - tw) / 2), ty = startY - 24;
      ctx.fillStyle = 'rgba(18, 12, 10, 0.9)';
      ctx.fillRect(tx, ty, tw, 20);
      ctx.strokeStyle = curSlot.color || '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, tw, 20);
      ctx.fillStyle = curSlot.color || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tipText, W / 2, ty + 10);
    }

    ctx.restore();
  },

  drawBag() {
    const p = G.p;
    if (!p) return;
    const slots = BagSystem.getSlots(p);
    const winfo = getWeaponInfo(p);
    const bw = 640, bh = 390;
    const bx = Math.floor((W - bw) / 2), by = Math.floor((H - bh) / 2);

    ctx.save();
    // Modal Dim Backdrop
    ctx.fillStyle = 'rgba(4, 7, 18, 0.82)';
    ctx.fillRect(0, 0, W, H);

    // Stardew Valley Ornate Wood & Brass Frame
    const winG = ctx.createLinearGradient(bx, by, bx, by + bh);
    winG.addColorStop(0, '#321d12');
    winG.addColorStop(1, '#1c100a');
    ctx.fillStyle = winG;
    ctx.fillRect(bx, by, bw, bh);

    // Outer & Inner Borders
    ctx.strokeStyle = '#5a341a'; ctx.lineWidth = 4;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.strokeStyle = '#854d27'; ctx.lineWidth = 2;
    ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);

    // Corner Brass Brackets
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx + 6, by + 6, 8, 8);
    ctx.fillRect(bx + bw - 14, by + 6, 8, 8);
    ctx.fillRect(bx + 6, by + bh - 14, 8, 8);
    ctx.fillRect(bx + bw - 14, by + bh - 14, 8, 8);

    // Top Header Banner
    ctx.fillStyle = '#422415';
    ctx.fillRect(bx + 16, by + 12, bw - 32, 32);
    ctx.strokeStyle = '#7c4322'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 16, by + 12, bw - 32, 32);
    T('🎒 ASTRAL INVENTORY & CELESTIAL FORGE ⭐', bx + (bw / 2), by + 18, 15, '#fde047', 'center');

    // Close Button [ ✕ ]
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(bx + bw - 44, by + 14, 28, 28);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + bw - 44, by + 14, 28, 28);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', bx + bw - 30, by + 28);

    // Section 1: 3 Rows of 9 Stardew Inventory Slots (Left)
    const sw = 40, sh = 40, gap = 4;
    const gridX = bx + 22;

    T('HOTBAR [1 - 9]', gridX, by + 48, 10, '#fde047');
    T('STORAGE [10 - 18]', gridX, by + 98, 10, '#94a3b8');
    T('RELICS & ARTIFACTS [19 - 27]', gridX, by + 148, 10, '#c084fc');

    for (let r = 0; r < 3; r++) {
      const rowY = by + 60 + r * 48;
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const slot = slots[idx];
        const sx = gridX + c * (sw + gap), sy = rowY;
        const isSel = (this.bagSel === idx);

        // Slot Box
        ctx.fillStyle = isSel ? '#452a1b' : (r === 0 ? '#261710' : '#1a100b');
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = isSel ? '#fde047' : (r === 0 ? '#6d3c1d' : '#452715');
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(sx, sy, sw, sh);

        // Slot number in top-left
        ctx.font = 'bold 8px "Rajdhani", sans-serif';
        ctx.fillStyle = isSel ? '#fde047' : '#64748b';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(String(idx + 1), sx + 2, sy + 2);

        // Icon
        if (slot && slot.icon) {
          ctx.font = '16px "Segoe UI Emoji", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(slot.icon, sx + sw / 2, sy + sh / 2 + 1);
        }

        // Count / Level badge
        if (slot && slot.count !== '' && slot.count !== undefined && slot.count !== 0) {
          ctx.font = 'bold 9px "Rajdhani", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
          ctx.shadowColor = '#000000'; ctx.shadowBlur = 2;
          ctx.fillText(String(slot.count), sx + sw - 2, sy + sh - 1);
          ctx.shadowBlur = 0;
        }

        // Selected Halo
        if (isSel) {
          ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
          ctx.strokeRect(sx - 1, sy - 1, sw + 2, sh + 2);
        }
      }
    }

    // Section 2: Character & Elemental Wheel (Right Panel)
    const panX = bx + 424, panY = by + 56, panW = 194, panH = 148;
    ctx.fillStyle = '#22140d';
    ctx.fillRect(panX, panY, panW, panH);
    ctx.strokeStyle = '#5a341a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(panX, panY, panW, panH);

    // Player Mini Avatar & Guild
    const pElem = (p.element === 'Air' ? 'Wind' : p.element) || 'Fire';
    const pAff = ELEMENT_AFFINITY[pElem] || ELEMENT_AFFINITY.Fire;
    drawChar(panX + 28, panY + 38, {
      guild: p.guild, element: p.element, outfit: p.outfit, hair: p.hair,
      hairStyle: p.hairStyle || 0, elc: pAff.color, fx: 0, fy: 1, moving: false
    }, this.t, 1.1);

    T(p.name + '  Lv.' + p.lvl, panX + 54, panY + 8, 13, '#ffffff');
    T(p.guild + ' (' + p.element + ')', panX + 54, panY + 24, 11, pAff.color, 'left', false);
    T('ATK: ' + Math.round(sx(p).atk) + '  SPD: ' + sx(p).spd, panX + 54, panY + 38, 10, '#cbd5e1', 'left', false);

    // Elemental Affinity Wheel & Rules
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(panX + 6, panY + 54, panW - 12, 88);
    ctx.strokeStyle = pAff.color; ctx.lineWidth = 1;
    ctx.strokeRect(panX + 6, panY + 54, panW - 12, 88);

    T('ELEMENTAL AFFINITY CYCLE', panX + panW / 2, panY + 58, 9, '#fde047', 'center');
    T('🔥 FIRE  →  🌪️ WIND', panX + panW / 2, panY + 70, 10, '#ff8a75', 'center');
    T('  ↑            ↓   ', panX + panW / 2, panY + 82, 9, '#64748b', 'center');
    T('💧 WATER ←  🌿 EARTH', panX + panW / 2, panY + 94, 10, '#38bdf8', 'center');

    const bonusText = `Your ${pAff.icon} ${pAff.name}: +50% vs ${pAff.strongVs} foes!`;
    T(bonusText, panX + panW / 2, panY + 110, 10, '#fde047', 'center');
    T(`(Resisted by ${pAff.weakVs} foes -25%)`, panX + panW / 2, panY + 124, 9, '#94a3b8', 'center');

    // Section 3: Item Inspector & Forge Panel (Bottom)
    const inspX = bx + 22, inspY = by + 210, inspW = bw - 44, inspH = 138;
    ctx.fillStyle = '#22140d';
    ctx.fillRect(inspX, inspY, inspW, inspH);
    ctx.strokeStyle = '#5a341a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(inspX, inspY, inspW, inspH);

    const selItem = slots[this.bagSel || 0] || slots[0];

    // Big Item Icon Box
    ctx.fillStyle = '#170e09';
    ctx.fillRect(inspX + 12, inspY + 12, 54, 54);
    ctx.strokeStyle = selItem.color || '#f59e0b'; ctx.lineWidth = 2;
    ctx.strokeRect(inspX + 12, inspY + 12, 54, 54);
    ctx.font = '28px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(selItem.icon || '📦', inspX + 39, inspY + 39);

    // Item Details
    T(selItem.name + (selItem.count ? ' (' + selItem.count + ')' : ''), inspX + 76, inspY + 12, 14, selItem.color || '#ffffff');
    T('TYPE: ' + (selItem.type || 'ITEM').toUpperCase() + (selItem.slotNum ? '  •  HOTBAR SLOT: ' + selItem.slotNum : ''), inspX + 76, inspY + 28, 10, '#94a3b8');

    wrap(selItem.desc || '', 270, 11).slice(0, 3).forEach((line, li) => {
      T(line, inspX + 76, inspY + 44 + li * 15, 11, '#e2e8f0', 'left', false);
    });

    // Primary Action Button
    const btn1X = inspX + 360, btn1Y = inspY + 14, btn1W = 224, btn1H = 34;
    const isWep = (selItem.id === 'weapon' || selItem.id === 'anvil');
    const canAffordWep = p.inv.shards >= winfo.cost && winfo.level < 20;

    let b1Col = '#2563eb', b1Border = '#60a5fa', b1Text = 'USE ITEM';
    if (isWep) {
      b1Col = canAffordWep ? '#15803d' : '#374151';
      b1Border = canAffordWep ? '#4ade80' : '#6b7280';
      b1Text = winfo.level >= 20 ? 'GODFORGE (MAX LEVEL)' : `⚒️ UPGRADE (+${winfo.level + 1}) [${winfo.cost} 💎]`;
    } else if (selItem.type === 'consumable') {
      b1Col = selItem.canUse ? '#be185d' : '#374151';
      b1Border = selItem.canUse ? '#f472b6' : '#6b7280';
      b1Text = selItem.actionLabel ? `[J / CLICK] ${selItem.actionLabel}` : 'USE ITEM';
    } else if (selItem.type === 'material') {
      b1Col = selItem.canUse ? '#b45309' : '#374151';
      b1Border = selItem.canUse ? '#f59e0b' : '#6b7280';
      b1Text = selItem.actionLabel ? `[J / CLICK] ${selItem.actionLabel}` : 'SELL ITEM';
    } else {
      b1Col = '#0284c7'; b1Border = '#38bdf8';
      b1Text = selItem.actionLabel || 'INSPECT';
    }

    ctx.fillStyle = b1Col;
    ctx.fillRect(btn1X, btn1Y, btn1W, btn1H);
    ctx.strokeStyle = b1Border; ctx.lineWidth = 1.5;
    ctx.strokeRect(btn1X, btn1Y, btn1W, btn1H);
    T(b1Text, btn1X + btn1W / 2, btn1Y + 9, 12, '#ffffff', 'center');

    // Sell All Loot Button
    const btn2X = inspX + 360, btn2Y = inspY + 54, btn2W = 224, btn2H = 30;
    const hasLoot = (p.inv.bones > 0 || p.inv.circuits > 0);
    const lootVal = (p.inv.bones || 0) * 5 + (p.inv.circuits || 0) * 8;
    ctx.fillStyle = hasLoot ? '#854d0e' : '#27272a';
    ctx.fillRect(btn2X, btn2Y, btn2W, btn2H);
    ctx.strokeStyle = hasLoot ? '#eab308' : '#52525b'; ctx.lineWidth = 1.5;
    ctx.strokeRect(btn2X, btn2Y, btn2W, btn2H);
    T(hasLoot ? `💰 SELL ALL LOOT (+${lootVal} 💎)` : '💰 NO LOOT TO SELL', btn2X + btn2W / 2, btn2Y + 8, 11, hasLoot ? '#fef08a' : '#71717a', 'center');

    // Shards counter & summary
    T(`💎 Shards: ${p.inv.shards}   🧪 Potions: ${p.inv.potions}   ⚡ Tonics: ${p.inv.elixirs !== undefined ? p.inv.elixirs : 2}   💣 Bombs: ${p.inv.bombs !== undefined ? p.inv.bombs : 2}`, inspX + 14, inspY + 92, 11, '#fde047');
    T('⌨ Hotkeys: [1 - 9] Quick-Use Slot | [Arrows / WASD] Navigate | [J] Activate | [B / ESC] Close Bag', inspX + 14, inspY + 114, 10, '#94a3b8');

    ctx.restore();
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

/* ================= Dynamic Real RPG Health & Stamina HUD Overlay ================= */
let hudLagHp = 100;
function updateRpgHud(dt) {
  const hud = document.getElementById('rpg-hud');
  if (!hud) return;
  const p = G.p;
  if (!p || scene !== World) {
    if (!hud.classList.contains('hidden')) hud.classList.add('hidden');
    return;
  }
  if (hud.classList.contains('hidden')) hud.classList.remove('hidden');

  const st = sx(p);
  const maxHp = Math.max(1, st.maxHp);
  const maxSta = Math.max(1, st.maxSta);
  const curHp = Math.max(0, p.hp);
  const curSta = Math.max(0, p.sta);

  const hpPct = clamp((curHp / maxHp) * 100, 0, 100);
  const staPct = clamp((curSta / maxSta) * 100, 0, 100);

  // Animated HP Lag Bar (Soulslike trailing orange damage meter)
  if (hudLagHp > curHp) {
    hudLagHp = Math.max(curHp, hudLagHp - dt * 50);
  } else {
    hudLagHp = curHp;
  }
  const lagPct = clamp((hudLagHp / maxHp) * 100, 0, 100);

  // Critical HP Alert Pulse (< 25% health)
  if (curHp <= maxHp * 0.25) {
    hud.classList.add('critical-hp');
  } else {
    hud.classList.remove('critical-hp');
  }

  // Crest Ring, Glow & Zodiac Glyph
  const glyphEl = document.getElementById('hudZodiacGlyph');
  if (glyphEl) glyphEl.textContent = ZODIAC_SIGILS[p.guild] || '♈';

  const ringEl = document.getElementById('hudCrestRing');
  const glowEl = document.getElementById('hudCrestGlow');
  const pElem = (p.element === 'Air' ? 'Wind' : p.element) || 'Fire';
  const pAff = ELEMENT_AFFINITY[pElem] || ELEMENT_AFFINITY.Fire;
  if (ringEl) ringEl.style.borderColor = pAff.color;
  if (glowEl) glowEl.style.background = `radial-gradient(circle, ${pAff.color}77 0%, transparent 70%)`;

  const lvlEl = document.getElementById('hudLevelNum');
  if (lvlEl) lvlEl.textContent = p.lvl;

  const nameEl = document.getElementById('hudPlayerName');
  if (nameEl) nameEl.textContent = (p.name || 'CLIMBER').toUpperCase();

  const guildEl = document.getElementById('hudGuildBadge');
  if (guildEl) {
    guildEl.textContent = (p.guild || 'ARIES').toUpperCase();
    guildEl.style.color = pAff.color;
    guildEl.style.borderColor = pAff.color;
  }

  // Elemental Affinity Pill & Advantage
  const affIcon = document.getElementById('hudAffinityIcon');
  if (affIcon) affIcon.textContent = pAff.icon;
  const affText = document.getElementById('hudAffinityText');
  if (affText) {
    const opp = ELEMENT_AFFINITY[pAff.strongVs];
    affText.textContent = `${pAff.name} • +50% vs ${opp ? opp.icon : '⚡'}`;
  }
  const affPill = document.getElementById('hudAffinityPill');
  if (affPill) {
    affPill.style.color = pAff.color;
    affPill.style.borderColor = pAff.color;
  }

  // HP Bar Fill, Lag & Numeric readout
  const hpFill = document.getElementById('hudHpFill');
  if (hpFill) hpFill.style.width = hpPct + '%';

  const hpLag = document.getElementById('hudHpLag');
  if (hpLag) hpLag.style.width = lagPct + '%';

  const hpVal = document.getElementById('hudHpVal');
  if (hpVal) hpVal.textContent = Math.ceil(curHp);

  const hpMax = document.getElementById('hudHpMax');
  if (hpMax) hpMax.textContent = maxHp;

  // Stamina Bar Fill & Numeric readout
  const staFill = document.getElementById('hudStaFill');
  if (staFill) staFill.style.width = staPct + '%';

  const staVal = document.getElementById('hudStaVal');
  if (staVal) staVal.textContent = Math.floor(curSta);

  const staMax = document.getElementById('hudStaMax');
  if (staMax) staMax.textContent = maxSta;

  // EXP Progression Bar Fill & Numeric readout
  const expNeed = p.lvl * 35;
  const expPct = clamp((p.xp / expNeed) * 100, 0, 100);
  const expFill = document.getElementById('hudExpFill');
  if (expFill) expFill.style.width = expPct + '%';

  const expVal = document.getElementById('hudExpVal');
  if (expVal) expVal.textContent = p.xp;

  const expMax = document.getElementById('hudExpMax');
  if (expMax) expMax.textContent = expNeed;

  // Quick Skill & Ultimate Status Orbs
  const pl = World.pl;
  const sk = SKILLS[p.guild];
  const scd = sk ? sk.cd * (1 - 0.12 * (rankOf(p) - 1)) : 5;
  const skSlot = document.getElementById('hudSkillSlot');
  const skSweep = document.getElementById('hudSkillSweep');
  if (skSweep && pl) {
    const cdRatio = pl.skCd > 0 ? clamp(pl.skCd / scd, 0, 1) : 0;
    skSweep.style.height = (cdRatio * 100) + '%';
    if (skSlot) {
      if (pl.skCd <= 0) skSlot.classList.add('ready');
      else skSlot.classList.remove('ready');
    }
  }

  const ultSlot = document.getElementById('hudUltSlot');
  const ultSweep = document.getElementById('hudUltSweep');
  if (ultSweep && pl) {
    if (p.lvl < ULT_LVL) {
      ultSweep.style.height = '100%';
      if (ultSlot) {
        ultSlot.classList.remove('ready');
        ultSlot.title = `Ultimate unlocks at Lv ${ULT_LVL}`;
      }
    } else {
      const cdRatio = pl.ultCd > 0 ? clamp(pl.ultCd / ULT_CD, 0, 1) : 0;
      ultSweep.style.height = (cdRatio * 100) + '%';
      if (ultSlot) {
        ultSlot.title = `Ultimate: ${ULTS[p.guild].name} (Hold L)`;
        if (pl.ultCd <= 0 && p.sta >= ULT_COST) ultSlot.classList.add('ready');
        else ultSlot.classList.remove('ready');
      }
    }
  }
}

/* ================= Main loop ================= */
go(Title);
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  Input.update();
  scene.update(dt);
  if (scene !== World) toastT -= dt;
  updateRpgHud(dt);
  ctx.clearRect(0, 0, W, H); scene.draw();
  if (scene !== World && toastT > 0) { ctx.globalAlpha = clamp(toastT, 0, 1); { const tw = Math.max(340, toastS.length * 8 + 30); panel(W / 2 - tw / 2, H - 100, tw, 26, '#7ec8ff'); } T(toastS, W / 2, H - 94, 13, '#fff', 'center'); ctx.globalAlpha = 1; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__astral = { G, get scene() { return scene; } }; // handy for debugging in the console
})();
