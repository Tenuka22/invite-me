import { type RefObject, useLayoutEffect } from "react";

type Limits = { top: number; bottom: number; left: number; right: number; avoid?: DOMRect };

/**
 * Keeps long content on the one screen. A design lists the text blocks that may shrink and the
 * box they must stay inside (plus an optional rectangle to keep clear of, like the floating
 * buttons); when any line pokes out, `--fit` (a zoom on those blocks) is reduced in small steps
 * until it all fits. Short content is left at full size.
 */
export function useFit(
  root: RefObject<HTMLElement | null>,
  blocks: string,
  limits: (root: HTMLElement) => Limits,
  deps: readonly unknown[],
) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const run = () => {
      const lines = Array.from(el.querySelectorAll<HTMLElement>(blocks)).flatMap((b) =>
        Array.from(b.querySelectorAll<HTMLElement>("*")).filter((n) => n.childElementCount === 0),
      );
      let k = 1;
      el.style.setProperty("--fit", "1");
      for (let i = 0; i < 12; i++) {
        const box = limits(el);
        const out = lines.some((n) => {
          const r = n.getBoundingClientRect();
          if (!r.width || !r.height) return false;
          const hits = box.avoid && r.bottom > box.avoid.top && r.top < box.avoid.bottom && r.right > box.avoid.left && r.left < box.avoid.right;
          return hits || r.top < box.top - 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.right > box.right + 1;
        });
        if (!out || k <= 0.55) break;
        k = Math.max(0.55, k * 0.94);
        el.style.setProperty("--fit", String(k));
      }
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    void document.fonts?.ready.then(run);
    return () => ro.disconnect();
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-fit when the card text changes
  }, deps);
}
