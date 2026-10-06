/* Astral Spire RPG - dependency-free HTML5 canvas game. MIT License. */
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

/* ================= Audio / toast ================= */
let ac = null;
function beep(f, d, type, v) {
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.value = f; g.gain.value = v || 0.03;
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (d || 0.08));
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + (d || 0.08));
  } catch (e) { /* audio is optional */ }
}
let toastS = '', toastT = 0;
function toast(s) { toastS = s; toastT = 2.2; }

/* ================= Input (keyboard + touch) ================= */
const Input = (function () {
  const keys = {}, joy = { x: 0, y: 0 }, tb = { j: false, k: false, p: false };
  let cur = {}, prev = {}, pend = null;
  const KM = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right', KeyJ: 'j', Enter: 'j', Space: 'j', KeyK: 'k', Backspace: 'k', Escape: 'p', KeyP: 'p' };
  window.addEventListener('keydown', e => { const a = KM[e.code]; if (a) { keys[a] = true; e.preventDefault(); } });
  window.addEventListener('keyup', e => { const a = KM[e.code]; if (a) { keys[a] = false; e.preventDefault(); } });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const api = {
    joy, tb, tap: null, cur: {},
    update() {
      prev = cur;
      cur = {
        up: !!keys.up || joy.y < -0.55, down: !!keys.down || joy.y > 0.55,
        left: !!keys.left || joy.x < -0.55, right: !!keys.right || joy.x > 0.55,
        j: !!keys.j || tb.j, k: !!keys.k || tb.k, p: !!keys.p || tb.p
      };
      api.cur = cur; api.tap = pend; pend = null;
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
  btn('bJ', 'j'); btn('bK', 'k'); btn('bP', 'p');

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
  const inv = d.inv || {}, bo = d.bounty || {}, fl = d.flags || {};
  return {
    v: 1, name: String(d.name || 'Climber').slice(0, 12), guild: g[0], element: g[1],
    outfit: int(d.outfit, 0, 0, 5), hair: int(d.hair, 0, 0, 5),
    floor: int(d.floor, 1, 1, 100), loc: d.loc === 'floor' ? 'floor' : 'hub',
    lvl: int(d.lvl, 1, 1, 99), xp: int(d.xp, 0, 0, 1e9), hp: Math.max(1, Number(d.hp) || 1), sta: Math.max(0, Number(d.sta) || 0),
    inv: { shards: int(inv.shards, 0, 0, 1e9), bones: int(inv.bones, 0, 0, 1e9), circuits: int(inv.circuits, 0, 0, 1e9), potions: int(inv.potions, 0, 0, 99) },
    kills: int(d.kills, 0, 0, 1e9), best: int(d.best, 1, 1, 100),
    bounty: { need: int(bo.need, 5, 1, 999), have: int(bo.have, 0, 0, 999), done: int(bo.done, 0, 0, 999) },
    flags: { yuna: !!fl.yuna, yuri: !!fl.yuri, yumi: !!fl.yumi, yuki: !!fl.yuki },
    lastSaved: d.lastSaved || ''
  };
}
function sx(p) {
  const e = ELEM[p.element], L = p.lvl - 1;
  return { maxHp: e.hp + L * 12, maxSta: e.sta + L * 3, atk: e.atk + L * 2, spd: e.spd };
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
    T('Keyboard: WASD/Arrows move  J act/sprint  K attack  Esc pause', 44, H - 52, 11, '#6f86b4', 'left', false);
    T('Touch: joystick + J / K buttons.  3 save slots.', 44, H - 36, 11, '#6f86b4', 'left', false);
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
    panel(490, 24, 290, 400, e.color);
    drawChar(635, 190, { outfit: OUTFITS[s.o], hair: HAIRS[s.h], elc: e.color, fx: 1, fy: 1, moving: true }, this.t, 5);
    T(g[0] + ' Guild', 635, 218, 20, e.color, 'center');
    T(g[1] + ' | ' + e.cls, 635, 244, 12, '#cfe6ff', 'center');
    const ds = wrap(g[2], 250, 12); ds.forEach((l, i) => T(l, 635, 268 + i * 16, 12, '#a9c4ee', 'center', false));
    T('HP ' + e.hp + '   STA ' + e.sta, 635, 322, 12, '#cfe6ff', 'center');
    T('ATK ' + e.atk + '   SPD ' + e.spd, 635, 340, 12, '#cfe6ff', 'center');
    wrap('Perk: ' + e.perk, 250, 12).forEach((l, i) => T(l, 635, 364 + i * 16, 12, '#ffe08a', 'center', false));
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
const CLIMBERS = {
  yuna: { name: 'Yuna', title: 'Pyromancer', el: 'Fire', outfit: '#e0382d', hair: '#ff7a2a', x: 250, y: 215,
    lines: ['Hah! Another fresh face at the blast doors? Don\'t flinch. The Spire can smell hesitation.',
      'Fire Guilds break things first and ask questions never. Keep up if you can.'] },
  yuri: { name: 'Yuri', title: 'Geomancer', el: 'Earth', outfit: '#6b7d33', hair: '#4a3a24', x: 370, y: 215,
    lines: ['...You are still standing. Good. Most people sprint until their stamina is gone.',
      'Hold the line, watch the gauge, and let the enemy come to you.'] },
  yumi: { name: 'Yumi', title: 'Aeromancer', el: 'Air', outfit: '#17b8a8', hair: '#e8f6ff', x: 590, y: 215,
    lines: ['Ooh, a newbie! Bet you three shards you can\'t reach Floor 5 before I get bored.',
      'Tip: hold J while moving to sprint. Just don\'t run dry.'] },
  yuki: { name: 'Yuki', title: 'Hydromancer', el: 'Water', outfit: '#3f86e0', hair: '#9ad0ff', x: 710, y: 215,
    lines: ['Welcome. You look tired already. Rest here: hubs are the only safe ground.',
      'Every hub heals you fully. Please don\'t push past your limits.'] }
};
const World = {
  enter(mode) {
    const p = G.p, st = sx(p);
    Object.assign(this, { mode, t: 0, walls: [], ints: [], enemies: [], fx: [], texts: [], menu: null, paused: false, pm: null, cleared: false, banner: 0, shake: 0, atkId: 0 });
    this.pl = { x: 0, y: 0, w: 12, h: 10, fx: 0, fy: 1, atkT: 0, atkCd: 0, inv: 0, regenD: 0, moving: false, kx: 0, ky: 0, kbT: 0 };
    const pl = this.pl, self = this;
    if (mode === 'hub') {
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
        Dlg.say('Narrator', '#7ec8ff', ['The sanctuary hums with neon. Talk to the four elite climbers, then step through the blast door at the top.', 'Controls: move with WASD / joystick, J to interact (hold to sprint), K to attack.']);
    } else {
      const f = p.floor, bi = Math.floor((f - 1) / 5) % 3, bio = BIOMES[bi]; this.bio = bio;
      this.W = 1400; this.H = 900; p.loc = 'floor';
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
            hp: boss ? 120 + f * 12 : an ? 30 + f * 3.2 : 18 + f * 2.2, max: 0,
            spd: boss ? 58 : an ? 42 : 58 + Math.min(30, f * .4), dmg: boss ? 16 + f * .5 : an ? 10 + f * .45 : 7 + f * .35,
            xp: boss ? 40 + f * 3 : an ? 9 + f : 6 + f, wt: 0, dx: 0, dy: 0, flash: 0, kbT: 0, kx: 0, ky: 0, last: 0, ph: Math.random() * 6
          }); const e = this.enemies[this.enemies.length - 1]; e.max = e.hp; return;
        }
      };
      for (let i = 0; i < count; i++) spawn(i % 3 === 2 ? 'anomaly' : 'drone');
      if (isBoss) spawn('boss');
      this.total = this.enemies.length;
      this.banner = 3; this.bannerText = 'Floor ' + f + ' - ' + bio.name + (isBoss ? ' (Guardian!)' : '');
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
    const p = G.p, self = this;
    this.menu = Menu([
      { label: () => 'Sell loot (+' + (p.inv.bones * 5 + p.inv.circuits * 8) + ')', sub: () => p.inv.bones + ' bones, ' + p.inv.circuits + ' circuits', enabled: () => p.inv.bones + p.inv.circuits > 0,
        fn: () => { const g = p.inv.bones * 5 + p.inv.circuits * 8; p.inv.shards += g; p.inv.bones = p.inv.circuits = 0; toast('Sold for ' + g + ' shards'); autosave(); } },
      { label: 'Buy Potion (30 shards)', sub: () => 'You have ' + p.inv.potions, enabled: () => p.inv.shards >= 30,
        fn: () => { p.inv.shards -= 30; p.inv.potions++; toast('Potion bought'); autosave(); } },
      { label: 'Leave', fn: () => { self.menu = null; } }
    ], 150, 150, 500, 50);
  },
  enterFloor() { this.enter0 = true; go(World, 'floor'); },
  gainXp(n) {
    const p = G.p; p.xp += n;
    while (p.xp >= p.lvl * 35) { p.xp -= p.lvl * 35; p.lvl++; const st = sx(p); p.hp = st.maxHp; p.sta = st.maxSta; toast('Level up! Lv ' + p.lvl); beep(1000, .2, 'triangle', .05); }
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
  killEnemy(e) {
    const p = G.p, st = sx(p), boss = e.type === 'boss', an = e.type === 'anomaly';
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
    this.t += dt; toastT -= dt; this.banner -= dt; this.shake -= dt;
    if (Dlg.active) { Dlg.update(dt); return; }
    if (this.menu) { if (Input.just('k')) this.menu = null; else menuStep(this.menu); return; }
    if (this.paused) { if (Input.just('p') || Input.just('k')) { this.paused = false; return; } menuStep(this.pm); return; }
    if (Input.just('p')) { this.paused = true; this.pm = this.pauseMenu(); return; }

    const p = G.p, st = sx(p), pl = this.pl, W2 = this.W, H2 = this.H;
    const mv = Input.move(), near = this.nearest(), mm = Math.hypot(mv.x, mv.y);
    pl.moving = mm > 0.05;
    if (pl.moving) { pl.fx = mv.x / mm; pl.fy = mv.y / mm; }
    const sprint = Input.cur.j && !near && pl.moving && p.sta > 0;
    const speed = st.spd * (sprint ? 1.6 : 1) * (pl.atkT > 0 ? .6 : 1);
    if (sprint) { p.sta = Math.max(0, p.sta - 20 * dt); pl.regenD = .5; }
    else { pl.regenD -= dt; if (pl.regenD <= 0) p.sta = Math.min(st.maxSta, p.sta + (p.element === 'Air' ? 20 : 12) * dt); }
    pl.inv -= dt; pl.atkT -= dt; pl.atkCd -= dt;
    let kx = 0, ky = 0; if (pl.kbT > 0) { pl.kbT -= dt; kx = pl.kx; ky = pl.ky; }
    moveBox(pl, (mv.x * speed + kx) * dt, 0, this.walls, W2, H2); moveBox(pl, 0, (mv.y * speed + ky) * dt, this.walls, W2, H2);

    if (near && Input.just('j')) { beep(700, .05); near.fn(); return; }
    if (Input.just('k') && pl.atkCd <= 0 && p.sta >= 8) { p.sta -= 8; pl.atkT = .18; pl.atkCd = .32; pl.regenD = .7; this.atkId++; beep(240, .08, 'sawtooth', .03); }

    // attack hitbox
    if (pl.atkT > 0) {
      const hx = pl.x + pl.fx * 22, hy = pl.y - 6 + pl.fy * 22;
      for (const e of this.enemies.slice()) {
        if (e.last === this.atkId) continue;
        if (Math.abs(e.x - hx) < 18 + e.w / 2 && Math.abs(e.y - hy) < 18 + e.h / 2) {
          e.last = this.atkId; const dmg = Math.max(1, Math.round(st.atk * rnd(.9, 1.25)));
          e.hp -= dmg; e.flash = .12; e.kbT = .15; e.kx = pl.fx * 220; e.ky = pl.fy * 220;
          this.floatText(e.x, e.y - 12, String(dmg), ELEM[p.element].color); this.burst(e.x, e.y, ELEM[p.element].color, 4); beep(320, .05, 'square', .03);
          if (e.hp <= 0) this.killEnemy(e);
        }
      }
    }
    // enemies
    for (const e of this.enemies) {
      e.flash -= dt; const dx = pl.x - e.x, dy = (pl.y - 6) - e.y, d = Math.hypot(dx, dy) || 1; let vx, vy;
      if (d < 260) { vx = dx / d * e.spd; vy = dy / d * e.spd; }
      else { e.wt -= dt; if (e.wt <= 0) { e.wt = rnd(1, 2.5); const a = Math.random() * 6.28; e.dx = Math.cos(a) * e.spd * .4; e.dy = Math.sin(a) * e.spd * .4; } vx = e.dx; vy = e.dy; }
      if (e.kbT > 0) { e.kbT -= dt; vx = e.kx; vy = e.ky; }
      moveBox(e, vx * dt, 0, this.walls, W2, H2); moveBox(e, 0, vy * dt, this.walls, W2, H2);
      if (pl.inv <= 0 && Math.abs(dx) < (e.w + pl.w) / 2 + 2 && Math.abs(dy) < (e.h + pl.h) / 2 + 6) {
        const dmg = Math.max(1, Math.round(e.dmg * (p.element === 'Earth' ? .75 : 1)));
        p.hp -= dmg; pl.inv = .9; this.shake = .2; pl.kbT = .15; pl.kx = -dx / d * 200; pl.ky = -dy / d * 200;
        this.floatText(pl.x, pl.y - 28, '-' + dmg, '#ff6a6a'); beep(110, .15, 'sawtooth', .05);
        if (p.hp <= 0) { p.hp = 0; go(Over); return; }
      }
    }
    // stairs
    if (this.mode === 'floor' && this.cleared) {
      const s = this.stairs; if (pl.x > s.x && pl.x < s.x + s.w && pl.y > s.y && pl.y < s.y + s.h + 20) { this.advance(); return; }
    }
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
    panel(W - 190, 8, 182, 52, '#7ec8ff');
    T(hub ? 'HUB  Floor ' + p.floor : 'Floor ' + p.floor + ' / 100', W - 182, 13, 13, '#fff');
    T(p.inv.shards + ' shards  ' + p.inv.potions + ' potions', W - 182, 31, 11, '#ffd36a', 'left', false);
    if (!hub) T(this.cleared ? 'Reach the stairs' : 'Foes left: ' + this.enemies.length + '/' + this.total, W - 182, 44, 10, this.cleared ? '#7ef0ff' : '#ff9a8a', 'left', false);
    if (this.banner > 0) { ctx.globalAlpha = clamp(this.banner, 0, 1); T(this.bannerText, W / 2, 100, 18, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (toastT > 0) { ctx.globalAlpha = clamp(toastT, 0, 1); panel(W / 2 - 170, 138, 340, 26, '#7ec8ff'); T(toastS, W / 2, 144, 13, '#fff', 'center'); ctx.globalAlpha = 1; }
    if (this.menu) { panel(130, 100, 540, 46, '#ffd36a'); T('Merchant   Shards: ' + p.inv.shards, 150, 114, 15, '#ffd36a'); menuDraw(this.menu); T('K: leave', 150, 330, 12, '#9fc0ff', 'left', false); }
    if (this.paused) { ctx.fillStyle = 'rgba(0,0,10,.6)'; ctx.fillRect(0, 0, W, H); T('PAUSED', W / 2, 90, 28, '#fff', 'center'); menuDraw(this.pm); }
    if (Dlg.active) Dlg.draw();
  },
  drawEnemy(e) {
    const bob = Math.sin(this.t * 6 + e.ph) * 2, f = e.flash > 0;
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y + bob));
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-e.w / 2, e.h / 2 + 2 - bob, e.w, 3);
    if (e.type === 'anomaly') {
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
    if (e.hp < e.max) { bar(e.x - 12, e.y - e.h / 2 - 8, 24, 3, e.hp, e.max, '#ff5a4a'); }
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
  if (scene !== World && toastT > 0) { ctx.globalAlpha = clamp(toastT, 0, 1); panel(W / 2 - 170, H - 100, 340, 26, '#7ec8ff'); T(toastS, W / 2, H - 94, 13, '#fff', 'center'); ctx.globalAlpha = 1; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__astral = { G, get scene() { return scene; } }; // handy for debugging in the console
})();
