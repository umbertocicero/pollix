'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────
   Minecraft-style animated landscape — XP "Bliss" inspired.
   Layered parallax scene with atmospheric perspective:
   sky → aurora → stars/shooting-stars → moon/sun → clouds (drift) →
   far mountains → mid hills → near hills → lake (shimmer) →
   trees (sway) → fireflies / birds → foreground.
   Animation is pure SVG/SMIL so it runs with zero JS per frame.
   ───────────────────────────────────────────────────────────────── */

/* ── Static landscape data ───────────────────────────────────── */

const STARS = [
  { x: 15, y: 10, s: 2, o: 0.9 },  { x: 48, y: 24, s: 2, o: 0.7 },
  { x: 76, y: 8, s: 1, o: 0.5 },   { x: 98, y: 40, s: 2, o: 0.8 },
  { x: 125, y: 14, s: 1, o: 0.6 },  { x: 152, y: 32, s: 2, o: 0.9 },
  { x: 178, y: 18, s: 1, o: 0.4 },  { x: 202, y: 44, s: 2, o: 0.7 },
  { x: 228, y: 6, s: 2, o: 0.8 },   { x: 255, y: 28, s: 1, o: 0.6 },
  { x: 285, y: 50, s: 2, o: 0.9 },  { x: 312, y: 16, s: 1, o: 0.5 },
  { x: 338, y: 38, s: 2, o: 0.7 },  { x: 358, y: 10, s: 2, o: 0.8 },
  { x: 415, y: 22, s: 1, o: 0.6 },  { x: 435, y: 52, s: 2, o: 0.9 },
  { x: 462, y: 20, s: 1, o: 0.4 },  { x: 32, y: 56, s: 1, o: 0.5 },
  { x: 108, y: 64, s: 2, o: 0.7 },  { x: 145, y: 72, s: 1, o: 0.6 },
  { x: 228, y: 58, s: 2, o: 0.8 },  { x: 302, y: 68, s: 1, o: 0.5 },
  { x: 355, y: 74, s: 2, o: 0.7 },  { x: 445, y: 78, s: 1, o: 0.6 },
  { x: 472, y: 42, s: 2, o: 0.9 },  { x: 8, y: 36, s: 1, o: 0.4 },
  { x: 168, y: 60, s: 1, o: 0.5 },  { x: 390, y: 64, s: 2, o: 0.8 },
];

const TREES_NEAR = [
  { x: 52, gy: 192 },
  { x: 86, gy: 178 },
  { x: 124, gy: 162 },
  { x: 164, gy: 156 },
  { x: 236, gy: 166 },
  { x: 268, gy: 172 },
  { x: 396, gy: 190 },
  { x: 420, gy: 174 },
  { x: 454, gy: 186 },
];

const TREES_MID = [
  { x: 310, gy: 158 },
  { x: 342, gy: 150 },
  { x: 366, gy: 154 },
];

const NEAR_STEPS = [
  { x: 0, y: 214 },   { x: 16, y: 208 },  { x: 32, y: 200 },
  { x: 48, y: 192 },  { x: 64, y: 184 },  { x: 80, y: 178 },
  { x: 96, y: 172 },  { x: 112, y: 166 }, { x: 128, y: 162 },
  { x: 144, y: 158 }, { x: 160, y: 156 }, { x: 176, y: 154 },
  { x: 192, y: 154 }, { x: 208, y: 156 }, { x: 224, y: 160 },
  { x: 240, y: 166 }, { x: 256, y: 172 }, { x: 272, y: 180 },
  { x: 288, y: 190 }, { x: 304, y: 200 }, { x: 320, y: 208 },
  { x: 336, y: 212 }, { x: 352, y: 208 }, { x: 368, y: 200 },
  { x: 384, y: 190 }, { x: 400, y: 180 }, { x: 416, y: 174 },
  { x: 432, y: 178 }, { x: 448, y: 186 }, { x: 464, y: 196 },
];

