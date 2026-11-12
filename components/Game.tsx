"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { profile, sections, type Section } from "@/data/resume";
import Modal from "./Modal";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const W = 320; // logical screen size (scaled up with CSS, pixelated)
const H = 192;
const T = 16; // tile size
const GROUND_Y = 160;

const SPEED = 1.7;
const JUMP = -6.6;
const GRAV = 0.33;

const FIRST_X = 260; // x of first pipe
const SPACING = 300; // distance between pipes
const LEVEL_W = FIRST_X + sections.length * SPACING + 120;

const COIN_POINTS = 100;
const PIPE_POINTS = 1000;

const SKY = "#6ab7ff";
const FONT = '8px "Press Start 2P", ui-monospace, monospace';

/* ------------------------------------------------------------------ */
/*  World layout                                                       */
/* ------------------------------------------------------------------ */

type Solid = { x: number; y: number; w: number; h: number };
type PipeT = Solid & { section: Section };

const PIPES: PipeT[] = sections.map((section, i) => {
  const h = (i % 2 === 0 ? 2 : 3) * T;
  return { x: FIRST_X + i * SPACING, y: GROUND_Y - h, w: 32, h, section };
});

const PLATFORMS: Solid[] = sections.map((_, i) => ({
  x: FIRST_X + i * SPACING - 160,
  y: GROUND_Y - 52,
  w: 48,
  h: T,
}));

const SOLIDS: Solid[] = [
  { x: -100, y: GROUND_Y, w: LEVEL_W + 200, h: H - GROUND_Y },
  ...PIPES,
  ...PLATFORMS,
];

// coins: 3 on every floating platform + a small arc before every pipe
const COINS: Solid[] = [];
sections.forEach((_, i) => {
  const px = FIRST_X + i * SPACING;
  for (let k = 0; k < 3; k++) {
    COINS.push({ x: px - 160 + 4 + k * T, y: GROUND_Y - 52 - 16, w: 8, h: 10 });
  }
  const arc = [-36, -46, -36];
  for (let k = 0; k < 3; k++) {
    COINS.push({ x: px - 84 + 4 + k * T, y: GROUND_Y + arc[k] - 5, w: 8, h: 10 });
  }
});

type World = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  face: 1 | -1;
  onGround: boolean;
  coyote: number;
  anim: number;
  camX: number;
  tick: number;
  started: boolean;
  paused: boolean;
  enter: { pipe: PipeT; t: number } | null;
  standing: PipeT | null;
  visited: Set<string>;
  got: boolean[];
  gemUsed: boolean[];
  bump: number[];
  pops: { x: number; y: number; t: number }[];
  score: number;
  coins: number;
};

function createWorld(): World {
  return {
    x: 40,
    y: GROUND_Y - 16,
    w: 10,
    h: 16,
    vx: 0,
    vy: 0,
    face: 1,
    onGround: true,
    coyote: 0,
    anim: 0,
    camX: 0,
    tick: 0,
    started: false,
    paused: false,
    enter: null,
    standing: null,
    visited: new Set(),
    got: COINS.map(() => false),
    gemUsed: PLATFORMS.map(() => false),
    bump: PLATFORMS.map(() => 0),
    pops: [],
    score: 0,
    coins: 0,
  };
}

const hit = (a: Solid, b: Solid) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mod = (n: number, m: number) => ((n % m) + m) % m;
const pad = (n: number, len: number) => String(n).padStart(len, "0");

/* ------------------------------------------------------------------ */
/*  Sound effects (tiny WebAudio beeps, no audio files)                */
/* ------------------------------------------------------------------ */

let actx: AudioContext | null = null;
let muted = false;

function initAudio() {
  if (actx) return;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AC) actx = new AC();
  actx?.resume().catch(() => {});
}

function beep(from: number, to: number, dur: number, delay = 0, type: OscillatorType = "square") {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const o = actx.createOscillator();
  const v = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  v.gain.setValueAtTime(0.04, t0);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(v).connect(actx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const sfx = {
  coin: () => {
    beep(988, 988, 0.08);
    beep(1319, 1319, 0.18, 0.07);
  },
  jump: () => beep(260, 620, 0.16),
  pipe: () => beep(300, 70, 0.45, 0, "triangle"),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, f, 0.14, i * 0.12));
  },
};

