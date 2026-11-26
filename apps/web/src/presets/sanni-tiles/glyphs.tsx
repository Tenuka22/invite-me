import type { SVGProps } from "react";

/**
 * Bold folk-art tiles in flat colour with a dark outline: sun, diamond, arch, burst, rings, petals,
 * chevrons, fan. Each takes two colours so a grid of them reads as a set. Plain SVG, no pictures.
 */
type P = SVGProps<SVGSVGElement> & { a: string; b: string };
const line = { stroke: "var(--st-outline)", strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" } as const;

function Sun({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M50 8 58 26H42Z" fill={b} {...line} transform={`rotate(${i * 45} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="22" fill={a} {...line} />
      <circle cx="50" cy="50" r="9" fill={b} {...line} />
    </svg>
  );
}
function Diamond({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <path d="M50 8 92 50 50 92 8 50Z" fill={a} {...line} />
      <path d="M50 26 74 50 50 74 26 50Z" fill={b} {...line} />
      <circle cx="50" cy="50" r="6" fill={a} {...line} />
    </svg>
  );
}
function Arch({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <path d="M14 90V50a36 36 0 0 1 72 0v40Z" fill={a} {...line} />
      <path d="M30 90V52a20 20 0 0 1 40 0v38Z" fill={b} {...line} />
      <path d="M50 90V36" {...line} />
    </svg>
  );
}
function Burst({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <path d="M50 8 62 38 94 40 70 60 78 92 50 74 22 92 30 60 6 40 38 38Z" fill={a} {...line} />
      <circle cx="50" cy="50" r="13" fill={b} {...line} />
    </svg>
  );
}
function Rings({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <circle cx="50" cy="50" r="40" fill={a} {...line} />
      <circle cx="50" cy="50" r="27" fill={b} {...line} />
      <circle cx="50" cy="50" r="14" fill={a} {...line} />
      <circle cx="50" cy="50" r="4" fill="var(--st-outline)" />
    </svg>
  );
}
function Petals({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      {[0, 90, 180, 270].map((r) => (
        <path key={r} d="M50 50C34 38 36 14 50 8c14 6 16 30 0 42Z" fill={a} {...line} transform={`rotate(${r} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="10" fill={b} {...line} />
    </svg>
  );
}
function Chevrons({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <path d="M12 34 50 12 88 34v16L50 28 12 50Z" fill={a} {...line} />
      <path d="M12 58 50 36 88 58v16L50 52 12 74Z" fill={b} {...line} />
      <path d="M12 82 50 60 88 82" fill="none" {...line} />
    </svg>
  );
}
function Fan({ a, b, ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <path d="M50 88 12 40a50 50 0 0 1 76 0Z" fill={a} {...line} />
      <path d="M50 88 28 36M50 88 50 30M50 88 72 36" fill="none" {...line} />
      <circle cx="50" cy="88" r="8" fill={b} {...line} />
    </svg>
  );
}

const KINDS = [Sun, Diamond, Arch, Burst, Rings, Petals, Chevrons, Fan];
const COLOURS: [string, string][] = [
  ["#d9a638", "#c4472d"],
  ["#e0793a", "#f1e3b8"],
  ["#4d7fb5", "#f1e3b8"],
  ["#6a9a4f", "#e8c25a"],
  ["#c4472d", "#f1e3b8"],
];

/** One tile's picture. The kind and colours are picked by position so neighbours differ. */
export function Glyph({ index, ...p }: { index: number } & SVGProps<SVGSVGElement>) {
  const Kind = KINDS[(index * 3 + Math.floor(index / 4)) % KINDS.length]!;
  const [a, b] = COLOURS[(index * 2 + Math.floor(index / 5)) % COLOURS.length]!;
  return <Kind a={a} b={b} {...p} />;
}