const FLOWERS = [
  { x: 58, y: 190, c: '#FF4444' },  { x: 94, y: 176, c: '#FCEE4B' },
  { x: 140, y: 160, c: '#FF88FF' }, { x: 178, y: 153, c: '#FF4444' },
  { x: 190, y: 153, c: '#FFFFFF' }, { x: 242, y: 164, c: '#FCEE4B' },
  { x: 134, y: 161, c: '#FF4444' }, { x: 404, y: 178, c: '#FF88FF' },
  { x: 426, y: 173, c: '#FCEE4B' }, { x: 460, y: 184, c: '#FFFFFF' },
  { x: 74, y: 182, c: '#FF88FF' },  { x: 210, y: 155, c: '#FF4444' },
];

const FIREFLIES = [
  { x: 300, y: 186, r: 14 }, { x: 330, y: 192, r: 18 }, { x: 350, y: 188, r: 12 },
  { x: 280, y: 184, r: 16 }, { x: 160, y: 152, r: 20 }, { x: 440, y: 180, r: 13 },
  { x: 120, y: 170, r: 15 }, { x: 210, y: 178, r: 17 },
];

// Shooting stars: each streaks diagonally then waits before repeating.
const SHOOTING_STARS = [
  { x: 60, y: 18, dx: 70, dy: 34, len: 18, dur: 9, begin: 1.5 },
  { x: 250, y: 12, dx: 84, dy: 30, len: 22, dur: 13, begin: 6 },
  { x: 150, y: 30, dx: 60, dy: 26, len: 16, dur: 11, begin: 9.5 },
];

// Day birds gliding across the sky (kept in the visible mid-sky band).
const BIRDS = [
  { y: 100, dur: 26, begin: 0 },
  { y: 126, dur: 34, begin: 4 },
  { y: 112, dur: 30, begin: 9 },
];

/* ── Stepped terrain paths (Minecraft block style) ───────────── */

const FAR_HILLS =
  'M0,270 V168 H16 V166 H32 V164 H48 V162 H64 V160 H80 V158 H96 V156 ' +
  'H112 V154 H128 V152 H144 V150 H160 V148 H176 V146 H192 V146 ' +
  'H208 V148 H224 V150 H240 V152 H256 V150 H272 V146 H288 V142 ' +
  'H304 V138 H320 V134 H336 V138 H352 V142 H368 V148 H384 V154 ' +
  'H400 V160 H416 V164 H432 V168 H448 V170 H464 V168 H480 V270 Z';

const MID_HILLS =
  'M0,270 V182 H16 V178 H32 V174 H48 V170 H64 V168 H80 V166 H96 V164 ' +
  'H112 V166 H128 V170 H144 V174 H160 V178 H176 V182 H192 V186 ' +
  'H208 V190 H224 V186 H240 V180 H256 V174 H272 V168 H288 V162 ' +
  'H304 V158 H320 V154 H336 V150 H352 V154 H368 V160 H384 V166 ' +
  'H400 V172 H416 V178 H432 V182 H448 V186 H464 V182 H480 V270 Z';

const NEAR_HILLS =
  'M0,270 V214 H16 V208 H32 V200 H48 V192 H64 V184 H80 V178 H96 V172 ' +
  'H112 V166 H128 V162 H144 V158 H160 V156 H176 V154 H192 V154 ' +
  'H208 V156 H224 V160 H240 V166 H256 V172 H272 V180 H288 V190 ' +
  'H304 V200 H320 V208 H336 V212 H352 V208 H368 V200 H384 V190 ' +
  'H400 V180 H416 V174 H432 V178 H448 V186 H464 V196 H480 V270 Z';

/* ── Reusable cloud cluster (tiled for seamless drift) ────────── */