/* ------------------------------------------------------------------ */
/*  Pixel art (original developer character, drawn from strings)       */
/* ------------------------------------------------------------------ */

const PALETTE: Record<string, string> = {
  K: "#1a1a2e", // outline
  B: "#2b6cb0", // cap
  H: "#4a2c17", // hair
  S: "#f2c29b", // skin
  s: "#d9a073", // skin shade
  W: "#ffffff", // glasses glint / hoodie strings
  O: "#f08a24", // hoodie
  o: "#c76a12", // hoodie shade
  P: "#3b3b8f", // pants
  p: "#2a2a6b", // pants shade
  G: "#7a4a22", // shoes
};

const SPR_W = 14;
const SPR_H = 18;

const TOP = [
  "....KKKKKK....",
  "...KBBBBBBK...",
  "..KBBBBBBBBK..",
  "..KBBBBBBBBBBK",
  "..KHHSSSSSSK..",
  ".KHHSKWSKWSSK.",
  ".KHHSSSSSSSsK.",
  "..KSSSSSSSSK..",
  "...KKSSSSKK...",
  "..KOOOOOOOOK..",
  ".KOOOWOOWOOOK.",
  ".KSKOOOOOOKSK.",
  ".KSKOOooOOKSK.",
  "..KKOOOOOOKK..",
];

const IDLE = [
  ...TOP,
  "...KPPPPPPK...",
  "...KPPppPPK...",
  "...KPPK.KPPK..",
  "..KGGGK.KGGGK.",
];

const WALK = [
  ...TOP,
  "...KPPPPPPK...",
  "...KPPppPPK...",
  "..KPPK..KPPK..",
  ".KGGGK..KGGGK.",
];

const JUMPING = [
  ...TOP,
  "...KPPPPPPK...",
  "...KPPppPPK...",
  ".KPPK....KPPK.",
  ".KGGK....KGGK.",
];

function makeSprite(rows: string[]) {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext("2d")!;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = PALETTE[ch];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    })
  );
  return c;
}

/* ------------------------------------------------------------------ */
/*  Drawing helpers                                                    */
/* ------------------------------------------------------------------ */

type Ctx = CanvasRenderingContext2D;

function pixText(g: Ctx, s: string, x: number, y: number, color = "#fff") {
  g.font = FONT;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#000";
  g.fillText(s, Math.round(x) + 1, Math.round(y) + 1);
  g.fillStyle = color;
  g.fillText(s, Math.round(x), Math.round(y));
}

function drawCloud(g: Ctx, x: number, y: number) {
  g.fillStyle = "#fff";
  g.fillRect(x + 8, y, 24, 8);
  g.fillRect(x + 4, y + 4, 32, 4);
  g.fillRect(x, y + 8, 40, 8);
  g.fillStyle = "#d7ebff";
  g.fillRect(x, y + 14, 40, 2);
}

function drawHill(g: Ctx, x: number, w: number, h: number) {
  g.fillStyle = "#3fae4a";
  for (let r = 0; r < h; r += 2) {
    const rw = Math.max(4, Math.round((w * (r + 2)) / h / 2) * 2);
    g.fillRect(Math.round(x + (w - rw) / 2), GROUND_Y - h + r, rw, 2);
  }
  g.fillStyle = "#2e8b3a";
  g.fillRect(Math.round(x + w / 2) - 10, GROUND_Y - Math.round(h * 0.5), 4, 8);
  g.fillRect(Math.round(x + w / 2) + 6, GROUND_Y - Math.round(h * 0.3), 4, 8);
}

function drawBush(g: Ctx, x: number) {
  g.fillStyle = "#1f7a2f";
  g.fillRect(x + 4, GROUND_Y - 14, 24, 14);
  g.fillRect(x, GROUND_Y - 8, 32, 8);
  g.fillStyle = "#4caf50";
  g.fillRect(x + 6, GROUND_Y - 12, 20, 10);
  g.fillRect(x + 2, GROUND_Y - 6, 28, 6);
}

