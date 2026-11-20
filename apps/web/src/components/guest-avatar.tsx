/** FNV-1a: a stable 32-bit hash of the seed, so the same guest always gets the same face. */
function seedHash(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Identicon: a 5×5 mirrored pattern whose bits and warm hue both come from the seed hash.
 * Decorative only; the guest's name sits next to it.
 */
export function GuestAvatar({ seed, size = 40 }: { seed: string; size?: number }) {
  const h = seedHash(seed);
  const hue = 15 + (h % 110);
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if ((h >>> (y * 3 + x)) & 1) {
        cells.push([x, y], [4 - x, y]);
      }
    }
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: `oklch(0.92 0.04 ${hue})` }}
    >
      <svg viewBox="0 0 5 5" width={size * 0.7} height={size * 0.7} shapeRendering="crispEdges">
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} style={{ fill: `oklch(0.5 0.14 ${hue})` }} />
        ))}
      </svg>
    </span>
  );
}
