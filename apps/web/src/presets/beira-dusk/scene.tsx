/**
 * Flat geometry for the Beira Dusk world: the lake pavilion on its horizon with the
 * setting sun, and a moonstone threshold whose outer ring carries the lanterns.
 * Everything is shapes and strokes; colours come from CSS variables in beira.css.
 */

/** Tiered roof with upturned eaves, centred on x = 200. */
function roof(y: number, half: number, rise: number) {
  return `M${200 - half} ${y} C${200 - half * 0.7} ${y - 2} ${200 - half * 0.45} ${y - rise * 0.55} ${200 - half * 0.28} ${y - rise}
    L${200 + half * 0.28} ${y - rise} C${200 + half * 0.45} ${y - rise * 0.55} ${200 + half * 0.7} ${y - 2} ${200 + half} ${y}
    L${200 + half * 0.86} ${y + 5} L${200 - half * 0.86} ${y + 5} Z`;
}

function Pavilion() {
  const pillars = [146, 164, 182, 218, 236, 254];
  return (
    <g className="bd-sil">
      {/* finial: a small stupa on a spire */}
      <path d="M200 10 L202.5 30 L197.5 30 Z" />
      <path d="M192 40 Q200 26 208 40 Z" />
      <path d={roof(64, 52, 22)} />
      <rect x="168" y="68" width="64" height="10" />
      <path d={roof(92, 84, 22)} />
      {pillars.map((x) => (
        <rect key={x} x={x} y="96" width="5" height="22" />
      ))}
      <rect x="126" y="117" width="148" height="5" />
      <rect x="112" y="122" width="176" height="6" />
    </g>
  );
}

function Palm({ x, flip = false, scale = 1 }: { x: number; flip?: boolean; scale?: number }) {
  const s = flip ? -1 : 1;
  return (
    <g className="bd-sil" transform={`translate(${x} 128) scale(${s * scale} ${scale})`}>
      <path d="M0 0 C2 -30 8 -60 18 -86" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      {[
        "M18 -86 C6 -92 -10 -90 -22 -78",
        "M18 -86 C10 -100 -2 -104 -14 -102",
        "M18 -86 C24 -102 34 -106 46 -100",
        "M18 -86 C32 -92 44 -86 52 -74",
        "M18 -86 C26 -80 30 -70 30 -60",
      ].map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      ))}
    </g>
  );
}

/** Horizon at y = 128 of a 400 x 128 box; the water and reflection are drawn by CSS below it. */
export function Horizon() {
  return (
    <svg className="bd-horizon" viewBox="0 0 400 128" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <defs>
        <clipPath id="bd-above">
          <rect x="0" y="0" width="400" height="128" />
        </clipPath>
      </defs>
      <circle className="bd-sun" cx="318" cy="128" r="32" clipPath="url(#bd-above)" />
      <Palm x={40} scale={1.05} />
      <Palm x={66} flip scale={0.8} />
      <Palm x={356} flip />
      <Pavilion />
    </svg>
  );
}

const CX = 200;
const CY = 200;

function polar(r: number, deg: number): [number, number] {
  const a = (Math.PI * deg) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function arc(r: number) {
  const [x0, y0] = polar(r, 180);
  const [x1, y1] = polar(r, 0);
  return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
}

function marks(count: number, from = 4, to = 176) {
  return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
}

/** Points on the moonstone's outer ring, where the lanterns stand. */
export const LANTERN_ANGLES = marks(9, 12, 168);
export const LANTERN_RADIUS = 196;
export function lanternPoint(deg: number) {
  return polar(LANTERN_RADIUS, deg);
}

/**
 * Moonstone (sandakada pahana), outside in: flame tongues, the animal procession
 * (abstracted to alternating beads), the creeper, the geese, then the lotus.
 */
export function Moonstone({ lit }: { lit: boolean }) {
  const vine = Array.from({ length: 121 }, (_, i) => {
    const deg = 180 - i * 1.5;
    const r = 150 + Math.sin((i / 120) * Math.PI * 16) * 5;
    const [x, y] = polar(r, deg);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg className={`bd-moonstone ${lit ? "is-lit" : ""}`} viewBox="0 0 400 206" aria-hidden>
      <g className="bd-stone">
        <path d={arc(188)} />
        <path d={arc(170)} />
        {marks(34).map((deg) => {
          const [ax, ay] = polar(172, deg - 2);
          const [bx, by] = polar(186, deg);
          const [cx, cy] = polar(172, deg + 2);
          return <path key={`f${deg}`} d={`M${ax} ${ay} L${bx} ${by} L${cx} ${cy}`} />;
        })}
        {marks(26).map((deg, i) => {
          const [x, y] = polar(162, deg);
          return <circle key={`p${deg}`} cx={x} cy={y} r={i % 2 ? 1.6 : 3} className="bd-fill" />;
        })}
        <path d={arc(156)} />
        <path d={vine} />
        <path d={arc(142)} />
        {marks(18).map((deg) => {
          const [ax, ay] = polar(128, deg - 3);
          const [bx, by] = polar(135, deg);
          const [cx, cy] = polar(128, deg + 3);
          return <path key={`g${deg}`} d={`M${ax} ${ay} L${bx} ${by} L${cx} ${cy}`} />;
        })}
        <path d={arc(120)} />
        <path d={arc(96)} />
        {marks(9, 10, 170).map((deg) => {
          const [tx, ty] = polar(90, deg);
          const [lx, ly] = polar(34, deg - 9);
          const [rx, ry] = polar(34, deg + 9);
          return <path key={`l${deg}`} d={`M${lx} ${ly} Q${polar(70, deg - 10).join(" ")} ${tx} ${ty} Q${polar(70, deg + 10).join(" ")} ${rx} ${ry}`} />;
        })}
        <path d={arc(30)} />
      </g>
      {LANTERN_ANGLES.map((deg, i) => {
        const [x, y] = lanternPoint(deg);
        return (
          <g key={deg} className="bd-lantern" style={{ "--i": i } as React.CSSProperties} transform={`translate(${x} ${y - 10})`}>
            <line x1="0" y1="-8" x2="0" y2="-3" />
            <path d="M-5 -3 Q-7 4 -5 10 L5 10 Q7 4 5 -3 Z" />
          </g>
        );
      })}
    </svg>
  );
}
