'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* A small Minecraft chicken that slowly paces the top edge of its
   (position: relative) parent.

   IMPORTANT: every motion here is SVG SMIL (<animateTransform>), NOT CSS
   animations or requestAnimationFrame. On iOS Safari — especially with
   "Reduce Motion" enabled or Low Power Mode active — CSS animations and rAF
   for this decoration get suspended/throttled, which left the body frozen
   while only the SMIL legs kept moving. SMIL is unaffected by either, and is
   the same mechanism the full-width background chicken uses, so the whole
   bird now walks reliably on mobile.

   - hover (mouse only) → pauseAnimations() freezes the stroll
   - click / touch → a short (~1s) "startled" CSS reaction (hop, neck stretch,
     wing flare, flying feathers), then it resumes.
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

// chicken art extents (in SVG user units) used to keep margins off the edges
const CHK_LEFT = -13;
const CHK_RIGHT = 17;
const MARGIN = 4;

export function WalkingChicken({ duration = 30, size = 32, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const [startled, setStartled] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const poke = () => {
    setStartled(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStartled(false), 1000);
  };

  const paused = hovered || startled;

  // Freeze/resume all SMIL motion (walk, flip, bob, legs) together.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);

  // Measure the card width so the SMIL translate can span its full width.
  // useLayoutEffect runs before paint, so the first frame is already correct.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vbW = width || 300;
  const baseY = size - 1; // feet sit just above the card edge
  // translate group ping-pongs the chicken from the left margin to the right.
  const startX = MARGIN - CHK_LEFT;
  const endX = vbW - MARGIN - CHK_RIGHT;
  const walkValues = `${startX} ${baseY}; ${endX} ${baseY}; ${startX} ${baseY}`;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`mc-chicken-walker absolute left-0 w-full z-10 ${className}`}
      style={{ height: size, top: -size }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height={size}
        viewBox={`0 0 ${vbW} ${size}`}
        preserveAspectRatio="xMinYMax meet"
        className={`mc-chicken-outline ${startled ? 'is-startled' : ''}`}
        style={{ shapeRendering: 'crispEdges', display: 'block', overflow: 'visible' }}
      >
        {/* horizontal walk along the card edge (SMIL) */}
        <g
          onClick={poke}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(false); }}
          style={{ cursor: 'pointer' }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values={walkValues}
            keyTimes="0;0.5;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
          />

          {/* facing direction: flip exactly at the turn (SMIL, discrete) */}
          <g className="mc-chicken-flip">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1 1;-1 1;1 1"
              keyTimes="0;0.5;1"
              calcMode="discrete"
              dur={`${duration}s`}
              repeatCount="indefinite"
            />

            {/* gentle body bob synced with the steps (SMIL) */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -1; 0 0"
                dur="0.5s"
                repeatCount="indefinite"
              />

              {/* CSS "startled" hop lives on this group (no SMIL transform here
                  so the CSS animation never conflicts) */}
              <g className="mc-chicken-body">
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
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
