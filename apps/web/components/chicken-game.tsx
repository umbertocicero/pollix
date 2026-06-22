'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Constants ─────────────────────────────────────────────────── */
const GH = 180;       // canvas logical height (px)
const GY = 150;       // ground surface y
const CHK_X = 80;     // chicken feet x (fixed)
const GRAVITY = 1400; // px/s²
const JUMP_VY = -550; // initial jump velocity (px/s, negative = up)
const SPD_INIT = 260; // initial obstacle speed (px/s)
const SPD_MAX  = 600;

// Tight hitbox relative to chicken feet (CHK_X, groundY + jumpOffset)
const HIT_L = -4, HIT_R = 10, HIT_T = -24;

const C = {
  white: '#FFFFFF', light: '#DCDCDC', gray: '#C7C7C7',
  beak: '#F2A93C', beakD: '#C77E2A', red: '#D6352B',
  leg: '#F2C84B', eye: '#161616',
  grass: '#5D8A3A', grassD: '#3A5523',
  dirt: '#6B4226', dirtL: '#9C6B30', dirtD: '#4A2E1A',
  stone: '#7A7A7A', stoneL: '#9A9A9A', stoneD: '#4A4A4A',
};

type GameState = 'idle' | 'playing' | 'dead';
interface Obs { id: number; x: number; w: number; h: number; type: number }

// [width, height above ground] for each obstacle type
const OBS_SIZES: [number, number][] = [
  [24, 28],  // short dirt block
  [24, 52],  // tall stacked blocks
  [48, 28],  // wide low block
  [20, 40],  // narrow stone pillar
];

/* ── Drawing helpers ───────────────────────────────────────────── */
function fr(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawGround(ctx: CanvasRenderingContext2D, gw: number) {
  fr(ctx, C.grass, 0, GY, gw, 4);
  fr(ctx, C.dirt, 0, GY + 4, gw, GH - GY - 4);
  // pixel grass tufts
  for (let i = 2; i < gw; i += 14) {
    fr(ctx, C.grassD, i, GY - 2, 2, 2);
    fr(ctx, C.grassD, i + 6, GY - 3, 2, 3);
  }
}

function drawChicken(ctx: CanvasRenderingContext2D, fx: number, fy: number, legAngle: number) {
  ctx.save();
  ctx.translate(Math.round(fx), Math.round(fy));

  // tail
  fr(ctx, C.gray, -10, -18, 3, 7);
  // body
  fr(ctx, C.white, -9, -16, 17, 9);
  fr(ctx, C.white, -8, -20, 15, 13);
  fr(ctx, C.gray, -7, -10, 13, 3);
  fr(ctx, C.gray, 5, -18, 2, 8);
  // wing
  fr(ctx, C.light, -6, -17, 9, 6);
  fr(ctx, C.gray, -4, -15, 2, 2);
  fr(ctx, C.gray, 0, -14, 2, 2);
  // head
  fr(ctx, C.white, 2, -24, 8, 8);
  fr(ctx, C.white, 3, -26, 6, 2);
  fr(ctx, C.red, 6, -27, 3, 2);    // comb
  fr(ctx, C.eye, 6, -22, 2, 2);    // eye
  fr(ctx, C.beak, 10, -21, 4, 2);
  fr(ctx, C.beakD, 10, -19, 3, 2);
  fr(ctx, C.red, 8, -18, 2, 3);    // wattle

  // legs (rotated around hip)
  const rad = (legAngle * Math.PI) / 180;
  ctx.save();
  ctx.translate(-2, -8);
  ctx.rotate(rad);
  fr(ctx, C.leg, -1, 0, 2, 6);
  fr(ctx, C.leg, -3, 6, 5, 2);
  ctx.restore();

  ctx.save();
  ctx.translate(2, -8);
  ctx.rotate(-rad);
  fr(ctx, C.leg, -1, 0, 2, 6);
  fr(ctx, C.leg, -3, 6, 5, 2);
  ctx.restore();

  ctx.restore();
}

function drawObs(ctx: CanvasRenderingContext2D, obs: Obs) {
  const bsize = 24;
  const by = GY - obs.h;
  const isStone = obs.type === 3;
  const fill  = isStone ? C.stone  : C.dirt;
  const light = isStone ? C.stoneL : C.dirtL;
  const dark  = isStone ? C.stoneD : C.dirtD;

  const cols = Math.ceil(obs.w / bsize);
  const rows = Math.ceil(obs.h / bsize);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = obs.x + c * bsize;
      const y = by + r * bsize;
      const w = Math.min(bsize, obs.w - c * bsize);
      const h = Math.min(bsize, obs.h - r * bsize);
      fr(ctx, fill, x, y, w, h);
      fr(ctx, light, x, y, w, 2);
      fr(ctx, light, x, y, 2, h);
      fr(ctx, dark, x, y + h - 2, w, 2);
      fr(ctx, dark, x + w - 2, y, 2, h);
    }
  }
}