function drawBrick(g: Ctx, x: number, y: number) {
  g.fillStyle = "#c0742b";
  g.fillRect(x, y, T, T);
  // light top edge of each brick row, darker bottom edge
  g.fillStyle = "#e0955a";
  g.fillRect(x, y, T, 1);
  g.fillRect(x, y + 8, T, 1);
  g.fillStyle = "#9a5a1f";
  g.fillRect(x, y + 6, T, 1);
  g.fillRect(x, y + 14, T, 1);
  // mortar
  g.fillStyle = "#4a2208";
  g.fillRect(x, y + 7, T, 1);
  g.fillRect(x, y + 15, T, 1);
  g.fillRect(x + 7, y, 1, 7);
  g.fillRect(x + 3, y + 8, 1, 7);
  g.fillRect(x + 11, y + 8, 1, 7);
}

function drawGroundTile(g: Ctx, x: number) {
  drawBrick(g, x, GROUND_Y);
  g.fillStyle = "#4caf50";
  g.fillRect(x, GROUND_Y, T, 3);
  g.fillStyle = "#2e7d32";
  g.fillRect(x, GROUND_Y + 3, T, 1);
  drawBrick(g, x, GROUND_Y + T);
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.fillRect(x, GROUND_Y + T, T, T);
}

function drawPipe(g: Ctx, p: Solid) {
  const { x, y, w, h } = p;
  // outlines
  g.fillStyle = "#0d3b17";
  g.fillRect(x, y, w, 12);
  g.fillRect(x + 2, y + 12, w - 4, h - 12);
  // rim
  g.fillStyle = "#2e9e3f";
  g.fillRect(x + 1, y + 1, w - 2, 10);
  g.fillStyle = "#7be07f";
  g.fillRect(x + 3, y + 2, 4, 8);
  g.fillStyle = "#c8ffc8";
  g.fillRect(x + 3, y + 2, 2, 8);
  g.fillStyle = "#1b7a2c";
  g.fillRect(x + w - 9, y + 2, 6, 8);
  g.fillStyle = "#0f5a1f";
  g.fillRect(x + 1, y + 9, w - 2, 2);
  // body
  g.fillStyle = "#2e9e3f";
  g.fillRect(x + 3, y + 12, w - 6, h - 12);
  g.fillStyle = "#7be07f";
  g.fillRect(x + 5, y + 12, 4, h - 12);
  g.fillStyle = "#c8ffc8";
  g.fillRect(x + 5, y + 12, 2, h - 12);
  g.fillStyle = "#1b7a2c";
  g.fillRect(x + w - 11, y + 12, 6, h - 12);
  // dithered shadow on the right edge
  g.fillStyle = "#0f5a1f";
  for (let yy = y + 12; yy < y + h; yy += 2) g.fillRect(x + w - 6 + ((yy / 2) % 2), yy, 2, 1);
}

function drawGem(g: Ctx, x: number, y: number, used: boolean) {
  g.fillStyle = "#000";
  g.fillRect(x, y, T, T);
  g.fillStyle = used ? "#6b5a7a" : "#7b4bd6";
  g.fillRect(x + 1, y + 1, T - 2, T - 2);
  g.fillStyle = used ? "#8a7a99" : "#a47cf0";
  g.fillRect(x + 1, y + 1, T - 2, 2);
  g.fillRect(x + 1, y + 1, 2, T - 2);
  g.fillStyle = used ? "#4a3d57" : "#4a2a9a";
  g.fillRect(x + 1, y + T - 3, T - 2, 2);
  g.fillRect(x + T - 3, y + 1, 2, T - 2);
  // corner rivets
  g.fillStyle = used ? "#3a2f45" : "#2a1366";
  g.fillRect(x + 3, y + 3, 1, 1);
  g.fillRect(x + T - 4, y + 3, 1, 1);
  g.fillRect(x + 3, y + T - 4, 1, 1);
  g.fillRect(x + T - 4, y + T - 4, 1, 1);
  if (!used) {
    // gem
    g.fillStyle = "#000";
    g.fillRect(x + 6, y + 3, 4, 1);
    g.fillRect(x + 4, y + 4, 8, 1);
    g.fillRect(x + 3, y + 5, 10, 5);
    g.fillRect(x + 4, y + 10, 8, 1);
    g.fillRect(x + 6, y + 11, 4, 1);
    g.fillStyle = "#5ff0ff";
    g.fillRect(x + 6, y + 4, 4, 1);
    g.fillRect(x + 4, y + 5, 8, 4);
    g.fillRect(x + 5, y + 9, 6, 1);
    g.fillRect(x + 7, y + 10, 2, 1);
    g.fillStyle = "#e8ffff";
    g.fillRect(x + 5, y + 5, 2, 2);
  }
}

