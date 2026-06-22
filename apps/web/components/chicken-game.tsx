'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Constants ────────────────────────────────────────────────────── */
const GH = 300;
const GY = 240;
const CHK_X = 100;
const CHK_SCALE = 1.8;
const GRAVITY = 1400;
const JUMP_VY = -600;
const SPD_INIT = 220;
const SPD_MAX  = 500;
const CLOUD_SPD = 40;

// Hitbox scaled ×1.8 from original (−4, 10, −24)
const HIT_L = -7, HIT_R = 18, HIT_T = -43;

/* ── Colors ───────────────────────────────────────────────────────── */
const C = {
  white: '#FFFFFF', light: '#DCDCDC', gray: '#C7C7C7',
  beak: '#F2A93C', beakD: '#C77E2A', red: '#D6352B',
  leg: '#F2C84B', eye: '#161616',
  grass: '#5D8A3A', grassD: '#3A5523',
  dirt: '#6B4226', dirtL: '#9C6B30', dirtD: '#4A2E1A',
  stone: '#7A7A7A', stoneL: '#9A9A9A', stoneD: '#4A4A4A',
};

/* ── Obstacle block size & types [w, h above ground] ─────────────── */
const OBS_BLOCK = 36;
const OBS_SIZES: [number, number][] = [[36, 42], [36, 78], [72, 42], [30, 60]];

type GameState = 'idle' | 'playing' | 'dead';
interface Obs { id: number; x: number; w: number; h: number; type: number; passed: boolean }
interface CloudDef { x: number; y: number; w: number }

/* ── Drawing helpers ──────────────────────────────────────────────── */
function fr(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function hillFarY(x: number): number {
  return 58 + 28 * Math.sin(x * 0.013) + 12 * Math.sin(x * 0.027);
}

function hillMidY(x: number): number {
  return 36 + 22 * Math.sin(x * 0.021) + 9 * Math.sin(x * 0.044);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, baseY: number) {
  fr(ctx, '#5A3618', x - 2, baseY - 7,  4,  7);
  fr(ctx, '#2A5A14', x - 9, baseY - 18, 18, 8);
  fr(ctx, '#3A7A1E', x - 7, baseY - 20, 14, 4);
  fr(ctx, '#2A5A14', x - 6, baseY - 28, 12, 8);
  fr(ctx, '#3A7A1E', x - 4, baseY - 30,  8, 4);
  fr(ctx, '#2A5A14', x - 3, baseY - 38,  6, 8);
  fr(ctx, '#4A9A28', x - 1, baseY - 40,  2, 4);
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  fr(ctx, '#C8DFF0', cx,       cy + 8,  w,               6);
  fr(ctx, '#DEF0FA', cx,       cy,      w,               14);
  fr(ctx, '#EEF8FF', cx + 6,   cy - 6,  Math.max(4, w - 12), 8);
  fr(ctx, '#FFFFFF', cx + 10,  cy - 10, Math.max(4, w - 20), 6);
}

function drawBackground(ctx: CanvasRenderingContext2D, gw: number, clouds: CloudDef[]) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GY);
  grad.addColorStop(0, '#3D8FD6');
  grad.addColorStop(1, '#B3DDF5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, gw, GY);

  // Far hills (blue-gray)
  ctx.fillStyle = '#7A9BB5';
  ctx.beginPath();
  ctx.moveTo(-1, GY + 1);
  for (let x = 0; x <= gw + 4; x += 4) ctx.lineTo(x, GY - hillFarY(x));
  ctx.lineTo(gw + 1, GY + 1);
  ctx.closePath();
  ctx.fill();

  // Clouds (between hill layers for depth)
  for (const c of clouds) {
    if (c.x + c.w > 0 && c.x < gw) drawCloud(ctx, c.x, c.y, c.w);
  }

  // Mid hills (dark green)
  ctx.fillStyle = '#3A5E23';
  ctx.beginPath();
  ctx.moveTo(-1, GY + 1);
  for (let x = 0; x <= gw + 4; x += 4) ctx.lineTo(x, GY - hillMidY(x));
  ctx.lineTo(gw + 1, GY + 1);
  ctx.closePath();
  ctx.fill();

  // Pixel-art trees on mid hills (two interleaved rows)
  for (let tx = 30; tx < gw + 20; tx += 70) {
    drawTree(ctx, Math.round(tx), Math.round(GY - hillMidY(tx)));
  }
  for (let tx = 65; tx < gw + 20; tx += 70) {
    drawTree(ctx, Math.round(tx), Math.round(GY - hillMidY(tx)));
  }
}

