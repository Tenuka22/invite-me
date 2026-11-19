import { type CSSProperties, useId } from "react";

/*
 * Procedural traditional mandala, rebuilt to follow the printed reference card.
 * Rings, outside to inside:
 *   1. lotus leaves (outline + inner outline + solid foil leaf) with drops between
 *   2. double ring + beaded ring
 *   3. kite / diamond ring (outline kite, solid kite inside, dot between)
 *   4. double ring
 *   5. pointed-arch band with a tiny diamond in every arch
 *   6. double ring + sawtooth band + double ring
 *   7. dense radial stripe band
 *   8. pale starburst centre (two star polygons, spokes, rings, core star)
 *
 * All colour comes from CSS variables set on the card root (--gold, --gold-hi,
 * --gold-lo), so the scroll colour morph still works. Every animated state is a
 * Tailwind variant keyed off the nearest `group/reveal[data-in]` wrapper.
 */

const OUTER_LEAVES = 16;
const BEADS = 64;
const KITES = 24;
const ARCHES = 48;
const SAWTOOTH = 72;
const STRIPES = 108;
const SPOKES = 48;

/* Animation state classes (initial state -> `data-in=true` state). */
const DRAW = [
  "[stroke-dasharray:1] [stroke-dashoffset:1]",
  "transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]",
  "[transition-delay:var(--dl)]",
  "group-data-[in=true]/reveal:[stroke-dashoffset:0]",
  "motion-reduce:[stroke-dashoffset:0] motion-reduce:[transition-delay:0ms]",
].join(" ");

const POP_BASE = [
  "scale-0 [transform-box:fill-box]",
  "transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  "[transition-delay:var(--dl)]",
  "group-data-[in=true]/reveal:scale-100",
  "motion-reduce:scale-100 motion-reduce:[transition-delay:0ms]",
].join(" ");
const POP_UP = `${POP_BASE} origin-bottom`; // leaf grows from its base (points outward)

const FADE = [
  "opacity-0 scale-[0.4] [transform-box:fill-box] origin-center",
  "transition-[opacity,transform] duration-[800ms] ease-out",
  "[transition-delay:var(--dl)]",
  "group-data-[in=true]/reveal:opacity-100 group-data-[in=true]/reveal:scale-100",
  "motion-reduce:opacity-100 motion-reduce:scale-100 motion-reduce:[transition-delay:0ms]",
].join(" ");

const DOT = [
  "opacity-0 transition-opacity duration-[600ms] ease-out [transition-delay:var(--dl)]",
  "group-data-[in=true]/reveal:opacity-100",
  "motion-reduce:opacity-100 motion-reduce:[transition-delay:0ms]",
].join(" ");

const SPIN = [
  "[transform-origin:0_0]",
  "motion-safe:group-data-[in=true]/reveal:animate-spin motion-safe:group-data-[in=true]/reveal:[animation-duration:90s]",
].join(" ");

/* ---- helpers ---------------------------------------------------------- */

const rot = (i: number, n: number) => `rotate(${((i * 360) / n).toFixed(3)})`;
const dl = (ms: number) => ({ "--dl": `${Math.round(ms)}ms` }) as CSSProperties;
const ring = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Almond leaf from radius `base` reaching `len` outward (negative = inward): rounded base, pointed tip. `wid` is the visible width. */
const leaf = (base: number, len: number, wid: number) => {
  const c = wid * 0.94;
  const y = (t: number) => -(base + len * t);
  return `M0 ${y(0)} C${c} ${y(0.25)} ${c * 0.35} ${y(0.7)} 0 ${y(1)} C${-c * 0.35} ${y(0.7)} ${-c} ${y(0.25)} 0 ${y(0)}Z`;
};

/** Diamond centred on radius `c`, half-height `h`, half-width `w`. */
const diamond = (c: number, h: number, w: number) =>
  `M0 ${-(c + h)} L${w} ${-c} L0 ${-(c - h)} L${-w} ${-c}Z`;

/** Pointed arch standing on radius `base`, `h` tall, `w` half-width. */
const arch = (base: number, h: number, w: number) => {
  const shoulder = base + h * 0.55;
  return `M${-w} ${-base} L${-w} ${-shoulder} Q${-w} ${-(base + h * 0.9)} 0 ${-(base + h)} Q${w} ${-(base + h * 0.9)} ${w} ${-shoulder} L${w} ${-base}Z`;
};

/** Triangle with its base on `outer` and its tip at `inner`. */
const sawtooth = (outer: number, inner: number, w: number) =>
  `M${-w} ${-outer} L0 ${-inner} L${w} ${-outer}Z`;

/** Star polygon alternating between `outer` and `inner` radius. */
function star(points: number, outer: number, inner: number) {
  const steps = points * 2;
  const pts = Array.from({ length: steps }, (_, k) => {
    const r = k % 2 === 0 ? outer : inner;
    const a = ((k * 360) / steps - 90) * (Math.PI / 180);
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  });
  return `M${pts.join(" L")}Z`;
}