function CloudCluster({ main, shadow }: { main: string; shadow: string }) {
  // Kept low in the sky band so they stay visible below the page header
  // (the SVG is bottom-anchored with `slice`, so the very top gets cropped).
  return (
    <>
      <rect x={60} y={98} width={44} height={8} fill={main} />
      <rect x={52} y={106} width={60} height={10} fill={main} />
      <rect x={56} y={116} width={48} height={6} fill={shadow} />

      <rect x={250} y={92} width={36} height={8} fill={main} />
      <rect x={244} y={100} width={48} height={10} fill={main} />
      <rect x={248} y={110} width={40} height={6} fill={shadow} />

      <rect x={420} y={104} width={28} height={6} fill={main} />
      <rect x={416} y={110} width={36} height={8} fill={main} />
      <rect x={418} y={118} width={30} height={4} fill={shadow} />

      <rect x={150} y={124} width={22} height={6} fill={main} />
      <rect x={146} y={130} width={30} height={6} fill={shadow} />
    </>
  );
}

/* ── Walking chicken (side-view, Minecraft mob) ──────────────────
   Art is drawn facing right, centered horizontally at x=0 with the
   feet on y=0, so flipping is a clean scale(-1,1) around the origin.
   It strolls back and forth across the left meadow (avoiding the lake),
   following the near-hill surface, flipping direction at each turn. */

const C = {
  white: '#FFFFFF',
  light: '#DCDCDC',
  gray: '#C7C7C7',
  beak: '#F2A93C',
  beakDark: '#C77E2A',
  red: '#D6352B',
  leg: '#F2C84B',
  eye: '#161616',
};