function drawArrow(g: Ctx, cx: number, y: number, color: string) {
  g.fillStyle = "#000";
  g.fillRect(cx - 5, y - 1, 10, 3);
  g.fillRect(cx - 3, y + 2, 6, 2);
  g.fillRect(cx - 2, y + 4, 4, 2);
  g.fillStyle = color;
  g.fillRect(cx - 4, y, 8, 2);
  g.fillRect(cx - 2, y + 2, 4, 2);
  g.fillRect(cx - 1, y + 4, 2, 2);
}

function drawCoin(g: Ctx, c: Solid, tick: number) {
  const sw = Math.round(Math.abs(Math.cos(tick / 14)) * 6) + 2; // spinning
  const x = c.x + 4 - Math.floor(sw / 2);
  g.fillStyle = "#000";
  g.fillRect(x - 1, c.y - 1, sw + 2, c.h + 2);
  g.fillStyle = "#ffd84a";
  g.fillRect(x, c.y, sw, c.h);
  g.fillStyle = "#fff2a8";
  g.fillRect(x + 1, c.y + 1, Math.max(1, Math.floor(sw / 3)), c.h - 2);
}

function drawTrophy(g: Ctx, x: number, y: number, shine: boolean) {
  g.fillStyle = "#000";
  g.fillRect(x + 2, y - 1, 12, 13);
  g.fillStyle = "#ffd84a";
  g.fillRect(x + 3, y, 10, 10);
  g.fillRect(x + 5, y + 10, 6, 3);
  g.fillStyle = "#d4a017";
  g.fillRect(x, y + 2, 3, 6);
  g.fillRect(x + 13, y + 2, 3, 6);
  g.fillStyle = "#fff2a8";
  g.fillRect(x + 4, y + 1, 2, 7);
  g.fillStyle = "#b8860b";
  g.fillRect(x + 7, y + 13, 2, 4);
  g.fillRect(x + 3, y + 17, 10, 3);
  if (shine) {
    g.fillStyle = "#fff";
    g.fillRect(x - 4, y - 4, 2, 2);
    g.fillRect(x + 18, y + 1, 2, 2);
    g.fillRect(x + 8, y - 8, 2, 2);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Held = "left" | "right" | "down";
type Active = { section: Section; index: number; first: boolean };

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(createWorld());
  const input = useRef({
    left: false,
    right: false,
    down: false,
    jumpHeld: false,
    jumpQueued: false,
  });

  const [started, setStarted] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [hud, setHud] = useState({ score: 0, coins: 0 });
  const [soundOff, setSoundOff] = useState(false);

  const resetInput = () => {
    const i = input.current;
    i.left = i.right = i.down = i.jumpHeld = i.jumpQueued = false;
  };

  /* ---------------- main loop + keyboard ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    document.fonts?.load(FONT).catch(() => {});

    const sprites = {
      idle: makeSprite(IDLE),
      walk: makeSprite(WALK),
      jump: makeSprite(JUMPING),
    };

    const w = world.current;
    const inp = input.current;
    const totalPipes = PIPES.length;

    const syncHud = () => setHud({ score: w.score, coins: w.coins });

    const openSection = (pipe: PipeT) => {
      w.paused = true;
      resetInput();
      const id = pipe.section.id;
      const first = !w.visited.has(id);
      if (first) {
        w.visited.add(id);
        w.score += PIPE_POINTS;
        syncHud();
        setVisited(Array.from(w.visited));
        if (w.visited.size === totalPipes) setTimeout(sfx.win, 400);
      }
      setActive({ section: pipe.section, index: PIPES.indexOf(pipe), first });
    };

    /* ---------- update (fixed 60fps step) ---------- */
    const update = () => {
      w.tick++;
      if (!w.started || w.paused) return;

      // sinking into a pipe
      if (w.enter) {
        w.enter.t++;
        w.x = w.enter.pipe.x + (w.enter.pipe.w - w.w) / 2;
        w.y += 0.6;
        if (w.enter.t > 30) openSection(w.enter.pipe);
        return;
      }

      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      w.vx = dir * SPEED;
      if (dir) w.face = dir as 1 | -1;

      if (inp.jumpQueued) {
        inp.jumpQueued = false;
        if (w.onGround || w.coyote > 0) {
          w.vy = JUMP;
          w.onGround = false;
          w.coyote = 0;
          sfx.jump();
        }
      }
      if (!inp.jumpHeld && w.vy < -2.5) w.vy *= 0.7; // short hop

      w.vy = Math.min(w.vy + GRAV, 8);

      // horizontal
      w.x += w.vx;
      for (const s of SOLIDS) {
        if (hit(w, s)) {
          if (w.vx > 0) w.x = s.x - w.w;
          else if (w.vx < 0) w.x = s.x + s.w;
        }
      }
      w.x = clamp(w.x, 0, LEVEL_W - w.w);

      // vertical
      w.y += w.vy;
      w.onGround = false;
      for (const s of SOLIDS) {
        if (hit(w, s)) {
          if (w.vy > 0) {
            w.y = s.y - w.h;
            w.onGround = true;
          } else if (w.vy < 0) {
            w.y = s.y + s.h;
            const pi = PLATFORMS.indexOf(s);
            if (pi >= 0) {
              const gx = s.x + T;
              const cx = w.x + w.w / 2;
              if (cx >= gx && cx < gx + T && !w.gemUsed[pi]) {
                w.gemUsed[pi] = true;
                w.bump[pi] = 8;
                w.pops.push({ x: gx + 4, y: s.y - 12, t: 0 });
                w.coins++;
                w.score += COIN_POINTS;
                sfx.coin();
                syncHud();
              }
            }
          }
          w.vy = 0;
        }
      }

      if (w.onGround) w.coyote = 6;
      else if (w.coyote > 0) w.coyote--;

      // coins
      let picked = false;
      for (let i = 0; i < COINS.length; i++) {
        if (!w.got[i] && hit(w, COINS[i])) {
          w.got[i] = true;
          w.coins++;
          w.score += COIN_POINTS;
          picked = true;
        }
      }
      if (picked) {
        sfx.coin();
        syncHud();
      }

      // gem-block bump + coin pop timers
      for (let i = 0; i < w.bump.length; i++) if (w.bump[i] > 0) w.bump[i]--;
      w.pops = w.pops.filter((p) => ++p.t < 28);

      // standing on a pipe?
      w.standing = null;
      if (w.onGround) {
        const cx = w.x + w.w / 2;
        w.standing =
          PIPES.find(
            (p) => Math.abs(w.y + w.h - p.y) < 0.01 && cx > p.x + 4 && cx < p.x + p.w - 4
          ) ?? null;
      }
      if (w.standing && inp.down) {
        w.enter = { pipe: w.standing, t: 0 };
        w.vx = 0;
        w.vy = 0;
        inp.down = false;
        sfx.pipe();
      }

      w.anim += w.onGround && dir ? 0.16 : 0;

      const target = clamp(w.x + w.w / 2 - W / 2, 0, LEVEL_W - W);
      w.camX += (target - w.camX) * 0.12;
    };

    /* ---------- draw ---------- */
    const draw = () => {
      const cam = Math.round(w.camX);
      const allDone = w.visited.size === totalPipes;

      g.fillStyle = SKY;
      g.fillRect(0, 0, W, H);

      // parallax
      const clouds = [
        [40, 28],
        [230, 52],
        [400, 24],
        [560, 56],
      ];
      for (const [cx, cy] of clouds) drawCloud(g, Math.round(mod(cx - cam * 0.4, 640) - 60), cy);

      const hills = [
        [-10, 140, 60],
        [210, 100, 40],
        [400, 170, 72],
      ];
      for (const [hx, hw, hh] of hills) drawHill(g, Math.round(mod(hx - cam * 0.6, 640) - 100), hw, hh);

      g.save();
      g.translate(-cam, 0);

      // ground
      const first = Math.floor(cam / T);
      for (let c = first; c <= first + W / T + 1; c++) drawGroundTile(g, c * T);

      // bushes
      for (let bx = 90; bx < LEVEL_W; bx += 170) drawBush(g, bx);

      // floating bricks
      PLATFORMS.forEach((p, pi) => {
        drawBrick(g, p.x, p.y);
        drawBrick(g, p.x + 2 * T, p.y);
        const off = w.bump[pi] > 0 ? -Math.round(Math.sin((w.bump[pi] / 8) * Math.PI) * 3) : 0;
        drawGem(g, p.x + T, p.y + off, w.gemUsed[pi]);
      });
      for (const pop of w.pops) {
        drawCoin(g, { x: pop.x, y: Math.round(pop.y - pop.t * 1.2), w: 8, h: 10 }, w.tick + pop.t * 3);
      }

      // coins
      for (let i = 0; i < COINS.length; i++) {
        const c = COINS[i];
        if (!w.got[i] && c.x > cam - 16 && c.x < cam + W + 16) drawCoin(g, c, w.tick);
      }

      // goal: trophy + message
      drawTrophy(g, LEVEL_W - 108, GROUND_Y - 20, allDone);
      pixText(
        g,
        allDone ? "ALL CLEAR! LET'S TALK!" : "THANKS FOR VISITING!",
        LEVEL_W - 100,
        GROUND_Y - 30,
        "#ffd84a"
      );

      // player (drawn before pipes so it sinks *into* them)
      const spr =
        !w.onGround && !w.enter
          ? sprites.jump
          : w.onGround && w.vx !== 0 && Math.floor(w.anim) % 2 === 1
            ? sprites.walk
            : sprites.idle;
      const px = Math.round(w.x) - 2;
      const py = Math.round(w.y) + w.h - SPR_H;
      g.save();
      if (w.face < 0) {
        g.translate(px + SPR_W, 0);
        g.scale(-1, 1);
        g.drawImage(spr, 0, py);
      } else {
        g.drawImage(spr, px, py);
      }
      g.restore();

      // pipes + labels
      const bob = Math.round(Math.sin(w.tick / 10) * 2);
      for (const p of PIPES) {
        drawPipe(g, p);
        const done = w.visited.has(p.section.id);
        const color = done ? "#ffd84a" : "#ffffff";
        const cx = p.x + p.w / 2;
        pixText(g, p.section.label, cx, p.y - 20, color);
        drawArrow(g, cx, p.y - 12 + bob, color);
      }

      if (w.standing && !w.enter) {
        pixText(g, "PRESS DOWN", w.x + w.w / 2, w.y - 8, "#7be07f");
      }

      g.restore();
    };

    /* ---------- loop ---------- */
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const loop = (now: number) => {
      acc += Math.min(100, now - last);
      last = now;
      while (acc >= STEP) {
        update();
        acc -= STEP;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* ---------- keyboard ---------- */
    const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];
    const onDown = (e: KeyboardEvent) => {
      if (!w.started || w.paused) return;
      if (GAME_KEYS.includes(e.code)) e.preventDefault();
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          inp.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          inp.right = true;
          break;
        case "ArrowDown":
        case "KeyS":
          inp.down = true;
          break;
        case "ArrowUp":
        case "KeyW":
        case "Space":
          if (!inp.jumpHeld) inp.jumpQueued = true;
          inp.jumpHeld = true;
          break;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          inp.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          inp.right = false;
          break;
        case "ArrowDown":
        case "KeyS":
          inp.down = false;
          break;
        case "ArrowUp":
        case "KeyW":
        case "Space":
          inp.jumpHeld = false;
          break;
      }
    };
    const onBlur = () => resetInput();

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* ---------------- handlers ---------------- */
  const start = () => {
    initAudio();
    world.current.started = true;
    setStarted(true);
  };

  const toggleSound = () => {
    muted = !muted;
    setSoundOff(muted);
  };

  const closeModal = () => {
    const w = world.current;
    if (w.enter) {
      const p = w.enter.pipe;
      w.x = p.x + (p.w - w.w) / 2;
      w.y = p.y - w.h;
      w.vy = 0;
      w.enter = null;
    }
    resetInput();
    w.paused = false;
    setActive(null);
  };

  const hold = (k: Held) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      input.current[k] = true;
    },
    onPointerUp: () => {
      input.current[k] = false;
    },
    onPointerLeave: () => {
      input.current[k] = false;
    },
    onPointerCancel: () => {
      input.current[k] = false;
    },
  });

  const jumpHandlers = {
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      if (!input.current.jumpHeld) input.current.jumpQueued = true;
      input.current.jumpHeld = true;
    },
    onPointerUp: () => {
      input.current.jumpHeld = false;
    },
    onPointerLeave: () => {
      input.current.jumpHeld = false;
    },
    onPointerCancel: () => {
      input.current.jumpHeld = false;
    },
  };

  const total = sections.length;
  const allDone = visited.length === total;

  return (
    <main className="stage">
      <div className="screen">
        <canvas ref={canvasRef} width={W} height={H} aria-label="Interactive portfolio game" />

        <div className="hud">
          <div>
            <div>PLAYER</div>
            <div>{profile.name}</div>
          </div>
          <div className="mid">
            <div>SCORE</div>
            <div className="gold">{pad(hud.score, 6)}</div>
          </div>
          <div className="mid">
            <div>COINS</div>
            <div className="gold">x{pad(hud.coins, 2)}</div>
          </div>
          <div className="right">
            <div>PIPES</div>
            <div className={allDone ? "done" : undefined}>
              {visited.length}/{total}
              {allDone ? " CLEAR!" : ""}
            </div>
          </div>
        </div>

        <div className="help">ARROWS / WASD MOVE - SPACE JUMP - DOWN ENTER PIPE</div>

        <button className="mute" onClick={toggleSound} aria-label="Toggle sound">
          SOUND {soundOff ? "OFF" : "ON"}
        </button>

        {!started && (
          <div className="overlay">
            <div className="player-tag">1 PLAYER</div>
            <h1>{profile.name}</h1>
            <div className="role">{profile.role}</div>
            <p className="tagline">{profile.tagline}</p>
            <div className="keys">
              <div>&larr; &rarr; / A D : MOVE</div>
              <div>SPACE / W : JUMP</div>
              <div>DOWN / S : ENTER PIPE</div>
            </div>
            <button className="btn" onClick={start} autoFocus>
              PRESS START
            </button>
          </div>
        )}
      </div>

      {/* on-screen controls for phones */}
      <div className="touch">
        <div className="group">
          <button className="tbtn" aria-label="Left" {...hold("left")}>
            &#9664;
          </button>
          <button className="tbtn" aria-label="Right" {...hold("right")}>
            &#9654;
          </button>
        </div>
        <div className="group">
          <button className="tbtn" aria-label="Enter pipe" {...hold("down")}>
            &#9660;
          </button>
          <button className="tbtn" aria-label="Jump" {...jumpHandlers}>
            &#9650;
          </button>
        </div>
      </div>

      {active && (
        <Modal
          section={active.section}
          index={active.index}
          total={total}
          first={active.first}
          onClose={closeModal}
        />
      )}
    </main>
  );
}