function makeObs(gw: number): Obs {
  const type = Math.floor(Math.random() * OBS_SIZES.length);
  const [w, h] = OBS_SIZES[type];
  return { id: Date.now() + Math.random(), x: gw + 20, w, h, type };
}

/* ── Component ─────────────────────────────────────────────────── */
interface ChickenGameProps {
  label?: string; // e.g. "404" or "500" shown above the game
}

export function ChickenGame({ label }: ChickenGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React state: only for UI overlays (avoids per-frame re-renders)
  const [uiState, setUiState] = useState<GameState>('idle');
  const [finalScore, setFinalScore] = useState(0);
  const [hiScore, setHiScore] = useState(0);

  // Game loop state (all in refs — no React re-renders)
  const stateRef   = useRef<GameState>('idle');
  const rafRef     = useRef(0);
  const lastTsRef  = useRef<number | null>(null);
  const gwRef      = useRef(800);
  const jumpOffRef = useRef(0);    // 0 = on ground; negative = in air
  const jumpVyRef  = useRef(0);
  const onGndRef   = useRef(true);
  const spdRef     = useRef(SPD_INIT);
  const obsRef     = useRef<Obs[]>([]);
  const nextObsRef = useRef(1.8);
  const scoreRef   = useRef(0);
  const legRef     = useRef(0);    // leg rotation angle (degrees)
  const legDirRef  = useRef(1);
  const hiRef      = useRef(0);

  const die = useCallback(() => {
    stateRef.current = 'dead';
    const s = Math.floor(scoreRef.current);
    if (s > hiRef.current) hiRef.current = s;
    setFinalScore(s);
    setHiScore(hiRef.current);
    setUiState('dead');
  }, []);

  const startGame = useCallback(() => {
    jumpOffRef.current = 0;
    jumpVyRef.current  = 0;
    onGndRef.current   = true;
    spdRef.current     = SPD_INIT;
    obsRef.current     = [];
    nextObsRef.current = 1.8;
    scoreRef.current   = 0;
    lastTsRef.current  = null;
    stateRef.current   = 'playing';
    setUiState('playing');
    setFinalScore(0);
  }, []);

  const handleInput = useCallback(() => {
    const s = stateRef.current;
    if (s === 'idle' || s === 'dead') {
      startGame();
    } else if (s === 'playing' && onGndRef.current) {
      jumpVyRef.current = JUMP_VY;
      onGndRef.current  = false;
    }
  }, [startGame]);

  // Keyboard: space / arrow-up
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleInput]);

  // Canvas setup + game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = container.clientWidth;
      gwRef.current = w;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(GH * dpr);
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${GH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const dieRef = { current: die };
    dieRef.current = die;

    const loop = (ts: number) => {
      const dt = lastTsRef.current != null
        ? Math.min((ts - lastTsRef.current) / 1000, 0.05)
        : 0;
      lastTsRef.current = ts;

      const gw = gwRef.current;
      const state = stateRef.current;

      ctx.clearRect(0, 0, gw, GH);
      drawGround(ctx, gw);

      if (state === 'playing') {
        // ── physics ───────────────────────────────
        if (!onGndRef.current) {
          jumpVyRef.current  += GRAVITY * dt;
          jumpOffRef.current += jumpVyRef.current * dt;
          if (jumpOffRef.current >= 0) {
            jumpOffRef.current = 0;
            jumpVyRef.current  = 0;
            onGndRef.current   = true;
          }
        }

        // ── leg animation ─────────────────────────
        legRef.current += legDirRef.current * 330 * dt;
        if (Math.abs(legRef.current) > 11) legDirRef.current *= -1;

        // ── obstacles ─────────────────────────────
        nextObsRef.current -= dt;
        if (nextObsRef.current <= 0) {
          obsRef.current.push(makeObs(gw));
          const minGap = Math.max(0.9, 1.8 - scoreRef.current * 0.003);
          nextObsRef.current = minGap + Math.random() * 1.2;
        }
        const spd = spdRef.current;
        obsRef.current = obsRef.current
          .map(o => ({ ...o, x: o.x - spd * dt }))
          .filter(o => o.x + o.w > -10);

        // ── score & speed ─────────────────────────
        scoreRef.current += dt * 8;
        spdRef.current = Math.min(SPD_MAX, SPD_INIT + scoreRef.current * 0.9);

        // ── collision ─────────────────────────────
        const fy = GY + jumpOffRef.current;
        const cl = CHK_X + HIT_L, cr = CHK_X + HIT_R;
        const ct = fy + HIT_T,    cb = fy;
        for (const obs of obsRef.current) {
          if (cr > obs.x && cl < obs.x + obs.w && cb > GY - obs.h && ct < GY) {
            dieRef.current();
            break;
          }
        }
      } else {
        // idle / dead: keep legs breathing slowly
        legRef.current += legDirRef.current * 120 * dt;
        if (Math.abs(legRef.current) > 11) legDirRef.current *= -1;
      }

      // ── draw obstacles ────────────────────────
      for (const obs of obsRef.current) drawObs(ctx, obs);

      // ── draw chicken ──────────────────────────
      drawChicken(ctx, CHK_X, GY + jumpOffRef.current, legRef.current);

      // ── score display ─────────────────────────
      if (state !== 'idle') {
        ctx.font = 'bold 15px "VT323", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FCEE4B';
        ctx.fillText(String(Math.floor(scoreRef.current)), gw - 8, 20);
        if (hiRef.current > 0) {
          ctx.fillStyle = '#9A9A9A';
          ctx.fillText(`HI ${hiRef.current}`, gw - 8, 36);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [die]);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden mc-panel select-none"
      style={{ height: GH }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleInput}
        onTouchStart={e => { e.preventDefault(); handleInput(); }}
        className="block cursor-pointer"
        style={{ imageRendering: 'pixelated', touchAction: 'none' }}
      />

      {/* ── idle overlay ─────────────────────── */}
      {uiState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          {label && (
            <span className="font-press text-white drop-shadow" style={{ fontSize: 28 }}>
              {label}
            </span>
          )}
          <span className="font-press text-yellow-300 text-xs animate-pulse drop-shadow">
            TAP / SPACE TO PLAY
          </span>
        </div>
      )}

      {/* ── dead overlay ──────────────────────── */}
      {uiState === 'dead' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <span className="font-press text-white text-sm drop-shadow">GAME OVER</span>
          <span className="font-press text-yellow-400 text-xs">SCORE {finalScore}</span>
          {hiScore > 0 && (
            <span className="font-press text-gray-300 text-xs">BEST {hiScore}</span>
          )}
          <span className="font-press text-gray-200 text-xs mt-2 animate-pulse">
            TAP / SPACE TO RETRY
          </span>
        </div>
      )}
    </div>
  );
}