export function Mandala({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `gc-foil-${uid}`;
  const foil = `url(#${gid})`;

  /** Circle that draws itself. */
  const circle = (r: number, i: number, w = 0.5, op = 1) => (
    <circle
      key={`c-${r}`}
      r={r}
      fill="none"
      stroke={foil}
      strokeWidth={w}
      strokeOpacity={op}
      pathLength={1}
      className={DRAW}
      style={dl(i * 120)}
    />
  );

  return (
    <svg viewBox="-100 -100 200 200" className={`block h-auto w-full overflow-visible ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="-90" y1="-90" x2="90" y2="90">
          <stop offset="0" style={{ stopColor: "var(--gold-hi)" }} />
          <stop offset="0.5" style={{ stopColor: "var(--gold)" }} />
          <stop offset="1" style={{ stopColor: "var(--gold-lo)" }} />
        </linearGradient>
      </defs>

      <g className={SPIN}>
        {/* 1 · Lotus leaves: outline, inner outline, solid foil leaf */}
        {ring(OUTER_LEAVES).map((i) => (
          <g key={`leaf-${i}`} transform={rot(i, OUTER_LEAVES)}>
            <path d={leaf(76, 22, 17)} fill={foil} fillOpacity={0.1} stroke={foil} strokeWidth={0.6} className={POP_UP} style={dl(i * 50)} />
            <path d={leaf(78.6, 17, 10.5)} fill={foil} fillOpacity={0.08} stroke={foil} strokeWidth={0.45} className={POP_UP} style={dl(i * 50 + 120)} />
            <path d={leaf(81.2, 11.6, 6)} fill={foil} className={POP_UP} style={dl(i * 50 + 240)} />
          </g>
        ))}
        {/* drops between the leaves */}
        {ring(OUTER_LEAVES).map((i) => (
          <g key={`drop-${i}`} transform={rot(i + 0.5, OUTER_LEAVES)}>
            <circle cx={0} cy={-86.5} r={1.5} fill={foil} className={DOT} style={dl(i * 40 + 500)} />
            <circle cx={0} cy={-93} r={0.8} fill={foil} className={DOT} style={dl(i * 40 + 600)} />
          </g>
        ))}

        {/* 2 · Double ring + beaded ring */}
        {circle(74.5, 1, 0.6)}
        {circle(72.8, 2, 0.4)}
        {ring(BEADS).map((i) => (
          <g key={`bead-${i}`} transform={rot(i, BEADS)}>
            <circle cx={0} cy={-70.9} r={0.85} fill={foil} className={DOT} style={dl(i * 18 + 700)} />
          </g>
        ))}

        {/* 3 · Kite ring: outline kite, solid kite inside, dot between */}
        {ring(KITES).map((i) => (
          <g key={`kite-${i}`} transform={rot(i, KITES)}>
            <path d={diamond(63.2, 6.4, 4.7)} fill={foil} fillOpacity={0.12} stroke={foil} strokeWidth={0.6} className={FADE} style={dl(i * 40 + 800)} />
            <path d={diamond(63.2, 3.6, 2.5)} fill={foil} className={FADE} style={dl(i * 40 + 900)} />
          </g>
        ))}
        {ring(KITES).map((i) => (
          <g key={`kdot-${i}`} transform={rot(i + 0.5, KITES)}>
            <circle cx={0} cy={-63.2} r={0.9} fill={foil} className={DOT} style={dl(i * 40 + 950)} />
          </g>
        ))}
        {circle(56.2, 3, 0.6)}
        {circle(54.8, 4, 0.4)}

        {/* 5 · Pointed-arch band, a tiny diamond in each arch */}
        {ring(ARCHES).map((i) => (
          <g key={`arch-${i}`} transform={rot(i, ARCHES)}>
            <path d={arch(47.8, 6, 2.3)} fill={foil} fillOpacity={0.1} stroke={foil} strokeWidth={0.4} className={FADE} style={dl(i * 22 + 1000)} />
            <path d={diamond(50.4, 1.6, 1)} fill={foil} className={FADE} style={dl(i * 22 + 1100)} />
          </g>
        ))}
        {circle(47.2, 5, 0.5)}
        {circle(45.8, 6, 0.35)}

        {/* 6 · Sawtooth band */}
        {ring(SAWTOOTH).map((i) => (
          <g key={`saw-${i}`} transform={rot(i, SAWTOOTH)}>
            <path d={sawtooth(45.2, 41.8, 1.5)} fill={foil} className={FADE} style={dl(i * 14 + 1150)} />
          </g>
        ))}
        {circle(41, 7, 0.5)}
        {circle(40, 8, 0.35)}

        {/* 7 · Dense radial stripe band */}
        {ring(STRIPES).map((i) => (
          <g key={`stripe-${i}`} transform={rot(i, STRIPES)}>
            <line x1={0} y1={-27.2} x2={0} y2={-38.6} stroke={foil} strokeWidth={0.42} pathLength={1} className={DRAW} style={dl(i * 8 + 1100)} />
          </g>
        ))}
        {circle(26.4, 9, 0.45)}
        {circle(25.4, 10, 0.3)}

        {/* 8 · Pale starburst centre */}
        {ring(SPOKES).map((i) => (
          <g key={`spoke-${i}`} transform={rot(i, SPOKES)}>
            <line x1={0} y1={-6.5} x2={0} y2={-24} stroke={foil} strokeOpacity={0.55} strokeWidth={0.22} pathLength={1} className={DRAW} style={dl(i * 10 + 1300)} />
          </g>
        ))}
        <path d={star(24, 24.4, 17.4)} fill="none" stroke={foil} strokeOpacity={0.8} strokeWidth={0.35} pathLength={1} className={DRAW} style={dl(1300)} />
        <path d={star(16, 17.4, 11)} fill="none" stroke={foil} strokeOpacity={0.8} strokeWidth={0.35} pathLength={1} className={DRAW} style={dl(1400)} />
        {circle(11, 11, 0.3, 0.8)}
        {circle(6.5, 12, 0.3, 0.8)}
        <path d={star(8, 6, 2.8)} fill={foil} fillOpacity={0.55} className={FADE} style={dl(1700)} />
        <circle r={1.1} fill={foil} className={DOT} style={dl(1800)} />
      </g>
    </svg>
  );
}