function drawGround(ctx: CanvasRenderingContext2D, gw: number) {
  fr(ctx, C.grass,  0, GY,     gw, 5);
  fr(ctx, C.dirt,   0, GY + 5, gw, GH - GY - 5);
  for (let i = 2; i < gw; i += 18) {
    fr(ctx, C.grassD, i,     GY - 2, 3, 2);
    fr(ctx, C.grassD, i + 8, GY - 3, 3, 3);
  }
}

function drawChicken(ctx: CanvasRenderingContext2D, fx: number, fy: number, legAngle: number) {
  ctx.save();
  ctx.translate(Math.round(fx), Math.round(fy));
  ctx.scale(CHK_SCALE, CHK_SCALE);

  fr(ctx, C.gray,  -10, -18,  3, 7);   // tail
  fr(ctx, C.white,  -9, -16, 17, 9);   // body
  fr(ctx, C.white,  -8, -20, 15, 13);
  fr(ctx, C.gray,   -7, -10, 13, 3);
  fr(ctx, C.gray,    5, -18,  2, 8);
  fr(ctx, C.light,  -6, -17,  9, 6);   // wing
  fr(ctx, C.gray,   -4, -15,  2, 2);
  fr(ctx, C.gray,    0, -14,  2, 2);
  fr(ctx, C.white,   2, -24,  8, 8);   // head
  fr(ctx, C.white,   3, -26,  6, 2);
  fr(ctx, C.red,     6, -27,  3, 2);   // comb
  fr(ctx, C.eye,     6, -22,  2, 2);   // eye
  fr(ctx, C.beak,   10, -21,  4, 2);
  fr(ctx, C.beakD,  10, -19,  3, 2);
  fr(ctx, C.red,     8, -18,  2, 3);   // wattle

  const rad = (legAngle * Math.PI) / 180;
  ctx.save(); ctx.translate(-2, -8); ctx.rotate(rad);
  fr(ctx, C.leg, -1, 0, 2, 6); fr(ctx, C.leg, -3, 6, 5, 2);
  ctx.restore();
  ctx.save(); ctx.translate(2, -8); ctx.rotate(-rad);
  fr(ctx, C.leg, -1, 0, 2, 6); fr(ctx, C.leg, -3, 6, 5, 2);
  ctx.restore();

  ctx.restore();
}

function drawObs(ctx: CanvasRenderingContext2D, obs: Obs) {
  const by = GY - obs.h;
  const isStone = obs.type === 3;
  const fill  = isStone ? C.stone  : C.dirt;
  const light = isStone ? C.stoneL : C.dirtL;
  const dark  = isStone ? C.stoneD : C.dirtD;
  const cols = Math.ceil(obs.w / OBS_BLOCK);
  const rows = Math.ceil(obs.h / OBS_BLOCK);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = obs.x + c * OBS_BLOCK;
      const y = by  + r * OBS_BLOCK;
      const w = Math.min(OBS_BLOCK, obs.w - c * OBS_BLOCK);
      const h = Math.min(OBS_BLOCK, obs.h - r * OBS_BLOCK);
      fr(ctx, fill,  x, y, w, h);
      fr(ctx, light, x, y, w, 3);
      fr(ctx, light, x, y, 3, h);
      fr(ctx, dark,  x, y + h - 3, w, 3);
      fr(ctx, dark,  x + w - 3, y, 3, h);
    }
  }
}

function makeObs(gw: number): Obs {
  const type = Math.floor(Math.random() * OBS_SIZES.length);
  const [w, h] = OBS_SIZES[type];
  return { id: Date.now() + Math.random(), x: gw + 20, w, h, type, passed: false };
}

