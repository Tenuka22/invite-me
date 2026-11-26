import type { SVGProps } from "react";

/**
 * Block-print ornaments in one ink colour (`currentColor`): leaves, frangipani, lotus, a diamond
 * and a ring. Plain SVG, so they print and scale without any picture files.
 */
type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Lotus(props: P) {
  return (
    <svg viewBox="0 0 100 90" aria-hidden {...base} {...props}>
      <path d="M50 76C40 58 42 38 50 24c8 14 10 34 0 52Z" fill="currentColor" fillOpacity={0.14} />
      <path d="M50 76C32 70 20 54 20 38c16 4 28 18 30 38ZM50 76c18-6 30-22 30-38-16 4-28 18-30 38Z" />
      <path d="M50 78C26 80 8 68 4 52c20 0 40 8 46 26ZM50 78c24 2 42-10 46-26-20 0-40 8-46 26Z" />
      <path d="M50 30v40M36 46c6 8 10 16 14 26M64 46c-6 8-10 16-14 26" strokeWidth={1} />
      <path d="M14 84h72M26 88h48" strokeWidth={1.2} />
    </svg>
  );
}

export function Frangipani(props: P) {
  return (
    <svg viewBox="-40 -40 80 80" aria-hidden {...base} {...props}>
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 0C-10-6-12-26-2-35 8-28 10-10 0 0Z" fill="currentColor" fillOpacity={0.12} />
          <path d="M0-6C-1-14-1-22-2-30" strokeWidth={1} />
        </g>
      ))}
      <circle r="3.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Leaves(props: P) {
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden {...base} {...props}>
      {[-72, -36, 0, 36, 72].map((a) => (
        <g key={a} transform={`translate(0 12) rotate(${a})`}>
          <path d="M0 0C-15-14-15-38 0-54 15-38 15-14 0 0Z" fill="currentColor" fillOpacity={0.2} />
          <path d="M0 0V-50M0-14-8-22M0-14 8-22M0-26-9-34M0-26 9-34M0-38-6-44M0-38 6-44" strokeWidth={1} />
        </g>
      ))}
      <circle cy="14" r="3.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Two nested diamonds with a dot, a small repeating block-print unit. */
export function Diamond(props: P) {
  return (
    <svg viewBox="0 0 60 60" aria-hidden {...base} {...props}>
      <path d="M30 4 56 30 30 56 4 30Z" />
      <path d="M30 15 45 30 30 45 15 30Z" fill="currentColor" fillOpacity={0.18} />
      <circle cx="30" cy="30" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A ring of eight small petals. */
export function Ring(props: P) {
  return (
    <svg viewBox="-30 -30 60 60" aria-hidden {...base} {...props}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="0" cy="-17" rx="4.5" ry="9" transform={`rotate(${a})`} fill="currentColor" fillOpacity={0.16} />
      ))}
      <circle r="5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Quarter-round corner piece, as on a block-printed book cover. */
export function Corner(props: P) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden {...props}>
      <path d="M0 0h40C40 22 22 40 0 40Z" fill="var(--cp-leaf)" />
      <path d="M0 0h26C26 14 14 26 0 26Z" fill="none" stroke="var(--cp-paper)" strokeWidth="1.4" />
      <circle cx="4" cy="4" r="11" fill="var(--cp-dark)" />
    </svg>
  );
}