function Chicken() {
  // Walk path: (centerX, surfaceY) ping-pong over the near hill.
  // Centred around x≈190 so it stays inside the band that's visible on
  // mobile (heavy horizontal crop), while still looking good full-width.
  const walk =
    '100 170; 140 159; 180 154; 215 157; 250 169; 278 180; ' +
    '250 169; 215 157; 180 154; 140 159; 100 170';
  const walkKeys = '0;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1';
  const dur = 22;

  return (
    <g>
      {/* position along the meadow */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values={walk}
        keyTimes={walkKeys}
        dur={`${dur}s`}
        repeatCount="indefinite"
      />

      {/* soft ground shadow (does not flip/bob) */}
      <rect x={-7} y={-1} width={14} height={2} fill="#000000" opacity={0.15} />

      {/* facing direction: flip at the turn */}
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1 1;-1 1;1 1"
          keyTimes="0;0.5;1"
          calcMode="discrete"
          dur={`${dur}s`}
          repeatCount="indefinite"
        />

        {/* gentle body bob synced with the steps */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -1; 0 0"
            dur="0.5s"
            repeatCount="indefinite"
          />

          {/* tail */}
          <rect x={-10} y={-18} width={3} height={7} fill={C.gray} />

          {/* body */}
          <rect x={-9} y={-16} width={17} height={9} fill={C.white} />
          <rect x={-8} y={-20} width={15} height={13} fill={C.white} />
          <rect x={-7} y={-10} width={13} height={3} fill={C.gray} />
          <rect x={5} y={-18} width={2} height={8} fill={C.gray} />

          {/* wing */}
          <rect x={-6} y={-17} width={9} height={6} fill={C.light} />
          <rect x={-4} y={-15} width={2} height={2} fill={C.gray} />
          <rect x={0} y={-14} width={2} height={2} fill={C.gray} />

          {/* head */}
          <rect x={2} y={-24} width={8} height={8} fill={C.white} />
          <rect x={3} y={-26} width={6} height={2} fill={C.white} />

          {/* comb */}
          <rect x={6} y={-27} width={3} height={2} fill={C.red} />

          {/* eye */}
          <rect x={6} y={-22} width={2} height={2} fill={C.eye} />

          {/* beak */}
          <rect x={10} y={-21} width={4} height={2} fill={C.beak} />
          <rect x={10} y={-19} width={3} height={2} fill={C.beakDark} />

          {/* wattle */}
          <rect x={8} y={-18} width={2} height={3} fill={C.red} />

          {/* back leg (steps out of phase) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="12 -2 -8; -12 -2 -8; 12 -2 -8"
              dur="0.5s"
              repeatCount="indefinite"
            />
            <rect x={-3} y={-8} width={2} height={6} fill={C.leg} />
            <rect x={-5} y={-2} width={5} height={2} fill={C.leg} />
          </g>

          {/* front leg */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-12 2 -8; 12 2 -8; -12 2 -8"
              dur="0.5s"
              repeatCount="indefinite"
            />
            <rect x={1} y={-8} width={2} height={6} fill={C.leg} />
            <rect x={-1} y={-2} width={5} height={2} fill={C.leg} />
          </g>
        </g>
      </g>
    </g>
  );
}

/* ── Component ───────────────────────────────────────────────── */

export function McBackground({ className = '' }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={className} />;

  const night = resolvedTheme === 'dark';

  const sky = night
    ? { top: '#05040F', mid: '#0C0B2A', bot: '#19305A' }
    : { top: '#3D8FD6', mid: '#74BEEA', bot: '#B3DDF5' };

  // Atmospheric perspective: far layers are hazier / bluer.
  const hills = night
    ? { far: '#0E1A30', mid: '#10241B', near: '#163218', grassTop: '#264A20' }
    : { far: '#7BA0BC', mid: '#4F7A36', near: '#5D8A3A', grassTop: '#72B24A' };

  const lakeC = night
    ? { main: '#081C32', highlight: '#1E5A86' }
    : { main: '#4A9FD9', highlight: '#9BE0FF' };

  const tree = night
    ? { trunk: '#2A1A0E', leaves: '#102A12', top: '#0A1E0B' }
    : { trunk: '#6B4226', leaves: '#2B3F1A', top: '#1D2A11' };

  const dirt = night ? '#1A0E06' : '#6B4226';

  const cloud = night
    ? { main: '#23234A', shadow: '#191934', opacity: 0.3 }
    : { main: '#FFFFFF', shadow: '#D8E4F0', opacity: 0.9 };

  // Aurora curtains (night): vertical beams across the sky that shimmer in a wave.
  const auroraBars = Array.from({ length: 28 }, (_, i) => {
    const x = i * 18 - 12;
    const h = 64 + ((i * 37) % 40);          // varied curtain heights
    const palette = ['url(#auroraGreen)', 'url(#auroraTeal)', 'url(#auroraViolet)'];
    const fill = palette[i % 3];
    const dur = 4 + ((i * 13) % 30) / 10;     // 4.0–6.9s
    const phase = (i % 7) * 0.4;              // staggered shimmer
    const baseO = 0.18 + ((i * 7) % 5) / 18;
    return { x, h, fill, dur, phase, baseO, key: i };
  });

  // Floating motes — embers drifting up at night, pollen drifting in daytime.
  const motes = Array.from({ length: 16 }, (_, i) => ({
    x: (i * 53) % 480,
    y: 120 + ((i * 29) % 110),
    s: 1 + (i % 2),
    dur: 7 + ((i * 11) % 60) / 10,
    begin: (i * 0.6) % 6,
    drift: i % 2 === 0 ? 8 : -6,
    key: i,
  }));

  return (
    <div className={className}>
      <svg
        viewBox="0 0 480 270"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full block"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <defs>
          <linearGradient id="mcSkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.top} />
            <stop offset="52%" stopColor={sky.mid} />
            <stop offset="100%" stopColor={sky.bot} />
          </linearGradient>
          {/* Aurora gradients: bright at the top, fading downward */}
          <linearGradient id="auroraGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9BFFB0" stopOpacity="0" />
            <stop offset="35%" stopColor="#3DFF9E" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0FA86A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7BFFE8" stopOpacity="0" />
            <stop offset="40%" stopColor="#33E0D6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0E8FA8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraViolet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6A8FF" stopOpacity="0" />
            <stop offset="45%" stopColor="#9D5BFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5B2FB0" stopOpacity="0" />
          </linearGradient>
          {/* Moon glow reflected in the lake */}
          <linearGradient id="moonReflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0E860" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F0E860" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="480" height="270" fill="url(#mcSkyGrad)" />

        {/* ── Aurora borealis (night) ── */}
        {night && (
          <g>
            {auroraBars.map((b) => (
              <rect
                key={`au${b.key}`}
                x={b.x}
                y={18}
                width={14}
                height={b.h}
                fill={b.fill}
                opacity={b.baseO}
              >
                <animate
                  attributeName="opacity"
                  values={`${b.baseO};${b.baseO + 0.4};${b.baseO * 0.6};${b.baseO}`}
                  dur={`${b.dur}s`}
                  begin={`${b.phase}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="height"
                  values={`${b.h};${b.h + 14};${b.h - 8};${b.h}`}
                  dur={`${b.dur * 1.3}s`}
                  begin={`${b.phase}s`}
                  repeatCount="indefinite"
                />
              </rect>
            ))}
            {/* slow horizontal sway of the whole curtain */}
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 10 0; -6 0; 0 0"
              dur="18s"
              repeatCount="indefinite"
            />
          </g>
        )}

        {/* ── Stars (night) ── */}
        {night &&
          STARS.map((s, i) => (
            <rect
              key={`s${i}`}
              x={s.x}
              y={s.y}
              width={s.s}
              height={s.s}
              fill={i % 5 === 0 ? '#FFFFCC' : '#FFFFFF'}
              opacity={s.o}
            >
              {i % 3 === 0 && (
                <animate
                  attributeName="opacity"
                  values={`${s.o};${s.o * 0.15};${s.o}`}
                  dur={`${2 + (i % 4)}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          ))}

        {/* ── Shooting stars (night) — hidden on mobile ── */}
        {night && (
          <g className="hidden sm:block">
            {SHOOTING_STARS.map((st, i) => {
            const activeFrac = st.len / (Math.hypot(st.dx, st.dy) + st.len);
            return (
              <g key={`sh${i}`}>
                <g opacity={0}>
                  {/* head */}
                  <rect x={st.x} y={st.y} width={2} height={2} fill="#FFFFFF" />
                  {/* tail */}
                  <rect x={st.x - st.len} y={st.y - st.len * (st.dy / st.dx)} width={st.len} height={1} fill="#FFFFFF" opacity={0.5} />
                  <animate
                    attributeName="opacity"
                    values="0;0;1;1;0"
                    keyTimes={`0;${(1 - activeFrac * 1.2).toFixed(3)};${(1 - activeFrac).toFixed(3)};0.99;1`}
                    dur={`${st.dur}s`}
                    begin={`${st.begin}s`}
                    repeatCount="indefinite"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0 0;0 0;${st.dx} ${st.dy}`}
                    keyTimes={`0;${(1 - activeFrac).toFixed(3)};1`}
                    dur={`${st.dur}s`}
                    begin={`${st.begin}s`}
                    repeatCount="indefinite"
                  />
                </g>
              </g>
            );
            })}
          </g>
        )}

        {/* ── Moon / Sun with pulsing glow ── */}
        {/* Centred around x≈300, y≈62 so they clear the page header and
            stay inside the visible x band on portrait mobile (≈164–316). */}
        {night ? (
          <g>
            <rect x={280} y={42} width={40} height={40} fill="#F0E860" opacity={0.06}>
              <animate attributeName="opacity" values="0.04;0.1;0.04" dur="6s" repeatCount="indefinite" />
            </rect>
            <rect x={286} y={48} width={28} height={28} fill="#F4ED7A" />
            <rect x={292} y={54} width={8} height={8} fill="#D8D040" opacity={0.4} />
            <rect x={304} y={64} width={6} height={6} fill="#D8D040" opacity={0.3} />
            <rect x={294} y={68} width={4} height={4} fill="#C8C030" opacity={0.25} />
          </g>
        ) : (
          <g>
            <rect x={274} y={36} width={52} height={52} fill="#FCEE4B" opacity={0.1}>
              <animate attributeName="opacity" values="0.07;0.16;0.07" dur="5s" repeatCount="indefinite" />
            </rect>
            <rect x={286} y={48} width={28} height={28} fill="#FCEE4B" />
            <rect x={290} y={52} width={8} height={8} fill="#FFF68F" opacity={0.5} />
            {/* rays */}
            <g opacity={0.5}>
              <rect x={296} y={38} width={8} height={6} fill="#FCEE4B" />
              <rect x={296} y={80} width={8} height={6} fill="#FCEE4B" />
              <rect x={274} y={58} width={6} height={8} fill="#FCEE4B" />
              <rect x={320} y={58} width={6} height={8} fill="#FCEE4B" />
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
            </g>
          </g>
        )}

        {/* ── Drifting clouds (parallax, seamless loop) ── */}
        <g opacity={cloud.opacity}>
          <g>
            <g><CloudCluster main={cloud.main} shadow={cloud.shadow} /></g>
            <g transform="translate(480,0)"><CloudCluster main={cloud.main} shadow={cloud.shadow} /></g>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="-480 0"
              dur={night ? '90s' : '70s'}
              repeatCount="indefinite"
            />
          </g>
        </g>

        {/* ── Birds gliding (day) — flap their wings while crossing ── */}
        {!night &&
          BIRDS.map((b, i) => (
            <g key={`bird${i}`}>
              {/* left wing flaps */}
              <rect x={0} y={0} width={3} height={2} fill="#2F2F2F" opacity={0.8}>
                <animate attributeName="y" values="0;2;0" dur="0.6s" repeatCount="indefinite" />
              </rect>
              {/* body */}
              <rect x={3} y={2} width={2} height={2} fill="#2F2F2F" opacity={0.8} />
              {/* right wing flaps */}
              <rect x={5} y={0} width={3} height={2} fill="#2F2F2F" opacity={0.8}>
                <animate attributeName="y" values="0;2;0" dur="0.6s" repeatCount="indefinite" />
              </rect>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`-40 ${b.y}; 520 ${b.y - 14}`}
                dur={`${b.dur}s`}
                begin={`${b.begin}s`}
                repeatCount="indefinite"
              />
            </g>
          ))}

        {/* ── Far hills (hazy, atmospheric) ── */}
        <path d={FAR_HILLS} fill={hills.far} opacity={night ? 1 : 0.85} />

        {/* ── Mid hills ── */}
        <path d={MID_HILLS} fill={hills.mid} />

        {/* ── Trees on mid hills (small, distant) ── */}
        {TREES_MID.map((t, i) => (
          <g key={`tm${i}`}>
            <rect x={t.x} y={t.gy - 14} width={4} height={14} fill={tree.trunk} />
            <rect x={t.x - 6} y={t.gy - 24} width={16} height={10} fill={tree.leaves} />
            <rect x={t.x - 4} y={t.gy - 28} width={12} height={4} fill={tree.top} />
          </g>
        ))}

        {/* ── Near hills (main rolling hills, XP Bliss style) ── */}
        <path d={NEAR_HILLS} fill={hills.near} />

        {/* Grass-top highlights on each terrain step */}
        {NEAR_STEPS.map((step, i) => (
          <rect key={`g${i}`} x={step.x} y={step.y} width={16} height={3} fill={hills.grassTop} />
        ))}

        {/* ── Lake in the valley with animated shimmer ── */}
        <rect x={286} y={188} width={118} height={2} fill={hills.near} />
        <rect x={286} y={190} width={118} height={28} fill={lakeC.main} />
        {/* drifting highlight bands */}
        <g>
          <rect x={294} y={196} width={60} height={2} fill={lakeC.highlight} opacity={0.4}>
            <animate attributeName="x" values="294;320;294" dur="7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.15;0.4" dur="7s" repeatCount="indefinite" />
          </rect>
          <rect x={300} y={204} width={48} height={2} fill={lakeC.highlight} opacity={0.3}>
            <animate attributeName="x" values="320;296;320" dur="9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="9s" repeatCount="indefinite" />
          </rect>
          <rect x={308} y={211} width={40} height={2} fill={lakeC.highlight} opacity={0.2}>
            <animate attributeName="x" values="300;330;300" dur="11s" repeatCount="indefinite" />
          </rect>
        </g>
        {/* celestial reflection shimmering on the water */}
        {night ? (
          <rect x={296} y={192} width={8} height={24} fill="url(#moonReflect)">
            <animate attributeName="opacity" values="0.5;0.9;0.4;0.7" dur="4s" repeatCount="indefinite" />
            <animate attributeName="width" values="8;6;10;8" dur="5s" repeatCount="indefinite" />
          </rect>
        ) : (
          <rect x={296} y={192} width={8} height={22} fill="#FFF6A0" opacity={0.3}>
            <animate attributeName="opacity" values="0.3;0.55;0.3" dur="4.5s" repeatCount="indefinite" />
          </rect>
        )}

        {/* ── Trees on near hills (large, foreground, gentle sway) ── */}
        {TREES_NEAR.map((t, i) => {
          const cx = t.x + 3;
          const cy = t.gy;
          const dur = 4 + (i % 5) * 0.8;
          const amp = 1.2 + (i % 3) * 0.4;
          return (
            <g key={`tn${i}`}>
              <rect x={t.x} y={t.gy - 22} width={6} height={22} fill={tree.trunk} />
              <g>
                <rect x={t.x - 9} y={t.gy - 36} width={24} height={14} fill={tree.leaves} />
                <rect x={t.x - 5} y={t.gy - 42} width={16} height={6} fill={tree.top} />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values={`${-amp} ${cx} ${cy}; ${amp} ${cx} ${cy}; ${-amp} ${cx} ${cy}`}
                  dur={`${dur}s`}
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </g>
            </g>
          );
        })}

        {/* ── Walking chicken on the meadow ── */}
        <Chicken />

        {/* ── Dirt bottom layer ── */}
        <rect x={0} y={250} width={480} height={20} fill={dirt} />

        {/* ── Flowers (day) ── */}
        {!night &&
          FLOWERS.map((f, i) => (
            <rect key={`fl${i}`} x={f.x} y={f.y} width={3} height={3} fill={f.c} />
          ))}

        {/* ── Floating motes (embers at night / pollen by day) — hidden on mobile ── */}
        <g className="hidden sm:block">
          {motes.map((m) => (
            <rect
              key={`mote${m.key}`}
              x={m.x}
              y={m.y}
              width={m.s}
              height={m.s}
              fill={night ? '#FFCC66' : '#FFFFFF'}
              opacity={0}
            >
              <animate
                attributeName="opacity"
                values="0;0.7;0"
                dur={`${m.dur}s`}
                begin={`${m.begin}s`}
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0; ${m.drift} -26; 0 -52`}
                dur={`${m.dur}s`}
                begin={`${m.begin}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>

        {/* ── Fireflies (night) — drift + glow ── */}
        {night &&
          FIREFLIES.map((ff, i) => (
            <g key={`ff${i}`}>
              <rect x={ff.x} y={ff.y} width={2} height={2} fill="#CDFF66">
                <animate
                  attributeName="opacity"
                  values="0.05;0.9;0.05"
                  dur={`${2.5 + i * 0.6}s`}
                  repeatCount="indefinite"
                />
              </rect>
              {/* soft glow */}
              <rect x={ff.x - 1} y={ff.y - 1} width={4} height={4} fill="#AAFF44" opacity={0.15}>
                <animate
                  attributeName="opacity"
                  values="0;0.3;0"
                  dur={`${2.5 + i * 0.6}s`}
                  repeatCount="indefinite"
                />
              </rect>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0; ${i % 2 ? ff.r : -ff.r} -8; ${i % 2 ? -ff.r : ff.r} 4; 0 0`}
                dur={`${8 + i}s`}
                repeatCount="indefinite"
              />
            </g>
          ))}
      </svg>
    </div>
  );
}
