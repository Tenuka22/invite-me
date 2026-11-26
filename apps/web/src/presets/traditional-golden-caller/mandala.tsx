import "./mandala.css";
import type { CSSProperties } from "react";

/*
 * Procedural traditional mandala. Geometry is generated from the layer counts
 * below so the ring/petal/dot counts can be tuned without hand-editing paths.
 * Layers, outside to inside: scalloped fringe, outer lotus leaves with inner
 * leaves, beaded ring, sawtooth band, diamond ring, inner lotus, star centre.
 * Animation classes (gc-line, gc-petal, gc-diamond, gc-dot) are styled in
 * golden-caller.css; --i staggers each element.
 */

const OUTER_LEAVES = 16;
const FRINGE = 32;
const BEADS = 48;
const SAWTOOTH = 48;
const DIAMONDS = 24;
const INNER_LEAVES = 12;
const STAR_POINTS = 8;

const deg = (i: number, n: number) => (i * 360) / n;
const at = (i: number, n: number) => ({ transform: `rotate(${deg(i, n)}deg)` });
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** Vesica leaf from radius `base`, reaching `len` outward (negative = inward). */
const leaf = (base: number, len: number, wid: number) =>
  `M0 ${-base} Q${wid} ${-base - len / 2} 0 ${-base - len} Q${-wid} ${-base - len / 2} 0 ${-base}Z`;

/** Diamond centred on radius `c`, half-height `h`, half-width `w`. */
const diamond = (c: number, h: number, w: number) =>
  `M0 ${-(c + h)} L${w} ${-c} L0 ${-(c - h)} L${-w} ${-c}Z`;

/** Triangle pointing inward from the outer radius to `inner`. */
const sawtooth = (outer: number, inner: number, w: number) =>
  `M${-w} ${-outer} L0 ${-inner} L${w} ${-outer}Z`;

/** Star polygon alternating between `outer` and `inner` radius. */
function star(points: number, outer: number, inner: number) {
  const steps = points * 2;
  return Array.from({ length: steps }, (_, k) => {
    const r = k % 2 === 0 ? outer : inner;
    const a = ((k * 360) / steps - 90) * (Math.PI / 180);
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  }).join(" L");
}

export function Mandala({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-100 -100 200 200" className={`gc-mandala ${className}`} aria-hidden="true">
      <g className="gc-mandala-spin">
        {/* Scalloped fringe */}
        {Array.from({ length: FRINGE }, (_, i) => (
          <circle key={`fringe-${i}`} cx={0} cy={-96} r={1.4} className="gc-dot" style={{ ...at(i, FRINGE), ...stagger(i) }} />
        ))}
        <circle r={94} className="gc-line" style={stagger(0)} />

        {/* Outer lotus leaves, each with an inner leaf */}
        {Array.from({ length: OUTER_LEAVES }, (_, i) => (
          <g key={`leaf-${i}`} style={at(i, OUTER_LEAVES)}>
            <path d={leaf(56, 36, 8)} className="gc-petal" style={stagger(i)} />
            <path d={leaf(61, 25, 4)} className="gc-petal" style={stagger(i + 1)} />
          </g>
        ))}
        {/* Drops between the leaves */}
        {Array.from({ length: OUTER_LEAVES }, (_, i) => (
          <circle
            key={`drop-${i}`}
            cx={0}
            cy={-86}
            r={2.2}
            className="gc-dot"
            style={{ ...at(i + 0.5, OUTER_LEAVES), ...stagger(i) }}
          />
        ))}

        {/* Rings and beaded band */}
        <circle r={54} className="gc-line" style={stagger(1)} />
        <circle r={51} className="gc-line" style={stagger(2)} />
        {Array.from({ length: BEADS }, (_, i) => (
          <circle key={`bead-${i}`} cx={0} cy={-52.5} r={1.1} className="gc-dot" style={{ ...at(i, BEADS), ...stagger(i) }} />
        ))}

        {/* Sawtooth band */}
        {Array.from({ length: SAWTOOTH }, (_, i) => (
          <path key={`saw-${i}`} d={sawtooth(50, 42, 2.2)} className="gc-diamond" style={{ ...at(i, SAWTOOTH), ...stagger(i) }} />
        ))}
        <circle r={41} className="gc-line" style={stagger(3)} />
        <circle r={39} className="gc-line" style={stagger(4)} />

        {/* Diamond ring with a dot in each */}
        {Array.from({ length: DIAMONDS }, (_, i) => (
          <g key={`dia-${i}`} style={at(i, DIAMONDS)}>
            <path d={diamond(34, 4.5, 3)} className="gc-diamond" style={stagger(i)} />
            <circle cx={0} cy={-34} r={0.9} className="gc-dot" style={stagger(i)} />
          </g>
        ))}
        <circle r={31} className="gc-line" style={stagger(5)} />
        <circle r={29} className="gc-line" style={stagger(6)} />

        {/* Inner lotus leaves pointing inward */}
        {Array.from({ length: INNER_LEAVES }, (_, i) => (
          <path key={`in-${i}`} d={leaf(29, -15, 4)} className="gc-petal" style={{ ...at(i, INNER_LEAVES), ...stagger(i) }} />
        ))}
        <circle r={13} className="gc-line" style={stagger(7)} />

        {/* Star centre */}
        <path d={`M ${star(STAR_POINTS, 11, 5.5)} Z`} pathLength={1} className="gc-line" style={stagger(8)} />
        <circle r={3} className="gc-diamond" style={stagger(9)} />
        {Array.from({ length: STAR_POINTS }, (_, i) => (
          <circle key={`core-${i}`} cx={0} cy={-7.5} r={1.2} className="gc-dot" style={{ ...at(i, STAR_POINTS), ...stagger(i) }} />
        ))}
      </g>
    </svg>
  );
}
