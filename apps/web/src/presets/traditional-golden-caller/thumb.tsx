import "@fontsource/cormorant-garamond/latin-500.css";
import { type Card, hostBlock } from "@invite-me/api/invites/card";
import type { CSSProperties } from "react";

import { Mandala } from "./mandala";

/** A small still of the design: ivory sheet, gold frame, mandala, the couple's names. */
export function GoldenThumb({ card }: { card: Card }) {
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl [container-type:inline-size]"
      style={
        {
          background: "#f3ead3",
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          color: "#3b3a36",
          ["--gold" as string]: "#b0862f",
        } as CSSProperties
      }
    >
      <div className="is-in absolute left-1/2 top-0 w-[84%] -translate-x-1/2 -translate-y-1/2">
        <Mandala />
      </div>
      <div
        className="absolute inset-x-0 top-[38%] grid justify-items-center gap-[0.4em] px-[8%] text-center"
        style={{ fontSize: "clamp(8px, 2.6cqw, 14px)" }}
      >
        {hostBlock(card).hosts[0] ? <span className="tracking-[0.18em]">{hostBlock(card).hosts[0]}</span> : null}
        <span className="mt-1 text-[1.9em] leading-none tracking-[0.06em]" style={{ color: "#8a6a22" }}>
          {card.name1}
        </span>
        <span className="text-[0.8em] tracking-[0.3em]">AND</span>
        <span className="text-[1.9em] leading-none tracking-[0.06em]" style={{ color: "#8a6a22" }}>
          {card.name2}
        </span>
        <span className="mt-1 tracking-[0.2em]">{card.venueName}</span>
      </div>
      {/* The frame sits on top and inside the rounded edge, so no corner ever cuts it off. */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl border-[5px] border-[#b0862f]" aria-hidden />
    </div>
  );
}
