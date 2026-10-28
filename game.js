/* =========================================================
   钢铁防线 · TANK BATTLE
   A dependency-free HTML5 Canvas tank defense game.

   Controls: WASD / Arrows to move · Space / J to fire
             P / Esc to pause · M to mute
   ========================================================= */

(() => {
  'use strict';

  // -------------------------------------------------------
  // DOM & canvas
  // -------------------------------------------------------

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const soundToggle = document.getElementById('soundToggle');
  const toast = document.getElementById('toast');
  const toastKicker = document.getElementById('toastKicker');
  const toastTitle = document.getElementById('toastTitle');
  const buffsEl = document.getElementById('buffs');
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');

  const ui = {
    score: document.getElementById('scoreValue'),
    best: document.getElementById('bestValue'),
    stage: document.getElementById('stageValue'),
    stageName: document.getElementById('stageName'),
    enemies: document.getElementById('enemyValue'),
    lives: document.getElementById('lifeValue')
  };

  // -------------------------------------------------------
  // World constants
  // -------------------------------------------------------

  const W = 1280;
  const H = 720;
  const TILE = 40;
  const COLS = W / TILE;
  const ROWS = H / TILE;
  const TANK_SIZE = 34;
  const PLAYER_SPEED = 164;
  const PLAYER_BULLET_SPEED = 660;
  const ENEMY_BULLET_SPEED = 380;
  const FORTRESS_CELLS = [
    [14, 15], [15, 15], [16, 15], [17, 15],
    [14, 16], [17, 16],
    [14, 17], [17, 17]
  ];
  const BASE = { x: 608, y: 640, w: 64, h: 64, cx: 640, cy: 672 };
  const BASE_CELL = { x: 16, y: 16 };
  const SPAWN_POINTS = [
    { x: 140, y: 100 },
    { x: 660, y: 100 },
    { x: 1140, y: 100 }
  ];
  const PLAYER_SPAWN = { x: 180, y: 660 };

  const DIRS = {
    up: { x: 0, y: -1, angle: 0 },
    right: { x: 1, y: 0, angle: Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI },
    left: { x: -1, y: 0, angle: -Math.PI / 2 }
  };

  const TILE_EMPTY = 0;
  const TILE_BRICK = 1;
  const TILE_STEEL = 2;
  const TILE_WATER = 3;
  const TILE_TREE = 4;

  // -------------------------------------------------------
  // Level data
  // -------------------------------------------------------

  const THEMES = [
    {
      name: 'dusk',
      groundA: '#252a2d',
      groundB: '#171b1e',
      groundGlow: 'rgba(214, 146, 66, 0.075)',
      grid: 'rgba(214, 224, 216, 0.043)',
      speck: 'rgba(237, 241, 230, 0.065)',
      accent: '#e7ad5c',
      brickA: '#a9573c',
      brickB: '#813e2d',
      brickMortar: '#35211b',
      brickHi: 'rgba(255, 205, 163, 0.3)',
      steelA: '#77858b',
      steelB: '#343f43',
      steelHi: 'rgba(235, 247, 250, 0.55)',
      waterA: '#113e50',
      waterB: '#092535',
      waterHi: 'rgba(137, 224, 239, 0.32)',
      treeA: '#31563a',
      treeB: '#173326',
      treeC: '#4c744a'
    },
    {
      name: 'industry',
      groundA: '#1c262c',
      groundB: '#10171c',
      groundGlow: 'rgba(94, 202, 213, 0.075)',
      grid: 'rgba(186, 219, 224, 0.046)',
      speck: 'rgba(211, 235, 238, 0.06)',
      accent: '#6cdde8',
      brickA: '#965743',
      brickB: '#703b2f',
      brickMortar: '#2b2220',
      brickHi: 'rgba(255, 201, 166, 0.27)',
      steelA: '#7a8990',
      steelB: '#374449',
      steelHi: 'rgba(236, 251, 255, 0.58)',
      waterA: '#0e4257',
      waterB: '#082633',
      waterHi: 'rgba(129, 231, 246, 0.34)',
      treeA: '#2a5141',
      treeB: '#132e29',
      treeC: '#447259'
    },
    {
      name: 'ash',
      groundA: '#282224',
      groundB: '#171215',
      groundGlow: 'rgba(224, 94, 75, 0.08)',
      grid: 'rgba(230, 200, 193, 0.043)',
      speck: 'rgba(244, 214, 202, 0.06)',
      accent: '#f07862',
      brickA: '#a84b3d',
      brickB: '#7c332c',
      brickMortar: '#321b19',
      brickHi: 'rgba(255, 196, 164, 0.28)',
      steelA: '#707a81',
      steelB: '#333b40',
      steelHi: 'rgba(255, 240, 231, 0.5)',
      waterA: '#23313f',
      waterB: '#111e29',
      waterHi: 'rgba(165, 191, 213, 0.28)',
      treeA: '#3c3d2d',
      treeB: '#25271c',
      treeC: '#5c5e3e'
    }
  ];

  const LEVELS = [
    {
      name: '荒原哨站',
      queue: ['scout', 'scout', 'gunner', 'scout', 'gunner', 'heavy', 'scout', 'gunner'],
      maxActive: 3,
      spawnInterval: 2.4,
      bricks: [
        [3, 3, 2, 2], [7, 3, 2, 1], [4, 7, 2, 2], [9, 6, 2, 2],
        [2, 11, 3, 1], [7, 11, 2, 2], [11, 13, 2, 1]
      ],
      steels: [
        [12, 4, 1, 1], [5, 9, 1, 1], [13, 10, 2, 1], [15, 6, 2, 1]
      ],
      waters: [
        [14, 8, 4, 2]
      ],
      trees: [
        [2, 13, 3, 2], [8, 13, 2, 2], [14, 3, 3, 1]
      ]
    },
    {
      name: '钢铁工厂',
      queue: ['scout', 'gunner', 'scout', 'gunner', 'heavy', 'scout', 'gunner', 'heavy', 'scout', 'gunner'],
      maxActive: 4,
      spawnInterval: 2.2,
      bricks: [
        [3, 3, 2, 2], [8, 3, 2, 2], [2, 6, 2, 1], [6, 7, 2, 3],
        [11, 6, 1, 3], [9, 10, 2, 2], [3, 11, 2, 2], [13, 12, 2, 1],
        [6, 13, 2, 1]
      ],
      steels: [
        [5, 3, 1, 2], [10, 3, 1, 1], [4, 9, 1, 1], [12, 10, 1, 2],
        [15, 8, 2, 1]
      ],
      waters: [
        [2, 13, 3, 1], [7, 14, 2, 1]
      ],
      trees: [
        [6, 11, 2, 2], [11, 12, 2, 2], [14, 4, 4, 1]
      ]
    },
    {
      name: '最终防线',
      queue: ['scout', 'gunner', 'heavy', 'scout', 'gunner', 'heavy', 'gunner', 'scout', 'heavy', 'gunner', 'heavy', 'scout'],
      maxActive: 4,
      spawnInterval: 1.9,
      bricks: [
        [3, 2, 2, 2], [7, 2, 2, 2], [11, 2, 2, 1], [2, 5, 2, 2],
        [6, 5, 2, 2], [10, 5, 2, 2], [3, 8, 2, 2], [7, 8, 2, 2],
        [11, 8, 2, 2], [3, 11, 2, 2], [7, 11, 2, 2], [13, 12, 2, 1],
        [14, 13, 2, 1]
      ],
      steels: [
        [5, 7, 1, 2], [9, 6, 1, 2], [13, 5, 2, 1], [15, 9, 2, 1],
        [4, 10, 1, 2], [10, 13, 1, 2]
      ],
      waters: [
        [2, 14, 3, 1], [14, 10, 4, 1]
      ],
      trees: [
        [6, 14, 3, 2], [14, 3, 4, 1], [1, 8, 2, 2], [9, 14, 2, 1]
      ]
    }
  ];

  const ENEMY_TYPES = {
    scout: {
      hp: 1,
      speed: 116,
      score: 100,
      fireMin: 1.5,
      fireMax: 2.8,
      maxBullets: 1,
      huntChance: 0.32,
      style: 'scout'
    },
    gunner: {
      hp: 2,
      speed: 88,
      score: 200,
      fireMin: 1.08,
      fireMax: 2.05,
      maxBullets: 1,
      huntChance: 0.26,
      style: 'gunner'
    },
    heavy: {
      hp: 3,
      speed: 63,
      score: 350,
      fireMin: 1.6,
      fireMax: 2.5,
      maxBullets: 2,
      huntChance: 0.18,
      style: 'heavy'
    }
  };

  const TANK_STYLES = {
    player: {
      main: '#67ead8',
      dark: '#155f5a',
      deep: '#0b3534',
      light: '#d7fff8',
      track: '#1d282b'
    },
    scout: {
      main: '#e8645e',
      dark: '#75302d',
      deep: '#381918',
      light: '#ffc0b5',
      track: '#2c2222'
    },
    gunner: {
      main: '#e7a145',
      dark: '#774b19',
      deep: '#36250e',
      light: '#ffe1a8',
      track: '#2f2821'
    },
    heavy: {
      main: '#a184ef',
      dark: '#4d3687',
      deep: '#261b45',
      light: '#e6ddff',
      track: '#292534'
    }
  };

  const POWERUP_DEFS = {
    shield: { label: '能量护盾', short: '护盾', color: '#63e9ff' },
    rapid: { label: '高速装填', short: '速射', color: '#f4b75e' },
    life: { label: '备用装甲', short: '装甲 +1', color: '#79efa0' },
    bomb: { label: '轨道轰击', short: '轰击', color: '#ff916f' }
  };

  // -------------------------------------------------------
  // Tiny utilities
  // -------------------------------------------------------

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function rng() {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function tileHash(x, y, salt = 0) {
    let h = Math.imul(x + 0x27d4eb2d, 0x165667b1) ^ Math.imul(y + 0x9e3779b9, 0x85ebca6b) ^ salt;
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
    return ((h >>> 0) % 10000) / 10000;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(x, y, r, rx, ry, rw, rh) {
    const nx = clamp(x, rx, rx + rw);
    const ny = clamp(y, ry, ry + rh);
    const dx = x - nx;
    const dy = y - ny;
    return dx * dx + dy * dy <= r * r;
  }

  function roundedRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function pad(n, width = 2) {
    return String(Math.max(0, n)).padStart(width, '0');
  }

  function starPath(c, cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = rotation + (i * Math.PI) / points;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
  }

  // -------------------------------------------------------
  // Sound engine (all synthesized, no external assets)
  // -------------------------------------------------------

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.muted = false;
      this.lastEnemyShot = 0;
    }

    ensure() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return false;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : 0.46;
          this.master.connect(this.ctx.destination);

          const length = Math.floor(this.ctx.sampleRate * 0.7);
          this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
          const data = this.noiseBuffer.getChannelData(0);
          for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      } catch (err) {
        return false;
      }
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.46, this.ctx.currentTime, 0.015);
      }
    }

    tone(freq, duration, type = 'sine', volume = 0.06, endFreq = 0, delay = 0) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (endFreq > 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + duration);
      }
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    }

    noise(duration = 0.25, volume = 0.12, cutoff = 800, delay = 0) {
      if (!this.ctx || !this.noiseBuffer || this.muted) return;
      const t0 = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.35), t0 + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
      src.stop(t0 + duration + 0.02);
    }

    shoot() {
      this.tone(310, 0.07, 'square', 0.032, 95);
      this.noise(0.045, 0.024, 2400);
    }

    enemyShoot() {
      const now = performance.now();
      if (now - this.lastEnemyShot < 85) return;
      this.lastEnemyShot = now;
      this.tone(150, 0.08, 'sawtooth', 0.022, 70);
    }

    hit() {
      this.tone(820, 0.045, 'square', 0.018, 260);
    }

    brick() {
      this.noise(0.12, 0.055, 1250);
      this.tone(110, 0.06, 'triangle', 0.018, 60);
    }

    explosion(big = false) {
      this.noise(big ? 0.75 : 0.34, big ? 0.24 : 0.12, big ? 700 : 1150);
      this.tone(big ? 82 : 108, big ? 0.48 : 0.2, 'sine', big ? 0.12 : 0.05, 34);
    }

    pickup() {
      this.tone(540, 0.09, 'triangle', 0.04, 760);
      this.tone(760, 0.12, 'triangle', 0.034, 1040, 0.07);
    }

    extraLife() {
      this.tone(520, 0.1, 'square', 0.03, 720);
      this.tone(720, 0.1, 'square', 0.03, 940, 0.09);
      this.tone(940, 0.16, 'square', 0.028, 1240, 0.18);
    }

    levelStart() {
      this.tone(220, 0.13, 'triangle', 0.035, 330);
      this.tone(330, 0.16, 'triangle', 0.03, 495, 0.12);
    }

    levelClear() {
      [392, 523, 659, 784].forEach((f, i) => {
        this.tone(f, 0.16, 'triangle', 0.035, f * 1.01, i * 0.09);
      });
    }

    victory() {
      [392, 523, 659, 784, 1046].forEach((f, i) => {
        this.tone(f, 0.24, 'triangle', 0.04, f * 1.005, i * 0.13);
      });
    }

    gameOver() {
      this.tone(240, 0.38, 'sawtooth', 0.04, 118);
      this.tone(160, 0.55, 'sine', 0.055, 55, 0.16);
      this.noise(0.6, 0.07, 600, 0.08);
    }
  }

  const audio = new SoundEngine();

  // -------------------------------------------------------
  // Persistent settings
  // -------------------------------------------------------

  function readStore(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (err) {
      /* Private browsing can deny storage; the game still works. */
    }
  }

  const BEST_KEY = 'tankBattle.best.v1';
  const MUTE_KEY = 'tankBattle.muted.v1';
  let bestScore = clamp(parseInt(readStore(BEST_KEY, '0'), 10) || 0, 0, 99999999);
  audio.muted = readStore(MUTE_KEY, '0') === '1';

  // -------------------------------------------------------
  // Game state
  // -------------------------------------------------------

  const G = {
    state: 'menu',
    levelIndex: 0,
    score: 0,
    best: bestScore,
    lives: 3,
    nextExtra: 5000,
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    floaters: [],
    powerups: [],
    map: [],
    theme: THEMES[0],
    spawnQueue: [],
    spawnTimer: 0,
    spawnCursor: 0,
    respawnTimer: 0,
    endTimer: 0,
    endReason: '',
    clearPending: false,
    clearTimer: 0,
    dropCounter: 0,
    baseAlive: true,
    shake: 0,
    flash: 0,
    flashColor: '255, 255, 255',
    visualTime: 0,
    won: false,
    enemyShotSoundBudget: 0
  };

  const controls = {
    held: { up: false, right: false, down: false, left: false },
    dirStack: [],
    fire: false,
    touchFire: false
  };

  let groundLayer = null;
  let groundSeed = -1;
  let overlayTimer = 0;
  let hudCache = {};
  let buffCache = '';
  let buffUpdateClock = 0;
  let lastFrame = performance.now();
  let loopStarted = false;

  // -------------------------------------------------------
  // Map generation
  // -------------------------------------------------------

  function paintRect(map, c, r, w, h, type) {
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) {
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
          map[y][x] = type;
        }
      }
    }
  }

  function paintMirrored(map, c, r, w, h, type) {
    paintRect(map, c, r, w, h, type);
    paintRect(map, COLS - c - w, r, w, h, type);
  }

  function clearZone(map, c, r, w, h) {
    paintRect(map, c, r, w, h, TILE_EMPTY);
  }

  function buildMap(levelIndex) {
    const level = LEVELS[levelIndex];
    const map = Array.from({ length: ROWS }, () => Array(COLS).fill(TILE_EMPTY));

    level.bricks.forEach(([c, r, w, h]) => paintMirrored(map, c, r, w, h, TILE_BRICK));
    level.steels.forEach(([c, r, w, h]) => paintMirrored(map, c, r, w, h, TILE_STEEL));
    level.waters.forEach(([c, r, w, h]) => paintMirrored(map, c, r, w, h, TILE_WATER));
    level.trees.forEach(([c, r, w, h]) => paintMirrored(map, c, r, w, h, TILE_TREE));

    // Keep deployment pads and the player's starting pad clear.
    clearZone(map, 2, 0, 3, 3);
    clearZone(map, 15, 0, 2, 3);
    clearZone(map, 27, 0, 3, 3);
    clearZone(map, 2, 15, 5, 3);

    // Clear the base chamber before placing the brick fortress around it.
    clearZone(map, 13, 15, 6, 3);
    FORTRESS_CELLS.forEach(([x, y]) => {
      map[y][x] = TILE_BRICK;
    });

    return map;
  }

  function isSolidTile(type) {
    return type === TILE_BRICK || type === TILE_STEEL || type === TILE_WATER;
  }

  // -------------------------------------------------------
  // Background texture
  // -------------------------------------------------------

  function buildGround(levelIndex) {
    if (groundSeed === levelIndex && groundLayer) return groundLayer;

    const theme = THEMES[levelIndex];
    const layer = document.createElement('canvas');
    layer.width = W;
    layer.height = H;
    const g = layer.getContext('2d');
    const rng = mulberry32(0x51f15e + levelIndex * 991);

    const gradient = g.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, theme.groundA);
    gradient.addColorStop(0.55, theme.groundB);
    gradient.addColorStop(1, theme.groundA);
    g.fillStyle = gradient;
    g.fillRect(0, 0, W, H);

    // Broad pools of light around the play space.
    const glow = g.createRadialGradient(W * 0.5, H * 0.58, 30, W * 0.5, H * 0.58, W * 0.62);
    glow.addColorStop(0, theme.groundGlow);
    glow.addColorStop(0.55, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    // Concrete seams.
    for (let x = 0; x <= W; x += TILE) {
      g.beginPath();
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, H);
      g.strokeStyle = x % (TILE * 5) === 0 ? theme.grid.replace('0.043', '0.085').replace('0.046', '0.09') : theme.grid;
      g.lineWidth = 1;
      g.stroke();
    }
    for (let y = 0; y <= H; y += TILE) {
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(W, y + 0.5);
      g.strokeStyle = y % (TILE * 4) === 0 ? theme.grid.replace('0.043', '0.075').replace('0.046', '0.08') : theme.grid;
      g.lineWidth = 1;
      g.stroke();
    }

    // Long, faint scratches in the concrete.
    for (let i = 0; i < 30; i++) {
      const x = rng() * W;
      const y = rng() * H;
      const len = 16 + rng() * 90;
      const ang = rng() * Math.PI * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      g.strokeStyle = `rgba(230, 240, 234, ${0.018 + rng() * 0.025})`;
      g.lineWidth = 1;
      g.stroke();
    }

    // Dust and small debris.
    for (let i = 0; i < 1900; i++) {
      const x = rng() * W;
      const y = rng() * H;
      const size = rng() < 0.91 ? 1 : 2;
      g.fillStyle = rng() < 0.7 ? theme.speck : `rgba(255,255,255,${0.018 + rng() * 0.03})`;
      g.fillRect(x, y, size, size);
    }

    // Faded parking-bay markings near the base.
    g.save();
    g.translate(BASE.cx, BASE.cy);
    g.strokeStyle = 'rgba(242, 180, 95, 0.09)';
    g.lineWidth = 1;
    g.setLineDash([5, 9]);
    g.beginPath();
    g.arc(0, 0, 112, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(0, 0, 78, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * 86, Math.sin(a) * 86);
      g.lineTo(Math.cos(a) * 102, Math.sin(a) * 102);
      g.stroke();
    }
    g.restore();

    // Vignette baked into the ground so overlays feel grounded.
    const vignette = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = vignette;
    g.fillRect(0, 0, W, H);

    groundLayer = layer;
    groundSeed = levelIndex;
    return layer;
  }

  // -------------------------------------------------------
  // Overlay / status UI
  // -------------------------------------------------------

  function setStatus(text, mode = '') {
    statusText.textContent = text;
    statusPill.className = 'status-pill' + (mode ? ' ' + mode : '');
  }

  function showToast(kicker, title) {
    toastKicker.textContent = kicker;
    toastTitle.textContent = title;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  }

  function updateSoundButton() {
    soundToggle.classList.toggle('is-muted', audio.muted);
    soundToggle.setAttribute('aria-pressed', String(audio.muted));
    soundToggle.setAttribute('aria-label', audio.muted ? '开启声音' : '关闭声音');
    soundToggle.title = audio.muted ? '开启声音 (M)' : '关闭声音 (M)';
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
    writeStore(MUTE_KEY, audio.muted ? '1' : '0');
    updateSoundButton();
  }

  function focusOverlayButton() {
    const btn = overlay.querySelector('.btn');
    if (btn && window.matchMedia('(hover: hover)').matches) {
      requestAnimationFrame(() => btn.focus({ preventScroll: true }));
    }
  }

  function showOverlay(html) {
    clearTimeout(overlayTimer);
    if (overlay.contains(document.activeElement)) document.activeElement.blur();
    overlay.innerHTML = html;
    overlay.classList.remove('is-hidden');
    overlay.setAttribute('aria-hidden', 'false');
    focusOverlayButton();
  }

  function hideOverlay() {
    overlay.classList.add('is-hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (overlay.contains(document.activeElement)) document.activeElement.blur();
    clearTimeout(overlayTimer);
    overlayTimer = window.setTimeout(() => {
      if (overlay.classList.contains('is-hidden')) overlay.innerHTML = '';
    }, 280);
  }

  function menuMarkup() {
    return `
      <div class="overlay-panel menu-panel">
        <div class="menu-copy">
          <p class="eyebrow">OPERATION · LAST LINE</p>
          <h1 class="game-title">
            <span class="cn">钢铁防线</span>
            <span class="en">TANK BATTLE</span>
          </h1>
          <p class="lede">敌军装甲纵队正在突破封锁线。驾驶最后的守卫坦克，穿越废墟与火线，守住基地——三个战区，只有一条退路。</p>
          <div class="menu-actions">
            <button class="btn primary" type="button" data-action="start">
              开始战斗 <span class="btn-arrow">→</span>
            </button>
            <span class="key-hint">按 <kbd>ENTER</kbd><br>部署战车</span>
          </div>
          <div class="quick-rules">
            <div class="rule">
              <span class="rule-icon">↕</span>
              <div><strong>四向机动</strong><span>WASD / 方向键</span></div>
            </div>
            <div class="rule">
              <span class="rule-icon">◎</span>
              <div><strong>精准开火</strong><span>SPACE / J</span></div>
            </div>
            <div class="rule">
              <span class="rule-icon">▲</span>
              <div><strong>守住基地</strong><span>别让核心倒下</span></div>
            </div>
          </div>
        </div>
        <aside class="dossier" aria-label="任务简报">
          <div class="dossier-head"><span>COMMAND / DOSSIER</span><b>LIVE</b></div>
          <div class="radar" aria-hidden="true">
            <span class="radar-blip b1"></span>
            <span class="radar-blip b2"></span>
            <span class="radar-blip b3"></span>
            <span class="radar-center"></span>
          </div>
          <div class="dossier-grid">
            <div class="dossier-stat"><span>SECTORS</span><strong>03</strong></div>
            <div class="dossier-stat"><span>BASE</span><strong>ALPHA-1</strong></div>
            <div class="dossier-stat"><span>THREAT</span><strong>SEVERE</strong></div>
            <div class="dossier-stat"><span>ARMOR</span><strong>× 03</strong></div>
            <div class="dossier-best"><span>最高纪录 / BEST</span><strong>${pad(G.best, 6)}</strong></div>
          </div>
        </aside>
      </div>
    `;
  }

  function showMenu() {
    G.state = 'menu';
    setStatus('待命', '');
    updateSoundButton();
    showOverlay(menuMarkup());
  }

  function levelClearMarkup() {
    const cfg = LEVELS[G.levelIndex];
    return `
      <div class="result-panel">
        <p class="eyebrow">SECTOR CLEARED</p>
        <h2 class="result-title">防线稳固</h2>
        <p class="result-sub">${cfg.name} 的敌军装甲纵队已被肃清。<br>补给已就位，准备进入下一战区。</p>
        <div class="result-stats">
          <div class="result-stat"><span>STAGE</span><strong>${pad(G.levelIndex + 1)}</strong></div>
          <div class="result-stat"><span>SCORE</span><strong>${pad(G.score, 6)}</strong></div>
          <div class="result-stat"><span>BONUS</span><strong>+${pad(G.lastBonus, 3)}</strong></div>
        </div>
        <div class="result-actions">
          <button class="btn primary" type="button" data-action="next">进入下一关 <span class="btn-arrow">→</span></button>
          <span class="key-hint">ENTER</span>
        </div>
        <p class="result-note">剩余装甲 × ${pad(G.lives)} · 最高纪录 ${pad(G.best, 6)}</p>
      </div>
    `;
  }

  function victoryMarkup() {
    return `
      <div class="result-panel victory">
        <p class="eyebrow">ALL SECTORS SECURED</p>
        <h2 class="result-title">全线告捷</h2>
        <p class="result-sub">最后一道防线没有倒下。<br>你守住了基地，也守住了整座城市。</p>
        <div class="result-stats">
          <div class="result-stat"><span>FINAL SCORE</span><strong>${pad(G.score, 6)}</strong></div>
          <div class="result-stat"><span>BEST</span><strong>${pad(G.best, 6)}</strong></div>
          <div class="result-stat"><span>SECTORS</span><strong>03 / 03</strong></div>
        </div>
        <div class="result-actions">
          <button class="btn primary" type="button" data-action="restart">再次挑战 <span class="btn-arrow">↻</span></button>
          <span class="key-hint">ENTER</span>
        </div>
        <p class="result-note">装甲剩余 × ${pad(G.lives)} · 感谢游玩</p>
      </div>
    `;
  }

  function gameOverMarkup() {
    return `
      <div class="result-panel danger">
        <p class="eyebrow">MISSION FAILED</p>
        <h2 class="result-title">防线失守</h2>
        <p class="result-sub">${G.endReason || '基地已被摧毁。'}<br>战场上没有撤退路线，只有下一次反击。</p>
        <div class="result-stats">
          <div class="result-stat"><span>STAGE</span><strong>${pad(G.levelIndex + 1)}</strong></div>
          <div class="result-stat"><span>SCORE</span><strong>${pad(G.score, 6)}</strong></div>
          <div class="result-stat"><span>BEST</span><strong>${pad(G.best, 6)}</strong></div>
        </div>
        <div class="result-actions">
          <button class="btn primary" type="button" data-action="restart">再次出击 <span class="btn-arrow">↻</span></button>
          <span class="key-hint">ENTER</span>
        </div>
        <p class="result-note">最高纪录 ${pad(G.best, 6)} · 调整战术，重新部署</p>
      </div>
    `;
  }

  function pauseMarkup() {
    return `
      <div class="result-panel">
        <p class="eyebrow">TACTICAL HOLD</p>
        <h2 class="result-title">战术暂停</h2>
        <p class="result-sub">战场已冻结。<br>检查装甲状态，再继续推进。</p>
        <div class="result-actions">
          <button class="btn primary" type="button" data-action="resume">继续战斗</button>
          <button class="btn secondary" type="button" data-action="restart">重新部署</button>
        </div>
        <p class="result-note">按 P / ESC 返回战场</p>
      </div>
    `;
  }

  function stageLabel() {
    return `SECTOR ${pad(G.levelIndex + 1)} · ${LEVELS[G.levelIndex].name}`;
  }

  // -------------------------------------------------------
  // HUD
  // -------------------------------------------------------

  function setTextCached(el, key, value) {
    if (hudCache[key] !== value) {
      hudCache[key] = value;
      el.textContent = value;
    }
  }

  function updateHUD(force = false) {
    if (force) hudCache = {};
    setTextCached(ui.score, 'score', pad(G.score, 6));
    setTextCached(ui.best, 'best', pad(G.best, 6));
    setTextCached(ui.stage, 'stage', pad(G.levelIndex + 1));
    setTextCached(ui.stageName, 'stageName', LEVELS[G.levelIndex].name);
    setTextCached(ui.enemies, 'enemies', pad(G.spawnQueue.length + G.enemies.length));
    setTextCached(ui.lives, 'lives', pad(G.lives));
  }

  function updateBuffs(force = false) {
    const p = G.player;
    let html = '';
    if (p && G.state === 'playing') {
      if (p.shieldTime > 0) {
        html += `<span class="buff"><i></i>护盾 ${Math.ceil(p.shieldTime)}s</span>`;
      }
      if (p.rapidTime > 0) {
        html += `<span class="buff rapid"><i></i>速射 ${Math.ceil(p.rapidTime)}s</span>`;
      }
    }
    if (force || html !== buffCache) {
      buffCache = html;
      buffsEl.innerHTML = html;
    }
  }

  // -------------------------------------------------------
  // Player & enemy construction
  // -------------------------------------------------------

  function makePlayer(spawnProtection = 2.4) {
    return {
      x: PLAYER_SPAWN.x,
      y: PLAYER_SPAWN.y,
      size: TANK_SIZE,
      dir: 'up',
      speed: PLAYER_SPEED,
      fireCd: 0,
      invuln: spawnProtection,
      shieldTime: 0,
      rapidTime: 0,
      tread: 0,
      moving: false,
      style: TANK_STYLES.player
    };
  }

  function makeEnemy(type, slot) {
    const cfg = ENEMY_TYPES[type];
    const spawn = SPAWN_POINTS[slot];
    return {
      type,
      x: spawn.x,
      y: spawn.y,
      size: TANK_SIZE,
      dir: 'down',
      speed: cfg.speed,
      hp: cfg.hp,
      maxHp: cfg.hp,
      score: cfg.score,
      fireCd: rand(0.7, 1.6),
      fireMin: cfg.fireMin,
      fireMax: cfg.fireMax,
      maxBullets: cfg.maxBullets,
      spawnTimer: 0.95,
      invuln: 0.35,
      path: [],
      pathTimer: rand(0.1, 0.45),
      holdTimer: 0,
      stuckTimer: 0,
      tread: 0,
      hitFlash: 0,
      mode: Math.random() < cfg.huntChance ? 'hunt' : 'siege',
      style: TANK_STYLES[cfg.style]
    };
  }

  // -------------------------------------------------------
  // Collision helpers
  // -------------------------------------------------------

  function tileAt(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return TILE_STEEL;
    return G.map[ty][tx];
  }

  function tankFits(tank, x, y) {
    const half = tank.size / 2;
    if (x - half < 2 || x + half > W - 2 || y - half < 2 || y + half > H - 2) return false;

    const left = x - half + 1;
    const right = x + half - 1;
    const top = y - half + 1;
    const bottom = y + half - 1;
    const x0 = clamp(Math.floor(left / TILE), 0, COLS - 1);
    const x1 = clamp(Math.floor(right / TILE), 0, COLS - 1);
    const y0 = clamp(Math.floor(top / TILE), 0, ROWS - 1);
    const y1 = clamp(Math.floor(bottom / TILE), 0, ROWS - 1);

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (isSolidTile(G.map[ty][tx])) return false;
      }
    }

    if (G.baseAlive && rectsOverlap(
      { x: left, y: top, w: right - left, h: bottom - top },
      BASE
    )) {
      return false;
    }

    const all = [];
    if (G.player) all.push(G.player);
    for (const enemy of G.enemies) {
      if (enemy.spawnTimer <= 0) all.push(enemy);
    }
    for (const other of all) {
      if (other === tank) continue;
      const oh = other.size / 2 - 1;
      const th = tank.size / 2 - 1;
      if (
        x + th > other.x - oh &&
        x - th < other.x + oh &&
        y + th > other.y - oh &&
        y - th < other.y + oh
      ) {
        return false;
      }
    }

    return true;
  }

  function moveTankBy(tank, dirKey, distance) {
    if (distance <= 0) return false;
    const d = DIRS[dirKey];
    const nx = tank.x + d.x * distance;
    const ny = tank.y + d.y * distance;
    if (!tankFits(tank, nx, ny)) return false;
    tank.x = nx;
    tank.y = ny;
    tank.tread += distance;
    return true;
  }

  function alignPlayerLane(p, dirKey, dt) {
    const d = DIRS[dirKey];
    const rate = 170 * dt;
    if (d.x !== 0) {
      const lane = Math.round((p.y - TILE / 2) / TILE) * TILE + TILE / 2;
      const diff = lane - p.y;
      if (Math.abs(diff) > 0.4 && Math.abs(diff) < TILE * 0.62) {
        const step = Math.sign(diff) * Math.min(Math.abs(diff), rate);
        if (tankFits(p, p.x, p.y + step)) p.y += step;
      }
    } else if (d.y !== 0) {
      const lane = Math.round((p.x - TILE / 2) / TILE) * TILE + TILE / 2;
      const diff = lane - p.x;
      if (Math.abs(diff) > 0.4 && Math.abs(diff) < TILE * 0.62) {
        const step = Math.sign(diff) * Math.min(Math.abs(diff), rate);
        if (tankFits(p, p.x + step, p.y)) p.x += step;
      }
    }
  }

  function cellOfTank(tank) {
    return {
      x: clamp(Math.floor(tank.x / TILE), 0, COLS - 1),
      y: clamp(Math.floor(tank.y / TILE), 0, ROWS - 1)
    };
  }

  function cellTouchesBase(cx, cy) {
    const px = cx * TILE;
    const py = cy * TILE;
    return px < BASE.x + BASE.w && px + TILE > BASE.x && py < BASE.y + BASE.h && py + TILE > BASE.y;
  }

  // -------------------------------------------------------
  // A* pathfinding for enemy armor
  // -------------------------------------------------------

  class MinHeap {
    constructor() {
      this.items = [];
    }

    push(item) {
      const items = this.items;
      items.push(item);
      let i = items.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (items[parent].f <= item.f) break;
        items[i] = items[parent];
        i = parent;
      }
      items[i] = item;
    }

    pop() {
      const items = this.items;
      if (items.length === 0) return null;
      const root = items[0];
      const last = items.pop();
      if (items.length > 0) {
        let i = 0;
        items[0] = last;
        while (true) {
          const left = i * 2 + 1;
          const right = left + 1;
          let smallest = i;
          if (left < items.length && items[left].f < items[smallest].f) smallest = left;
          if (right < items.length && items[right].f < items[smallest].f) smallest = right;
          if (smallest === i) break;
          [items[i], items[smallest]] = [items[smallest], items[i]];
          i = smallest;
        }
      }
      return root;
    }

    get size() {
      return this.items.length;
    }
  }

  function findPath(start, goal, seeker = null) {
    if (start.x === goal.x && start.y === goal.y) return [];
    if (goal.x < 0 || goal.x >= COLS || goal.y < 0 || goal.y >= ROWS) return [];

    const total = COLS * ROWS;
    const startIdx = start.y * COLS + start.x;
    const goalIdx = goal.y * COLS + goal.x;
    const gScore = new Float32Array(total);
    const parent = new Int16Array(total);
    const closed = new Uint8Array(total);
    gScore.fill(Infinity);
    parent.fill(-1);
    gScore[startIdx] = 0;

    const heap = new MinHeap();
    heap.push({ idx: startIdx, x: start.x, y: start.y, f: 0 });

    const occupied = new Set();
    if (seeker) {
      if (G.player) {
        const pc = cellOfTank(G.player);
        occupied.add(pc.y * COLS + pc.x);
      }
      for (const enemy of G.enemies) {
        if (enemy === seeker || enemy.spawnTimer > 0) continue;
        const ec = cellOfTank(enemy);
        occupied.add(ec.y * COLS + ec.x);
      }
    }

    while (heap.size > 0) {
      const node = heap.pop();
      if (!node || closed[node.idx]) continue;
      if (node.idx === goalIdx) {
        const cells = [];
        let cur = goalIdx;
        let guard = 0;
        while (cur !== startIdx && cur >= 0 && guard++ < total) {
          cells.push({ x: cur % COLS, y: Math.floor(cur / COLS) });
          cur = parent[cur];
        }
        return cells.reverse();
      }
      closed[node.idx] = 1;

      const neighbors = [
        { x: node.x + 1, y: node.y },
        { x: node.x - 1, y: node.y },
        { x: node.x, y: node.y + 1 },
        { x: node.x, y: node.y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x < 0 || n.x >= COLS || n.y < 0 || n.y >= ROWS) continue;
        const idx = n.y * COLS + n.x;
        if (closed[idx]) continue;

        const tile = G.map[n.y][n.x];
        let moveCost;
        if (tile === TILE_STEEL || tile === TILE_WATER) continue;
        if (tile === TILE_BRICK) moveCost = 13;
        else moveCost = 1;

        if (occupied.has(idx) && idx !== goalIdx) moveCost += 4;
        if (cellTouchesBase(n.x, n.y)) moveCost += 0.5;

        const tentative = gScore[node.idx] + moveCost;
        if (tentative < gScore[idx]) {
          gScore[idx] = tentative;
          parent[idx] = node.idx;
          const h = Math.abs(n.x - goal.x) + Math.abs(n.y - goal.y);
          heap.push({ idx, x: n.x, y: n.y, f: tentative + h });
        }
      }
    }

    return [];
  }

  // -------------------------------------------------------
  // Firing
  // -------------------------------------------------------

  function bulletCount(ownerKey) {
    let count = 0;
    for (const b of G.bullets) {
      if (!b.dead && b.ownerKey === ownerKey) count++;
    }
    return count;
  }

  function spawnBullet(tank, dirKey, owner, ownerKey, speed, color) {
    const d = DIRS[dirKey];
    const offset = 23;
    const bullet = {
      x: tank.x + d.x * offset,
      y: tank.y + d.y * offset,
      vx: d.x * speed,
      vy: d.y * speed,
      dir: dirKey,
      radius: 4,
      owner,
      ownerKey,
      color,
      life: 1.9,
      dead: false
    };
    G.bullets.push(bullet);
    muzzleFlash(bullet.x, bullet.y, color);
    return bullet;
  }

  function firePlayer() {
    const p = G.player;
    if (!p || G.state !== 'playing') return;
    const maxBullets = p.rapidTime > 0 ? 4 : 2;
    if (p.fireCd > 0 || bulletCount('player') >= maxBullets) return;
    spawnBullet(p, p.dir, 'player', 'player', PLAYER_BULLET_SPEED, '#92fff2');
    p.fireCd = p.rapidTime > 0 ? 0.125 : 0.29;
    G.shake = Math.max(G.shake, 1.6);
    audio.shoot();
  }

  function fireEnemy(enemy, dirKey) {
    if (enemy.spawnTimer > 0) return false;

    const key = enemy.bulletKey || (enemy.bulletKey = 'enemy-' + (++enemySerial));
    if (bulletCount(key) >= enemy.maxBullets) return false;

    let enemyBullets = 0;
    for (const b of G.bullets) {
      if (!b.dead && b.owner === 'enemy') enemyBullets++;
    }
    if (enemyBullets >= 14) return false;

    spawnBullet(enemy, dirKey, 'enemy', key, ENEMY_BULLET_SPEED, '#ffad67');
    enemy.fireCd = rand(enemy.fireMin, enemy.fireMax);
    enemy.holdTimer = Math.max(enemy.holdTimer, 0.16);
    audio.enemyShoot();
    return true;
  }

  let enemySerial = 0;

  // -------------------------------------------------------
  // Effects
  // -------------------------------------------------------

  function addParticle(particle) {
    if (G.particles.length > 560) G.particles.splice(0, G.particles.length - 540);
    G.particles.push(particle);
  }

  function sparkBurst(x, y, color, count = 8, speed = 150) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(speed * 0.35, speed);
      addParticle({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        gravity: 60,
        drag: 0.01,
        size: rand(1, 2.5),
        color,
        life: rand(0.18, 0.44),
        maxLife: 0.44,
        rotation: 0,
        vr: 0,
        growth: 0
      });
    }
  }

  function muzzleFlash(x, y, color) {
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2);
      addParticle({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(a) * rand(30, 90),
        vy: Math.sin(a) * rand(30, 90),
        gravity: 0,
        drag: 0.2,
        size: rand(1, 2),
        color,
        life: rand(0.06, 0.16),
        maxLife: 0.16,
        rotation: 0,
        vr: 0,
        growth: 0
      });
    }
  }

  function dustPuff(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      addParticle({
        kind: 'smoke',
        x: x + rand(-7, 7),
        y: y + rand(-7, 7),
        vx: Math.cos(a) * rand(12, 55),
        vy: Math.sin(a) * rand(12, 55) - 8,
        gravity: -7,
        drag: 0.16,
        size: rand(4, 9),
        color,
        life: rand(0.35, 0.8),
        maxLife: 0.8,
        rotation: rand(0, Math.PI),
        vr: rand(-1, 1),
        growth: rand(5, 12)
      });
    }
  }

  function brickBurst(x, y, theme) {
    for (let i = 0; i < 8; i++) {
      const a = rand(0, Math.PI * 2);
      addParticle({
        kind: 'chunk',
        x: x + rand(-12, 12),
        y: y + rand(-12, 12),
        vx: Math.cos(a) * rand(35, 145),
        vy: Math.sin(a) * rand(35, 120) - 35,
        gravity: 360,
        drag: 0.02,
        size: rand(3, 7),
        color: i % 2 ? theme.brickA : theme.brickB,
        life: rand(0.35, 0.72),
        maxLife: 0.72,
        rotation: rand(0, Math.PI),
        vr: rand(-9, 9),
        growth: 0
      });
    }
    dustPuff(x, y, 'rgba(190, 128, 96, 0.38)', 4);
  }

  function explosion(x, y, scale = 1, color = '#ffb35f') {
    addParticle({
      kind: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      gravity: 0,
      drag: 0,
      size: 6 * scale,
      color,
      life: 0.34 + scale * 0.08,
      maxLife: 0.34 + scale * 0.08,
      rotation: 0,
      vr: 0,
      growth: 180 * scale
    });
    sparkBurst(x, y, color, Math.round(16 * scale), 190 * scale);
    sparkBurst(x, y, '#fff1c6', Math.round(6 * scale), 115 * scale);
    for (let i = 0; i < Math.round(7 * scale); i++) {
      addParticle({
        kind: 'smoke',
        x: x + rand(-9, 9),
        y: y + rand(-9, 9),
        vx: rand(-35, 35),
        vy: rand(-60, -15),
        gravity: -18,
        drag: 0.09,
        size: rand(7, 15) * Math.min(scale, 1.6),
        color: i % 3 === 0 ? 'rgba(255, 168, 93, 0.45)' : 'rgba(47, 49, 47, 0.56)',
        life: rand(0.45, 1.05),
        maxLife: 1.05,
        rotation: rand(0, Math.PI),
        vr: rand(-0.7, 0.7),
        growth: rand(8, 18)
      });
    }
    G.shake = Math.max(G.shake, 5 * scale);
  }

  function addFloater(text, x, y, color = '#f3c77b', size = 13) {
    G.floaters.push({
      text,
      x,
      y,
      color,
      size,
      life: 0.95,
      maxLife: 0.95
    });
  }

  // -------------------------------------------------------
  // Scoring / powerups
  // -------------------------------------------------------

  function addScore(amount, x = null, y = null, showFloater = true) {
    if (amount <= 0) return;
    G.score += amount;
    if (G.score > G.best) G.best = G.score;
    updateHUD();

    if (x !== null && y !== null && showFloater) {
      addFloater('+' + amount, x, y - 12, '#ffd088', 13);
    }

    while (G.score >= G.nextExtra) {
      G.lives++;
      G.nextExtra += 5000;
      audio.extraLife();
      const p = G.player;
      addFloater('装甲 +1', p ? p.x : BASE.cx, p ? p.y - 30 : BASE.cy - 40, '#8fffb0', 14);
      updateHUD();
    }
  }

  function maybeDropPowerup(x, y) {
    G.dropCounter++;
    const guaranteed = G.dropCounter >= 5;
    if (!guaranteed && Math.random() > 0.18) return;
    G.dropCounter = 0;

    const roll = Math.random();
    let type;
    if (roll < 0.3) type = 'shield';
    else if (roll < 0.58) type = 'rapid';
    else if (roll < 0.72) type = 'life';
    else type = 'bomb';

    G.powerups.push({
      type,
      x: clamp(x, 24, W - 24),
      y: clamp(y, 24, H - 24),
      life: 14,
      maxLife: 14,
      phase: rand(0, Math.PI * 2)
    });
  }

  function applyPowerup(powerup) {
    const p = G.player;
    if (!p) return;
    const def = POWERUP_DEFS[powerup.type];
    switch (powerup.type) {
      case 'shield':
        p.shieldTime = Math.max(p.shieldTime, 9);
        break;
      case 'rapid':
        p.rapidTime = Math.max(p.rapidTime, 12);
        break;
      case 'life':
        G.lives++;
        break;
      case 'bomb':
        detonateBomb();
        break;
      default:
        break;
    }
    audio.pickup();
    addFloater(def.short, p.x, p.y - 29, def.color, 14);
    sparkBurst(powerup.x, powerup.y, def.color, 16, 170);
    G.flash = Math.max(G.flash, powerup.type === 'bomb' ? 0.52 : 0.12);
    G.flashColor = powerup.type === 'bomb' ? '255, 214, 154' : '255, 255, 255';
    updateHUD();
    updateBuffs(true);
  }

  function detonateBomb() {
    const targets = G.enemies.filter((e) => e.spawnTimer <= 0);
    for (const enemy of targets) {
      destroyEnemy(enemy, false);
    }
    for (const bullet of G.bullets) {
      if (bullet.owner === 'enemy' && !bullet.dead) {
        bullet.dead = true;
        sparkBurst(bullet.x, bullet.y, '#ffc27a', 3, 90);
      }
    }
    G.shake = Math.max(G.shake, 18);
    G.flash = Math.max(G.flash, 0.55);
    G.flashColor = '255, 231, 184';
    audio.explosion(true);
  }

  // -------------------------------------------------------
  // Player lifecycle
  // -------------------------------------------------------

  function killPlayer() {
    const p = G.player;
    if (!p) return;
    explosion(p.x, p.y, 1.6, '#ffd07a');
    G.shake = Math.max(G.shake, 13);
    G.flash = Math.max(G.flash, 0.22);
    G.flashColor = '255, 176, 128';
    audio.explosion(false);
    G.player = null;
    G.lives--;
    G.respawnTimer = 1.5;
    updateHUD();
    updateBuffs(true);

    if (G.lives <= 0) {
      G.endTimer = 1.25;
      G.endReason = '装甲编队已全部损毁。';
    }
  }

  function respawnPlayer() {
    G.player = makePlayer(2.7);
    G.respawnTimer = 0;
    G.flash = Math.max(G.flash, 0.1);
    updateHUD();
    updateBuffs(true);
  }

  function destroyBase() {
    if (!G.baseAlive) return;
    G.baseAlive = false;
    explosion(BASE.cx, BASE.cy, 2.8, '#ffb45c');
    explosion(BASE.cx - 14, BASE.cy + 8, 1.4, '#ff7a52');
    G.shake = Math.max(G.shake, 25);
    G.flash = Math.max(G.flash, 0.34);
    G.flashColor = '255, 122, 90';
    audio.explosion(true);
    G.endTimer = 1.6;
    G.endReason = '基地核心已被摧毁。';
    updateHUD();
  }

  // -------------------------------------------------------
  // Enemy lifecycle
  // -------------------------------------------------------

  function damageEnemy(enemy, amount = 1) {
    if (enemy.spawnTimer > 0) return;
    enemy.hp -= amount;
    enemy.hitFlash = 0.12;
    if (enemy.hp <= 0) {
      destroyEnemy(enemy, true);
    } else {
      sparkBurst(enemy.x, enemy.y - 2, '#ffe4b3', 7, 150);
      audio.hit();
      G.shake = Math.max(G.shake, 2.2);
    }
  }

  function destroyEnemy(enemy, allowDrop = true) {
    const idx = G.enemies.indexOf(enemy);
    if (idx === -1) return;
    G.enemies.splice(idx, 1);
    explosion(enemy.x, enemy.y, 1.15, '#ffb15f');
    audio.explosion(false);
    addScore(enemy.score, enemy.x, enemy.y, true);
    if (allowDrop) maybeDropPowerup(enemy.x, enemy.y);
    updateHUD();
  }

  function spawnEnemyFromQueue() {
    if (G.spawnQueue.length === 0) return false;
    if (G.enemies.length >= LEVELS[G.levelIndex].maxActive) return false;

    let slot = -1;
    for (let i = 0; i < SPAWN_POINTS.length; i++) {
      const candidate = (G.spawnCursor + i) % SPAWN_POINTS.length;
      const point = SPAWN_POINTS[candidate];
      const occupied = G.enemies.some((e) => Math.hypot(e.x - point.x, e.y - point.y) < 66);
      if (!occupied) {
        slot = candidate;
        break;
      }
    }
    if (slot === -1) return false;

    const type = G.spawnQueue.shift();
    const enemy = makeEnemy(type, slot);
    G.enemies.push(enemy);
    G.spawnCursor = (slot + 1) % SPAWN_POINTS.length;
    updateHUD();
    return true;
  }

  // -------------------------------------------------------
  // Bullet update
  // -------------------------------------------------------

  function checkBulletTileHit(bullet) {
    const r = bullet.radius;
    const x0 = clamp(Math.floor((bullet.x - r) / TILE), 0, COLS - 1);
    const x1 = clamp(Math.floor((bullet.x + r) / TILE), 0, COLS - 1);
    const y0 = clamp(Math.floor((bullet.y - r) / TILE), 0, ROWS - 1);
    const y1 = clamp(Math.floor((bullet.y + r) / TILE), 0, ROWS - 1);

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const tile = G.map[ty][tx];
        if (tile === TILE_BRICK) {
          G.map[ty][tx] = TILE_EMPTY;
          brickBurst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, G.theme);
          sparkBurst(bullet.x, bullet.y, '#ffc895', 5, 90);
          G.shake = Math.max(G.shake, 2.4);
          audio.brick();
          return true;
        }
        if (tile === TILE_STEEL) {
          sparkBurst(bullet.x, bullet.y, '#e8fbff', 7, 110);
          G.shake = Math.max(G.shake, 1.2);
          audio.hit();
          return true;
        }
      }
    }
    return false;
  }

  function checkBulletTankHit(bullet) {
    if (bullet.owner === 'player') {
      for (const enemy of G.enemies) {
        if (enemy.spawnTimer > 0 || bullet.dead) continue;
        if (circleRect(bullet.x, bullet.y, bullet.radius + 1, enemy.x - 17, enemy.y - 17, 34, 34)) {
          damageEnemy(enemy, 1);
          sparkBurst(bullet.x, bullet.y, '#ffd0a0', 5, 100);
          return true;
        }
      }
    } else {
      const p = G.player;
      if (p && circleRect(bullet.x, bullet.y, bullet.radius + 1, p.x - 17, p.y - 17, 34, 34)) {
        if (p.invuln > 0 || p.shieldTime > 0) {
          sparkBurst(bullet.x, bullet.y, '#90fff0', 10, 130);
          audio.hit();
          return true;
        }
        killPlayer();
        return true;
      }
    }
    return false;
  }

  function updateBullets(dt) {
    for (const bullet of G.bullets) {
      if (bullet.dead) continue;
      bullet.life -= dt;
      if (bullet.life <= 0) {
        bullet.dead = true;
        continue;
      }

      const speed = Math.hypot(bullet.vx, bullet.vy);
      const distance = speed * dt;
      const steps = Math.max(1, Math.ceil(distance / 6));
      const stepTime = dt / steps;
      let hit = false;

      for (let step = 0; step < steps; step++) {
        bullet.x += bullet.vx * stepTime;
        bullet.y += bullet.vy * stepTime;

        if (bullet.x < -8 || bullet.x > W + 8 || bullet.y < -8 || bullet.y > H + 8) {
          bullet.dead = true;
          hit = true;
          break;
        }

        if (checkBulletTileHit(bullet)) {
          bullet.dead = true;
          hit = true;
          break;
        }

        if (G.baseAlive && circleRect(bullet.x, bullet.y, bullet.radius, BASE.x, BASE.y, BASE.w, BASE.h)) {
          if (bullet.owner === 'enemy') {
            bullet.dead = true;
            destroyBase();
            hit = true;
            break;
          }
          sparkBurst(bullet.x, bullet.y, '#f3d299', 5, 70);
          bullet.dead = true;
          hit = true;
          break;
        }

        if (checkBulletTankHit(bullet)) {
          bullet.dead = true;
          hit = true;
          break;
        }
      }

      if (hit) continue;
    }

    // Player projectiles can intercept incoming shells.
    for (let i = 0; i < G.bullets.length; i++) {
      const a = G.bullets[i];
      if (a.dead || a.owner !== 'player') continue;
      for (let j = 0; j < G.bullets.length; j++) {
        const b = G.bullets[j];
        if (b.dead || b.owner !== 'enemy') continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < 9) {
          a.dead = true;
          b.dead = true;
          sparkBurst((a.x + b.x) / 2, (a.y + b.y) / 2, '#fff4cc', 8, 120);
          break;
        }
      }
    }

    G.bullets = G.bullets.filter((b) => !b.dead);
  }

  // -------------------------------------------------------
  // Enemy AI
  // -------------------------------------------------------

  function steelBetween(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / 18);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      if (tileAt(x, y) === TILE_STEEL) return true;
    }
    return false;
  }

  function chooseEnemyAim(enemy) {
    const p = G.player;
    if (p) {
      if (Math.abs(enemy.x - p.x) < 22 && Math.abs(enemy.y - p.y) < 560) {
        const dir = p.y < enemy.y ? 'up' : 'down';
        if (!steelBetween(enemy.x, enemy.y, p.x, p.y)) return dir;
      }
      if (Math.abs(enemy.y - p.y) < 22 && Math.abs(enemy.x - p.x) < 560) {
        const dir = p.x < enemy.x ? 'left' : 'right';
        if (!steelBetween(enemy.x, enemy.y, p.x, p.y)) return dir;
      }
    }

    if (G.baseAlive) {
      const bx = BASE.cx;
      const by = BASE.cy;
      const verticalRange = enemy.y < BASE.y - 8 && enemy.y > BASE.y - 470;
      // Only take the shot when the shell's line actually crosses the
      // base, not when the tank is idling a few pixels outside its width.
      if (
        verticalRange &&
        enemy.x > BASE.x + 6 &&
        enemy.x < BASE.x + BASE.w - 6 &&
        !steelBetween(enemy.x, enemy.y, bx, by)
      ) {
        return 'down';
      }
      const horizontalRange =
        enemy.y > BASE.y + 5 &&
        enemy.y < BASE.y + BASE.h - 5 &&
        enemy.x < BASE.x - 6;
      if (horizontalRange && !steelBetween(enemy.x, enemy.y, bx, by)) {
        return 'right';
      }
      if (
        enemy.y > BASE.y + 5 &&
        enemy.y < BASE.y + BASE.h - 5 &&
        enemy.x > BASE.x + BASE.w + 6 &&
        !steelBetween(enemy.x, enemy.y, bx, by)
      ) {
        return 'left';
      }
    }
    return null;
  }

  function fireAtDirection(enemy, dirKey) {
    if (enemy.fireCd > 0) return;
    fireEnemy(enemy, dirKey);
  }

  function updateEnemy(enemy, dt) {
    enemy.fireCd -= dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

    if (enemy.spawnTimer > 0) {
      enemy.spawnTimer -= dt;
      if (enemy.spawnTimer <= 0) {
        enemy.spawnTimer = 0;
        enemy.invuln = 0.3;
        dustPuff(enemy.x, enemy.y + 8, 'rgba(239, 210, 165, 0.3)', 5);
      }
      return;
    }

    enemy.invuln = Math.max(0, enemy.invuln - dt);
    enemy.holdTimer = Math.max(0, enemy.holdTimer - dt);
    enemy.pathTimer -= dt;

    const aim = chooseEnemyAim(enemy);
    if (aim) {
      enemy.dir = aim;
      fireAtDirection(enemy, aim);
      enemy.holdTimer = Math.max(enemy.holdTimer, 0.13);
    }

    const goal = enemy.mode === 'hunt' && G.player
      ? cellOfTank(G.player)
      : BASE_CELL;

    if (enemy.pathTimer <= 0 || enemy.path.length === 0) {
      let path = findPath(cellOfTank(enemy), goal, enemy);
      if (path.length === 0 && (goal.x !== BASE_CELL.x || goal.y !== BASE_CELL.y)) {
        path = findPath(cellOfTank(enemy), BASE_CELL, enemy);
      }
      enemy.path = path;
      enemy.pathTimer = rand(0.72, 1.12);
    }

    if (enemy.holdTimer > 0) return;
    if (enemy.path.length === 0) return;

    let next = enemy.path[0];
    const tile = G.map[next.y][next.x];
    const nextIsBase = cellTouchesBase(next.x, next.y);

    if (tile === TILE_BRICK || nextIsBase) {
      const dir = directionTowardCell(enemy, next);
      if (dir) {
        enemy.dir = dir;
        fireAtDirection(enemy, dir);
        enemy.holdTimer = 0.12;
      }
      return;
    }

    if (tile === TILE_STEEL || tile === TILE_WATER) {
      enemy.path = [];
      enemy.pathTimer = 0;
      return;
    }

    const targetX = next.x * TILE + TILE / 2;
    const targetY = next.y * TILE + TILE / 2;
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;

    if (Math.abs(dx) < 1.2 && Math.abs(dy) < 1.2) {
      enemy.x = targetX;
      enemy.y = targetY;
      enemy.path.shift();
      return;
    }

    let dir;
    if (Math.abs(dx) >= Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';

    enemy.dir = dir;
    const step = enemy.speed * dt;
    const axisDistance = Math.abs(dx) >= Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);
    let moved = moveTankBy(enemy, dir, Math.min(step, Math.max(0.5, axisDistance)));

    if (!moved) {
      // A tank can drift a few pixels off its lane while turning. If the
      // primary axis is blocked, correct the cross-axis first instead of
      // grinding against a corner forever.
      const crossDistance = Math.abs(dx) >= Math.abs(dy) ? dy : dx;
      if (Math.abs(crossDistance) > 0.5) {
        const crossDir = Math.abs(dx) >= Math.abs(dy)
          ? (dy > 0 ? 'down' : 'up')
          : (dx > 0 ? 'right' : 'left');
        moved = moveTankBy(enemy, crossDir, Math.min(step, Math.abs(crossDistance)));
      }
    }

    if (!moved) {
      enemy.stuckTimer += dt;
      if (enemy.stuckTimer > 0.4) {
        enemy.stuckTimer = 0;
        enemy.path = [];
        enemy.pathTimer = rand(0.25, 0.5);
      }
    } else {
      enemy.stuckTimer = 0;
    }
  }

  function directionTowardCell(enemy, cell) {
    const tx = cell.x * TILE + TILE / 2;
    const ty = cell.y * TILE + TILE / 2;
    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    if (Math.abs(dy) > 0.1) return dy > 0 ? 'down' : 'up';
    return null;
  }

  function updateEnemies(dt) {
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const enemy = G.enemies[i];
      if (!enemy) continue;
      updateEnemy(enemy, dt);
    }
  }

  // -------------------------------------------------------
  // Player control update
  // -------------------------------------------------------

  function currentDirection() {
    for (let i = controls.dirStack.length - 1; i >= 0; i--) {
      const dir = controls.dirStack[i];
      if (controls.held[dir]) return dir;
    }
    return null;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.shieldTime = Math.max(0, p.shieldTime - dt);
    p.rapidTime = Math.max(0, p.rapidTime - dt);

    const dir = currentDirection();
    p.moving = false;
    if (dir) {
      p.dir = dir;
      alignPlayerLane(p, dir, dt);
      const step = p.speed * dt;
      p.moving = moveTankBy(p, dir, step);
    }

    if (controls.fire) firePlayer();
  }

  // -------------------------------------------------------
  // Powerups
  // -------------------------------------------------------

  function updatePowerups(dt) {
    const p = G.player;
    for (let i = G.powerups.length - 1; i >= 0; i--) {
      const powerup = G.powerups[i];
      powerup.life -= dt;
      if (powerup.life <= 0) {
        G.powerups.splice(i, 1);
        continue;
      }
      if (p && Math.hypot(p.x - powerup.x, p.y - powerup.y) < 27) {
        G.powerups.splice(i, 1);
        applyPowerup(powerup);
      }
    }
  }

  // -------------------------------------------------------
  // Spawning / respawning / level flow
  // -------------------------------------------------------

  function updateSpawning(dt) {
    if (G.spawnQueue.length === 0 || G.endTimer > 0 || G.clearPending) return;
    if (G.enemies.length >= LEVELS[G.levelIndex].maxActive) return;

    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      if (spawnEnemyFromQueue()) {
        G.spawnTimer = LEVELS[G.levelIndex].spawnInterval * rand(0.9, 1.16);
      } else {
        G.spawnTimer = 0.5;
      }
    }
  }

  function updateRespawn(dt) {
    if (G.player || G.lives <= 0 || G.endTimer > 0) return;
    G.respawnTimer -= dt;
    if (G.respawnTimer <= 0) respawnPlayer();
  }

  function checkLevelCleared(dt) {
    if (G.clearPending) {
      G.clearTimer -= dt;
      if (G.clearTimer <= 0) completeLevel();
      return;
    }
    if (
      G.spawnQueue.length === 0 &&
      G.enemies.length === 0 &&
      G.player &&
      G.baseAlive &&
      G.endTimer <= 0
    ) {
      G.clearPending = true;
      G.clearTimer = 0.9;
      for (const bullet of G.bullets) {
        if (bullet.owner === 'enemy') bullet.dead = true;
      }
      G.bullets = G.bullets.filter((b) => !b.dead);
      setStatus('战区肃清', 'playing');
    }
  }

  function completeLevel() {
    if (G.state !== 'playing') return;
    const bonus = 500 + G.lives * 120 + G.levelIndex * 250;
    G.lastBonus = bonus;
    addScore(bonus, G.player.x, G.player.y - 28, true);
    G.best = Math.max(G.best, G.score);
    writeStore(BEST_KEY, G.best);
    G.clearPending = false;

    if (G.levelIndex >= LEVELS.length - 1) {
      G.state = 'victory';
      G.won = true;
      setStatus('任务完成', '');
      audio.victory();
      showOverlay(victoryMarkup());
    } else {
      G.state = 'levelclear';
      setStatus('战区肃清', '');
      audio.levelClear();
      showOverlay(levelClearMarkup());
    }
    updateHUD(true);
    updateBuffs(true);
  }

  // -------------------------------------------------------
  // State transitions
  // -------------------------------------------------------

  function startGame() {
    audio.ensure();
    G.score = 0;
    G.lives = 3;
    G.nextExtra = 5000;
    G.dropCounter = 0;
    G.won = false;
    G.levelIndex = 0;
    startLevel(0);
  }

  function startLevel(index) {
    G.levelIndex = index;
    G.theme = THEMES[index];
    G.map = buildMap(index);
    groundLayer = buildGround(index);
    G.player = makePlayer(2.5);
    G.enemies = [];
    G.bullets = [];
    G.particles = [];
    G.floaters = [];
    G.powerups = [];
    G.spawnQueue = LEVELS[index].queue.slice();
    G.spawnTimer = 1.15;
    G.spawnCursor = 0;
    G.respawnTimer = 0;
    G.endTimer = 0;
    G.endReason = '';
    G.clearPending = false;
    G.clearTimer = 0;
    G.dropCounter = 0;
    G.baseAlive = true;
    G.shake = 0;
    G.flash = 0;
    G.state = 'playing';
    hudCache = {};

    hideOverlay();
    setStatus('作战中', 'playing');
    updateHUD(true);
    updateBuffs(true);
    showToast(stageLabel(), LEVELS[index].name);
    audio.levelStart();
  }

  function pauseGame() {
    if (G.state !== 'playing') return;
    G.state = 'paused';
    clearControls();
    setStatus('已暂停', 'paused');
    updateBuffs(true);
    showOverlay(pauseMarkup());
  }

  function resumeGame() {
    if (G.state !== 'paused') return;
    G.state = 'playing';
    hideOverlay();
    setStatus('作战中', 'playing');
    lastFrame = performance.now();
    updateBuffs(true);
  }

  function endGame(reason) {
    if (G.state === 'gameover' || G.state === 'victory') return;
    if (reason) G.endReason = reason;
    G.state = 'gameover';
    G.best = Math.max(G.best, G.score);
    writeStore(BEST_KEY, G.best);
    setStatus('防线失守', 'danger');
    updateHUD(true);
    updateBuffs(true);
    audio.gameOver();
    showOverlay(gameOverMarkup());
  }

  function nextLevel() {
    if (G.state !== 'levelclear') return;
    audio.ensure();
    startLevel(G.levelIndex + 1);
  }

  function updateGameplay(dt) {
    if (G.endTimer > 0) {
      G.endTimer -= dt;
      if (G.endTimer <= 0) {
        G.endTimer = 0;
        endGame(G.endReason);
      }
      return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePowerups(dt);
    updateSpawning(dt);
    updateRespawn(dt);
    checkLevelCleared(dt);

    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 42);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
  }

  // -------------------------------------------------------
  // Particles & floaters update
  // -------------------------------------------------------

  function updateEffects(dt) {
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        G.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - Math.min(0.98, p.drag * dt * 60);
      p.vy *= 1 - Math.min(0.98, p.drag * dt * 60);
      p.vy += p.gravity * dt;
      p.rotation += p.vr * dt;
      if (p.kind === 'smoke' || p.kind === 'ring') p.size += p.growth * dt;
    }

    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i];
      f.life -= dt;
      f.y -= dt * 28;
      if (f.life <= 0) G.floaters.splice(i, 1);
    }

    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 42);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
  }

  // -------------------------------------------------------
  // Input
  // -------------------------------------------------------

  const KEY_TO_DIR = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left'
  };

  function pressDirection(dir) {
    if (!controls.held[dir]) {
      controls.held[dir] = true;
      controls.dirStack.push(dir);
    }
  }

  function releaseDirection(dir) {
    controls.held[dir] = false;
    const idx = controls.dirStack.lastIndexOf(dir);
    if (idx !== -1) controls.dirStack.splice(idx, 1);
  }

  function clearControls() {
    for (const dir of Object.keys(controls.held)) controls.held[dir] = false;
    controls.dirStack = [];
    controls.fire = false;
    document.querySelectorAll('.touch-btn.active').forEach((el) => el.classList.remove('active'));
  }

  function onKeyDown(e) {
    const code = e.code;
    const dir = KEY_TO_DIR[code];
    if (dir) {
      if (['playing'].includes(G.state)) {
        e.preventDefault();
        pressDirection(dir);
      }
      return;
    }

    if (code === 'Space' || code === 'KeyJ') {
      if (G.state === 'playing') {
        e.preventDefault();
        controls.fire = true;
      }
      if (G.state === 'menu' && code === 'Space') {
        const focusedButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
        if (!focusedButton) {
          e.preventDefault();
          startGame();
        }
      }
      return;
    }

    if (code === 'Enter') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      if (G.state === 'menu') {
        e.preventDefault();
        startGame();
      } else if (G.state === 'levelclear') {
        e.preventDefault();
        nextLevel();
      } else if (G.state === 'gameover' || G.state === 'victory') {
        e.preventDefault();
        startGame();
      } else if (G.state === 'paused') {
        e.preventDefault();
        resumeGame();
      }
      return;
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (G.state === 'playing') {
        e.preventDefault();
        pauseGame();
      } else if (G.state === 'paused') {
        e.preventDefault();
        resumeGame();
      }
      return;
    }

    if (code === 'KeyM') {
      toggleMute();
    }
  }

  function onKeyUp(e) {
    const dir = KEY_TO_DIR[e.code];
    if (dir) releaseDirection(dir);
    if (e.code === 'Space' || e.code === 'KeyJ') controls.fire = false;
  }

  function setupInput() {
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearControls);

    document.querySelectorAll('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      const activate = (e) => {
        e.preventDefault();
        audio.ensure();
        if (button.setPointerCapture && e.pointerId !== undefined) {
          try { button.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        button.classList.add('active');
        if (control === 'fire') controls.fire = true;
        else if (G.state === 'playing') pressDirection(control);
      };
      const deactivate = () => {
        button.classList.remove('active');
        if (control === 'fire') controls.fire = false;
        else releaseDirection(control);
      };
      button.addEventListener('pointerdown', activate);
      button.addEventListener('pointerup', deactivate);
      button.addEventListener('pointercancel', deactivate);
      button.addEventListener('lostpointercapture', deactivate);
      button.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    overlay.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;
      audio.ensure();
      const action = button.dataset.action;
      if (action === 'start' || action === 'restart') startGame();
      else if (action === 'next') nextLevel();
      else if (action === 'resume') resumeGame();
    });

    soundToggle.addEventListener('click', toggleMute);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.state === 'playing') pauseGame();
    });

    window.addEventListener('beforeunload', () => {
      if (G.best > 0) writeStore(BEST_KEY, G.best);
    });
  }

  // -------------------------------------------------------
  // Rendering helpers
  // -------------------------------------------------------

  function drawBrickTile(tx, ty, theme) {
    const x = tx * TILE;
    const y = ty * TILE;
    const variation = tileHash(tx, ty);
    ctx.save();
    roundedRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 3);
    ctx.clip();
    ctx.fillStyle = theme.brickMortar;
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);

    for (let row = 0; row < 4; row++) {
      const by = y + row * 10 + 1;
      const offset = ((ty * 4 + row) % 2) * 10;
      for (let col = -1; col < 3; col++) {
        const bx = x + col * 20 + offset + 1;
        const shade = tileHash(tx + col * 3, ty + row * 7, 19);
        ctx.fillStyle = shade > 0.62 ? theme.brickA : theme.brickB;
        roundedRect(ctx, bx, by, 17, 8, 1.5);
        ctx.fill();
        ctx.fillStyle = theme.brickHi;
        ctx.fillRect(bx + 2, by + 1, 12, 1);
        if (shade > 0.8) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(bx + 4, by + 5, 8, 2);
        }
      }
    }

    const grime = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
    grime.addColorStop(0, 'rgba(255,255,255,0.03)');
    grime.addColorStop(1, `rgba(0,0,0,${0.08 + variation * 0.06})`);
    ctx.fillStyle = grime;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.restore();

    ctx.strokeStyle = 'rgba(29, 16, 13, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3);
  }

  function drawSteelTile(tx, ty, theme) {
    const x = tx * TILE;
    const y = ty * TILE;
    const variation = tileHash(tx, ty, 7);
    const gradient = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
    gradient.addColorStop(0, theme.steelA);
    gradient.addColorStop(0.55, theme.steelB);
    gradient.addColorStop(1, '#252d30');

    roundedRect(ctx, x + 1.5, y + 1.5, TILE - 3, TILE - 3, 3);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 14, 15, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = theme.steelHi;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 3.5);
    ctx.lineTo(x + TILE - 4, y + 3.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + TILE - 3.5);
    ctx.lineTo(x + TILE - 4, y + TILE - 3.5);
    ctx.stroke();

    const inset = 7;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeRect(x + inset, y + inset, TILE - inset * 2, TILE - inset * 2);
    ctx.strokeStyle = 'rgba(240, 250, 250, 0.08)';
    ctx.strokeRect(x + inset + 1, y + inset + 1, TILE - inset * 2 - 2, TILE - inset * 2 - 2);

    // Rivets
    const points = [
      [x + 5.5, y + 5.5],
      [x + TILE - 5.5, y + 5.5],
      [x + 5.5, y + TILE - 5.5],
      [x + TILE - 5.5, y + TILE - 5.5]
    ];
    for (const [rx, ry] of points) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(224, 240, 242, 0.4)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx + 0.6, ry + 0.7, 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fill();
    }

    if (variation > 0.55) {
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.beginPath();
      ctx.moveTo(x + 11, y + 8);
      ctx.lineTo(x + 26, y + 8);
      ctx.lineTo(x + 13, y + 27);
      ctx.lineTo(x + 8, y + 27);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawWaterTile(tx, ty, theme) {
    const x = tx * TILE;
    const y = ty * TILE;
    const t = G.visualTime;
    const gradient = ctx.createLinearGradient(x, y, x, y + TILE);
    gradient.addColorStop(0, theme.waterA);
    gradient.addColorStop(1, theme.waterB);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, TILE, TILE);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, TILE, TILE);
    ctx.clip();

    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      for (let px = -2; px <= TILE + 2; px += 4) {
        const waveY = y + 10 + row * 11 + Math.sin((x + px) * 0.09 + t * 2.1 + row * 1.4) * 1.8;
        if (px === -2) ctx.moveTo(x + px, waveY);
        else ctx.lineTo(x + px, waveY);
      }
      ctx.strokeStyle = row === 1 ? theme.waterHi : 'rgba(126, 208, 226, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const glint = (Math.sin(t * 1.4 + tx * 0.7 + ty * 1.2) + 1) / 2;
    ctx.fillStyle = `rgba(213, 248, 255, ${0.035 + glint * 0.045})`;
    ctx.fillRect(x + 5 + glint * 18, y + 8, 5, 1.5);
    ctx.restore();

    // Rim only where the pool touches dry ground.
    const neighbors = [
      [tx, ty - 1, 'top'],
      [tx, ty + 1, 'bottom'],
      [tx - 1, ty, 'left'],
      [tx + 1, ty, 'right']
    ];
    ctx.strokeStyle = 'rgba(5, 17, 24, 0.42)';
    ctx.lineWidth = 2;
    for (const [nx, ny, side] of neighbors) {
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || G.map[ny][nx] !== TILE_WATER) {
        ctx.beginPath();
        if (side === 'top') { ctx.moveTo(x, y + 1); ctx.lineTo(x + TILE, y + 1); }
        if (side === 'bottom') { ctx.moveTo(x, y + TILE - 1); ctx.lineTo(x + TILE, y + TILE - 1); }
        if (side === 'left') { ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + TILE); }
        if (side === 'right') { ctx.moveTo(x + TILE - 1, y); ctx.lineTo(x + TILE - 1, y + TILE); }
        ctx.stroke();
      }
    }
  }

  function drawTrees() {
    const theme = G.theme;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        if (G.map[ty][tx] !== TILE_TREE) continue;
        const x = tx * TILE;
        const y = ty * TILE;
        ctx.save();
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 3; i++) {
          const h1 = tileHash(tx, ty, 30 + i);
          const h2 = tileHash(tx, ty, 70 + i);
          const sway = Math.sin(G.visualTime * 0.8 + h1 * 6.28) * 1.3;
          const cx = x + 10 + h1 * 20 + sway;
          const cy = y + 10 + h2 * 20;
          const r = 7 + h1 * 5;
          const fall = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
          fall.addColorStop(0, theme.treeC);
          fall.addColorStop(0.5, theme.treeA);
          fall.addColorStop(1, theme.treeB);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = fall;
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(230, 255, 211, 0.09)';
        for (let i = 0; i < 2; i++) {
          const h = tileHash(tx, ty, 90 + i);
          ctx.beginPath();
          ctx.arc(x + 7 + h * 26, y + 7 + tileHash(tx, ty, 120 + i) * 24, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  function drawBase() {
    const theme = G.theme;
    if (!G.baseAlive) {
      ctx.save();
      ctx.translate(BASE.cx, BASE.cy);
      const crater = ctx.createRadialGradient(0, 0, 3, 0, 0, 44);
      crater.addColorStop(0, 'rgba(4, 5, 6, 0.92)');
      crater.addColorStop(0.55, 'rgba(19, 16, 14, 0.72)');
      crater.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = crater;
      ctx.fillRect(-48, -48, 96, 96);
      ctx.strokeStyle = 'rgba(94, 78, 59, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-27, -19);
      ctx.lineTo(-9, -8);
      ctx.lineTo(-16, 13);
      ctx.lineTo(-3, 7);
      ctx.lineTo(2, 29);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(242, 180, 95, 0.16)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    const pulse = 0.5 + 0.5 * Math.sin(G.visualTime * 2.1);
    ctx.save();
    ctx.translate(BASE.cx, BASE.cy);

    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 52);
    glow.addColorStop(0, `rgba(242, 180, 95, ${0.1 + pulse * 0.06})`);
    glow.addColorStop(0.55, 'rgba(242, 180, 95, 0.035)');
    glow.addColorStop(1, 'rgba(242, 180, 95, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-58, -58, 116, 116);

    // Stone plinth.
    roundedRect(ctx, -31, -30, 62, 62, 6);
    const plinth = ctx.createLinearGradient(-31, -30, 31, 32);
    plinth.addColorStop(0, '#324048');
    plinth.addColorStop(0.5, '#1a252b');
    plinth.addColorStop(1, '#0e161a');
    ctx.fillStyle = plinth;
    ctx.fill();
    ctx.strokeStyle = 'rgba(242, 180, 95, 0.54)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(242, 180, 95, 0.24)';
    ctx.strokeRect(-24, -23, 48, 48);

    // Rivets.
    for (const [rx, ry] of [[-26, -25], [26, -25], [-26, 27], [26, 27]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 213, 146, ${0.4 + pulse * 0.3})`;
      ctx.fill();
    }

    // Shield emblem.
    const shield = ctx.createLinearGradient(0, -26, 0, 25);
    shield.addColorStop(0, '#ffe0a0');
    shield.addColorStop(0.45, '#e8b35f');
    shield.addColorStop(1, '#9d642a');
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.lineTo(18, -22);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 24);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fillStyle = shield;
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 32, 11, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-13, -17);
    ctx.lineTo(13, -17);
    ctx.lineTo(13, -1);
    ctx.lineTo(0, 17);
    ctx.lineTo(-13, -1);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 244, 206, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    starPath(ctx, 0, -3, 9, 3.8, 5, -Math.PI / 2);
    ctx.fillStyle = '#3c2a10';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 244, 206, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Beacon arc.
    ctx.strokeStyle = `rgba(255, 220, 153, ${0.22 + pulse * 0.18})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 39 + pulse * 2, -Math.PI * 0.77, -Math.PI * 0.23);
    ctx.stroke();

    ctx.restore();
  }

  function drawTank(tank, isPlayer = false) {
    const style = tank.style;
    const angle = DIRS[tank.dir].angle;
    const spawnProgress = tank.spawnTimer > 0 ? 1 - tank.spawnTimer / 0.95 : 1;
    const alpha = tank.spawnTimer > 0 ? 0.3 + spawnProgress * 0.5 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(tank.x, tank.y);

    // Ground shadow.
    ctx.beginPath();
    ctx.ellipse(4, 7, 19, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
    ctx.fill();

    if (tank.spawnTimer > 0) {
      const p = clamp(spawnProgress, 0, 1);
      ctx.rotate(G.visualTime * 1.8);
      ctx.strokeStyle = 'rgba(255, 218, 156, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 26 - p * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(22, -5);
        ctx.lineTo(28, -5);
        ctx.lineTo(28, 5);
        ctx.strokeStyle = 'rgba(255, 231, 184, 0.8)';
        ctx.stroke();
      }
      ctx.rotate(-G.visualTime * 1.8);
      ctx.scale(0.55 + p * 0.45, 0.55 + p * 0.45);
    }

    ctx.globalAlpha = tank.spawnTimer > 0 ? 0.55 : alpha;
    ctx.rotate(angle);

    const wobble = tank.moving ? Math.sin(tank.tread * 0.35) * 0.35 : 0;
    ctx.translate(0, wobble);

    // Tracks.
    ctx.fillStyle = style.track;
    roundedRect(ctx, -18, -16, 8, 32, 2.5);
    ctx.fill();
    roundedRect(ctx, 10, -16, 8, 32, 2.5);
    ctx.fill();

    // Track links.
    ctx.strokeStyle = 'rgba(196, 217, 215, 0.12)';
    ctx.lineWidth = 1;
    const offset = tank.tread % 6;
    for (let y = -15; y <= 15; y += 6) {
      const yy = y + offset;
      ctx.beginPath();
      ctx.moveTo(-17, yy);
      ctx.lineTo(-11, yy);
      ctx.moveTo(11, yy);
      ctx.lineTo(17, yy);
      ctx.stroke();
    }

    // Track highlights.
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-17.5, -14, 1, 28);
    ctx.fillRect(16.5, -14, 1, 28);

    // Hull.
    roundedRect(ctx, -12, -15, 24, 30, 4);
    const hull = ctx.createLinearGradient(-12, -15, 12, 15);
    hull.addColorStop(0, style.dark);
    hull.addColorStop(0.48, style.main);
    hull.addColorStop(1, style.deep);
    ctx.fillStyle = hull;
    ctx.fill();
    ctx.strokeStyle = 'rgba(4, 10, 11, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Front glacis.
    ctx.beginPath();
    ctx.moveTo(-10.5, -14);
    ctx.lineTo(10.5, -14);
    ctx.lineTo(8, -7.5);
    ctx.lineTo(-8, -7.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();

    // Rear vents.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-7 + i * 5, 8, 3, 5);
    }

    // Faction stripe.
    ctx.fillStyle = style.light;
    ctx.globalAlpha *= 0.6;
    ctx.fillRect(-10, 4, 20, 1.5);
    ctx.globalAlpha = tank.spawnTimer > 0 ? 0.55 : alpha;

    if (isPlayer) {
      // Antenna.
      ctx.strokeStyle = 'rgba(225, 255, 249, 0.48)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -7);
      ctx.lineTo(-12, -22);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-12, -22, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#f4c477';
      ctx.fill();
    }

    if (tank.type === 'heavy') {
      ctx.fillStyle = 'rgba(255,255,255,0.11)';
      roundedRect(ctx, -14.5, -11, 3.5, 22, 1);
      ctx.fill();
      roundedRect(ctx, 11, -11, 3.5, 22, 1);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, -6);
      ctx.lineTo(7, -6);
      ctx.stroke();
    }

    // Turret ring and turret.
    ctx.beginPath();
    ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(4, 9, 10, 0.48)';
    ctx.fill();

    const turretR = tank.type === 'heavy' ? 9.5 : 8.4;
    ctx.beginPath();
    ctx.arc(0, 0, turretR, 0, Math.PI * 2);
    const turret = ctx.createRadialGradient(-2.5, -3, 1, 0, 0, turretR + 2);
    turret.addColorStop(0, style.light);
    turret.addColorStop(0.34, style.main);
    turret.addColorStop(1, style.dark);
    ctx.fillStyle = turret;
    ctx.fill();
    ctx.strokeStyle = 'rgba(3, 8, 9, 0.64)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Barrel.
    const barrelLen = tank.type === 'heavy' ? 30 : isPlayer ? 31 : 28;
    const barrelW = tank.type === 'heavy' ? 7 : 5.5;
    roundedRect(ctx, -barrelW / 2, -barrelLen, barrelW, barrelLen - 5, 2);
    const barrelGradient = ctx.createLinearGradient(-barrelW / 2, 0, barrelW / 2, 0);
    barrelGradient.addColorStop(0, style.dark);
    barrelGradient.addColorStop(0.5, style.light);
    barrelGradient.addColorStop(1, style.deep);
    ctx.fillStyle = barrelGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(2, 6, 7, 0.72)';
    ctx.lineWidth = 1;
    ctx.stroke();

    roundedRect(ctx, -barrelW / 2 - 1.4, -barrelLen - 1.6, barrelW + 2.8, 4.2, 1.4);
    ctx.fillStyle = style.dark;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();

    // Turret hatch.
    ctx.beginPath();
    ctx.arc(1.5, 1, turretR * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8, 14, 14, 0.28)';
    ctx.fill();

    if (tank.hitFlash > 0) {
      ctx.globalAlpha = Math.min(1, tank.hitFlash * 7) * 0.55;
      roundedRect(ctx, -12, -15, 24, 30, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, turretR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health pips (world space; unaffected by tank rotation).
    if (!isPlayer && tank.maxHp > 1 && tank.spawnTimer <= 0) {
      const width = 24;
      const x = tank.x - width / 2;
      const y = tank.y - 30;
      ctx.save();
      for (let i = 0; i < tank.maxHp; i++) {
        ctx.fillStyle = i < tank.hp ? '#ffd18a' : 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + i * (width / tank.maxHp), y, width / tank.maxHp - 2, 2.5);
      }
      ctx.restore();
    }

    if (isPlayer) {
      const p = tank;
      const shield = p.shieldTime > 0 || p.invuln > 0;
      if (shield) {
        const strong = p.shieldTime > 0;
        const radius = 25 + Math.sin(G.visualTime * 4) * 1.4;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = strong ? 'rgba(107, 239, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = strong ? 1.6 : 1;
        ctx.setLineDash(strong ? [7, 5] : [3, 6]);
        ctx.lineDashOffset = -G.visualTime * 18;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (strong) {
          const glow = ctx.createRadialGradient(0, 0, 12, 0, 0, radius + 5);
          glow.addColorStop(0, 'rgba(99, 233, 255, 0)');
          glow.addColorStop(0.75, 'rgba(99, 233, 255, 0.06)');
          glow.addColorStop(1, 'rgba(99, 233, 255, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (p.rapidTime > 0) {
        ctx.save();
        ctx.translate(p.x, p.y + 22);
        ctx.fillStyle = `rgba(244, 183, 94, ${0.4 + Math.sin(G.visualTime * 7) * 0.12})`;
        ctx.fillRect(-9, 0, 18, 1.5);
        ctx.restore();
      }
    }
  }

  function drawPowerups() {
    for (const powerup of G.powerups) {
      const def = POWERUP_DEFS[powerup.type];
      const bob = Math.sin(G.visualTime * 3.2 + powerup.phase) * 3;
      const pulse = 0.5 + 0.5 * Math.sin(G.visualTime * 4 + powerup.phase);
      if (powerup.life < 3 && Math.floor(powerup.life * 8) % 2 === 0) continue;

      ctx.save();
      ctx.translate(powerup.x, powerup.y + bob);

      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
      glow.addColorStop(0, def.color + '88');
      glow.addColorStop(0.45, def.color + '22');
      glow.addColorStop(1, def.color + '00');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(Math.PI / 4);
      const size = 18 + pulse * 1.6;
      roundedRect(ctx, -size / 2, -size / 2, size, size, 4);
      ctx.fillStyle = 'rgba(6, 18, 22, 0.88)';
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.rotate(-Math.PI / 4);

      ctx.strokeStyle = def.color;
      ctx.fillStyle = def.color;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (powerup.type === 'shield') {
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(8, -5);
        ctx.lineTo(7, 4);
        ctx.lineTo(0, 9);
        ctx.lineTo(-7, 4);
        ctx.lineTo(-8, -5);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(0, 5);
        ctx.stroke();
      } else if (powerup.type === 'rapid') {
        ctx.beginPath();
        ctx.moveTo(1, -9);
        ctx.lineTo(-6, 1);
        ctx.lineTo(0, 1);
        ctx.lineTo(-1, 9);
        ctx.lineTo(6, -2);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();
      } else if (powerup.type === 'life') {
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.moveTo(0, -7);
        ctx.lineTo(0, 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.globalAlpha = 0.3;
        ctx.stroke();
      } else {
        starPath(ctx, 0, 0, 8.5, 4, 6, -Math.PI / 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const bullet of G.bullets) {
      const length = 15;
      const mag = Math.hypot(bullet.vx, bullet.vy) || 1;
      const tx = bullet.x - (bullet.vx / mag) * length;
      const ty = bullet.y - (bullet.vy / mag) * length;

      const trail = ctx.createLinearGradient(tx, ty, bullet.x, bullet.y);
      trail.addColorStop(0, bullet.color + '00');
      trail.addColorStop(1, bullet.color + 'cc');
      ctx.strokeStyle = trail;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();

      ctx.fillStyle = '#fffdf1';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bullet.color;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawParticles() {
    // Smoke and debris sit under the shiny stuff.
    for (const p of G.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === 'smoke') {
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'chunk') {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of G.particles) {
      if (p.kind === 'spark') {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
        ctx.stroke();
      } else if (p.kind === 'ring') {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = alpha * 0.55;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of G.floaters) {
      const alpha = clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${f.size}px "Cascadia Mono", "Consolas", monospace`;
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillText(f.text, f.x + 1.5, f.y + 1.5);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(${G.flashColor}, ${Math.min(0.56, G.flash * 0.65)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawSpawnWarning(enemy) {
    // The ghost is drawn by drawTank; this adds a soft beam beneath it.
    if (enemy.spawnTimer <= 0) return;
    const progress = 1 - enemy.spawnTimer / 0.95;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    glow.addColorStop(0, `rgba(255, 202, 128, ${0.16 + progress * 0.2})`);
    glow.addColorStop(1, 'rgba(255, 202, 128, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function renderTerrain() {
    const theme = G.theme;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const type = G.map[ty][tx];
        if (type === TILE_BRICK) drawBrickTile(tx, ty, theme);
        else if (type === TILE_STEEL) drawSteelTile(tx, ty, theme);
        else if (type === TILE_WATER) drawWaterTile(tx, ty, theme);
      }
    }
  }

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;

    const shake = G.shake;
    ctx.save();
    if (shake > 0.1) {
      ctx.translate(rand(-shake, shake) * 0.7, rand(-shake, shake) * 0.7);
    }

    if (groundLayer) ctx.drawImage(groundLayer, 0, 0);

    renderTerrain();
    drawBase();

    for (const enemy of G.enemies) {
      if (enemy.spawnTimer > 0) drawSpawnWarning(enemy);
    }

    drawPowerups();

    for (const enemy of G.enemies) {
      drawTank(enemy, false);
    }
    if (G.player) drawTank(G.player, true);

    drawBullets();
    drawTrees();
    drawParticles();
    drawFloaters();

    ctx.restore();

    drawFlash();

    // Soft inner border accent; the outer frame is CSS.
    ctx.save();
    ctx.strokeStyle = 'rgba(166, 210, 214, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.restore();
  }

  // -------------------------------------------------------
  // Main loop
  // -------------------------------------------------------

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(W * dpr);
    const targetH = Math.round(H * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;

    if (G.state !== 'paused') {
      G.visualTime += dt;
      if (G.state === 'playing') {
        updateGameplay(dt);
        updateEffects(dt);
      } else if (G.state === 'gameover' || G.state === 'victory' || G.state === 'levelclear') {
        updateEffects(dt);
      } else if (G.state === 'menu') {
        if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 42);
        if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
      }

      if (G.state === 'playing') {
        buffUpdateClock += dt;
        if (buffUpdateClock > 0.2) {
          buffUpdateClock = 0;
          updateBuffs();
        }
        updateHUD();
      }
    }

    render();
    requestAnimationFrame(tick);
  }

  function initialize() {
    resizeCanvas();
    G.map = buildMap(0);
    G.theme = THEMES[0];
    groundLayer = buildGround(0);
    setupInput();
    updateSoundButton();
    updateHUD(true);
    showMenu();
    render();

    window.addEventListener('resize', () => {
      resizeCanvas();
      render();
    });

    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      window.__TANK_DEBUG__ = {
        startGame,
        startLevel,
        pauseGame,
        resumeGame,
        get state() { return G.state; },
        get snapshot() {
          return {
            state: G.state,
            score: G.score,
            lives: G.lives,
            level: G.levelIndex + 1,
            baseAlive: G.baseAlive,
            enemies: G.enemies.length,
            queue: G.spawnQueue.length,
            bullets: G.bullets.length,
            powerups: G.powerups.length,
            player: G.player ? { x: Math.round(G.player.x), y: Math.round(G.player.y), dir: G.player.dir } : null,
            enemyInfo: G.enemies.map((e) => ({
              type: e.type,
              x: Math.round(e.x),
              y: Math.round(e.y),
              hp: e.hp,
              mode: e.mode,
              spawning: e.spawnTimer > 0
            })),
            map: G.map.map((row) => row.join(''))
          };
        },
        clearEnemies() {
          for (const enemy of G.enemies.slice()) destroyEnemy(enemy, false);
        },
        hitBase() { destroyBase(); },
        addLife() { G.lives++; updateHUD(true); },
        winLevel() { G.enemies = []; G.spawnQueue = []; },
        setPlayerPosition(x, y) {
          if (!G.player) return;
          G.player.x = clamp(x, 20, W - 20);
          G.player.y = clamp(y, 20, H - 20);
        }
      };
    }

    if (!loopStarted) {
      loopStarted = true;
      requestAnimationFrame(tick);
    }
  }

  initialize();
})();