/* ── Component ────────────────────────────────────────────────────── */
export function ChickenGame({ label }: { label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  const [uiState,    setUiState]    = useState<GameState>('idle');
  const [finalScore, setFinalScore] = useState(0);
  const [hiScore,    setHiScore]    = useState(0);

  const stateRef   = useRef<GameState>('idle');
  const rafRef     = useRef(0);
  const lastTsRef  = useRef<number | null>(null);
  const gwRef      = useRef(800);
  const jumpOffRef = useRef(0);
  const jumpVyRef  = useRef(0);
  const onGndRef   = useRef(true);
  const spdRef     = useRef(SPD_INIT);
  const obsRef     = useRef<Obs[]>([]);
  const nextObsRef = useRef(1.8);
  const scoreRef   = useRef(0);
  const legRef     = useRef(0);
  const legDirRef  = useRef(1);
  const hiRef      = useRef(0);
  const cloudsRef  = useRef<CloudDef[]>([]);

  const die = useCallback(() => {
    stateRef.current = 'dead';
    const s = scoreRef.current;
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
    if (s === 'idle' || s === 'dead') startGame();
    else if (s === 'playing' && onGndRef.current) {
      jumpVyRef.current = JUMP_VY;
      onGndRef.current  = false;
    }
  }, [startGame]);

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

  useEffect(() => {
    const canvas    = canvasRef.current;
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
      if (cloudsRef.current.length === 0) {
        const count = Math.max(4, Math.ceil(w / 180));
        cloudsRef.current = Array.from({ length: count }, (_, i) => ({
          x: (i / count) * w + Math.random() * (w / count * 0.6),
          y: 12 + Math.random() * 45,
          w: 55 + Math.floor(Math.random() * 55),
        }));
      }
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

      const gw    = gwRef.current;
      const state = stateRef.current;

      // Scroll clouds at fixed speed (independent of game speed)
      for (const c of cloudsRef.current) {
        c.x -= CLOUD_SPD * dt;
        if (c.x + c.w < 0) {
          c.x = gw + 10 + Math.random() * 60;
          c.y = 12 + Math.random() * 45;
        }
      }

      drawBackground(ctx, gw, cloudsRef.current);
      drawGround(ctx, gw);

      if (state === 'playing') {
        // Physics
        if (!onGndRef.current) {
          jumpVyRef.current  += GRAVITY * dt;
          jumpOffRef.current += jumpVyRef.current * dt;
          if (jumpOffRef.current >= 0) {
            jumpOffRef.current = 0;
            jumpVyRef.current  = 0;
            onGndRef.current   = true;
          }
        }

        // Leg animation
        legRef.current += legDirRef.current * 330 * dt;
        if (Math.abs(legRef.current) > 11) legDirRef.current *= -1;

        // Spawn obstacles
        nextObsRef.current -= dt;
        if (nextObsRef.current <= 0) {
          obsRef.current.push(makeObs(gw));
          const minGap = Math.max(0.9, 1.8 - scoreRef.current * 0.015);
          nextObsRef.current = minGap + Math.random() * 1.2;
        }

        // Move obstacles
        const spd = spdRef.current;
        obsRef.current = obsRef.current
          .map(o => ({ ...o, x: o.x - spd * dt }))
          .filter(o => o.x + o.w > -10);

        // Score: count each obstacle successfully jumped over
        for (const obs of obsRef.current) {
          if (!obs.passed && obs.x + obs.w < CHK_X + HIT_L) {
            obs.passed = true;
            scoreRef.current += 1;
          }
        }

        // Speed scales with score
        spdRef.current = Math.min(SPD_MAX, SPD_INIT + scoreRef.current * 8);

        // Collision
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
        // Idle / dead: gentle leg sway
        legRef.current += legDirRef.current * 120 * dt;
        if (Math.abs(legRef.current) > 11) legDirRef.current *= -1;
      }

      for (const obs of obsRef.current) drawObs(ctx, obs);
      drawChicken(ctx, CHK_X, GY + jumpOffRef.current, legRef.current);

      // Score display with drop-shadow for readability over sky
      if (state !== 'idle') {
        ctx.font = '20px "VT323", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillText(String(scoreRef.current), gw - 9, 29);
        ctx.fillStyle = '#FCEE4B';
        ctx.fillText(String(scoreRef.current), gw - 10, 28);
        if (hiRef.current > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillText(`HI ${hiRef.current}`, gw - 9, 49);
          ctx.fillStyle = '#CCCCCC';
          ctx.fillText(`HI ${hiRef.current}`, gw - 10, 48);
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
      className="w-full relative overflow-hidden select-none"
      style={{ height: GH }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleInput}
        onTouchStart={e => { e.preventDefault(); handleInput(); }}
        className="block cursor-pointer"
        style={{ imageRendering: 'pixelated', touchAction: 'none' }}
      />

      {uiState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          {label && (
            <span
              className="font-press text-white"
              style={{ fontSize: 32, textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}
            >
              {label}
            </span>
          )}
          <span
            className="font-press text-yellow-300 text-xs animate-pulse"
            style={{ textShadow: '1px 1px 0 #000' }}
          >
            TAP / SPACE TO PLAY
          </span>
        </div>
      )}

      {uiState === 'dead' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
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
