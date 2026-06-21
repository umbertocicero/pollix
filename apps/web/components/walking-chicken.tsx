'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/* A small Minecraft chicken that slowly paces the top edge of its
   (position: relative) parent. Horizontal walk uses requestAnimationFrame
   so iOS Safari never throttles it (CSS animations on position:absolute
   elements outside parent bounds are suspended on iOS).
   - hover  → it stops walking (stands still)
   - click / touch → a short (~1s) "startled" reaction: it hops, stretches its
     neck, flares its wings and puffs off a few feathers, then resumes.
   A crisp dark outline keeps the white body visible on light backgrounds. */

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

interface Props {
  /** seconds for a full back-and-forth loop (bigger = slower) */
  duration?: number;
  /** pixel height of the chicken */
  size?: number;
  className?: string;
}

export function WalkingChicken({ duration = 30, size = 32, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const [startled, setStartled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const lastTsRef = useRef<number | null>(null);

  const poke = () => {
    setStartled(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStartled(false), 1000);
  };

  const paused = hovered || startled;

  // Freeze/resume the SMIL leg steps in sync with the walk.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);

  // rAF-driven horizontal walk — works on iOS Safari unlike CSS animations
  // on position:absolute elements placed outside parent bounds (bottom:100%).
  useEffect(() => {
    if (paused) {
      lastTsRef.current = null;
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const durationMs = duration * 1000;

    const step = (ts: number) => {
      if (lastTsRef.current !== null) {
        elapsedRef.current += ts - lastTsRef.current;
      }
      lastTsRef.current = ts;

      const pos = posRef.current;
      const flip = flipRef.current;
      if (pos && flip) {
        const parentW = pos.parentElement?.clientWidth ?? 300;
        // ping-pong: 0→1 first half, 1→0 second half
        const t = (elapsedRef.current % durationMs) / durationMs;
        const pingpong = t < 0.5 ? t * 2 : 2 - t * 2;
        const x = 4 + pingpong * (parentW - 38);
        pos.style.transform = `translateX(${x}px)`;
        flip.style.transform = t < 0.5 ? 'scaleX(1)' : 'scaleX(-1)';
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [paused, duration]);

  return (
    <div
      aria-hidden
      className={`mc-chicken-walker absolute bottom-full left-0 w-full z-10 ${paused ? 'is-paused' : ''} ${className}`}
      style={{ height: size } as CSSProperties}
    >
      <div ref={posRef} className="mc-chicken-pos" style={{ height: size }}>
        <div ref={flipRef} className="mc-chicken-flip" style={{ height: size }}>
          <button
            type="button"
            onClick={poke}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(false); }}
            aria-label="chicken"
            className={`mc-chicken-body block cursor-pointer border-0 bg-transparent p-0 ${startled ? 'is-startled' : ''}`}
            style={{ height: size, lineHeight: 0 }}
          >
          <svg
            ref={svgRef}
            height={size}
            viewBox="-13 -30 30 31"
            className="mc-chicken-outline"
            style={{ shapeRendering: 'crispEdges', display: 'block', overflow: 'visible' }}
          >
            {/* ── flying feathers (only animate when startled) ── */}
            <g className="mc-chicken-feathers">
              <rect x={-9} y={-18} width={2} height={2} fill={C.white} />
              <rect x={-11} y={-22} width={2} height={2} fill={C.light} />
              <rect x={-6} y={-26} width={2} height={2} fill={C.white} />
              <rect x={2} y={-28} width={2} height={2} fill={C.light} />
              <rect x={-2} y={-27} width={2} height={2} fill={C.white} />
            </g>

            {/* tail */}
            <rect x={-10} y={-18} width={3} height={7} fill={C.gray} />

            {/* body */}
            <rect x={-9} y={-16} width={17} height={9} fill={C.white} />
            <rect x={-8} y={-20} width={15} height={13} fill={C.white} />
            <rect x={-7} y={-10} width={13} height={3} fill={C.gray} />
            <rect x={5} y={-18} width={2} height={8} fill={C.gray} />

            {/* wings — spread out when startled */}
            <g className="mc-chicken-wing-back">
              <rect x={-6} y={-17} width={9} height={6} fill={C.light} />
              <rect x={-4} y={-15} width={2} height={2} fill={C.gray} />
              <rect x={0} y={-14} width={2} height={2} fill={C.gray} />
            </g>
            <g className="mc-chicken-wing-front">
              <rect x={2} y={-16} width={6} height={5} fill={C.light} />
            </g>

            {/* head + neck — stretches up when startled */}
            <g className="mc-chicken-head">
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
            </g>

            {/* back leg — rotates around the hip (−2,−8) */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="11 -2 -8; -11 -2 -8; 11 -2 -8"
                dur="0.8s"
                repeatCount="indefinite"
              />
              <rect x={-3} y={-8} width={2} height={6} fill={C.leg} />
              <rect x={-5} y={-2} width={5} height={2} fill={C.leg} />
            </g>

            {/* front leg — rotates around the hip (2,−8), opposite phase */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-11 2 -8; 11 2 -8; -11 2 -8"
                dur="0.8s"
                repeatCount="indefinite"
              />
              <rect x={1} y={-8} width={2} height={6} fill={C.leg} />
              <rect x={-1} y={-2} width={5} height={2} fill={C.leg} />
            </g>
          </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
