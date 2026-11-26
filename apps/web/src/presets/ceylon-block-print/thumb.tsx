import "@fontsource-variable/fraunces";
import type { Card } from "@invite-me/api/invites/card";

import "./ceylon.css";
import { Corner, Diamond, Frangipani, Leaves } from "./motifs";

/** A small still of the design: the card on its dark table, left-aligned names, a band of ornaments. */
export function CeylonThumb({ card }: { card: Card }) {
  return (
    <div
      className="cp cp-thumb relative aspect-[3/4] w-full overflow-hidden"
      data-palette={card.look.palette === "coral" ? "coral" : "crimson"}
      style={{ containerType: "inline-size", ["--u" as string]: "2.2cqw" }}
    >
      <div className="cp-card">
        <div className="cp-frame" />
        <Corner className="cp-corner is-tl" />
        <Corner className="cp-corner is-tr" />
        <p
          className="absolute left-[12%] top-[34%] leading-[0.95]"
          style={{ fontFamily: "Fraunces Variable, Georgia, serif", fontWeight: 600, fontSize: "clamp(14px, 10cqw, 34px)", color: "var(--cp-ink)" }}
        >
          {card.name1}
          <br />
          <span style={{ fontStyle: "italic", fontWeight: 400 }}>&amp;</span> {card.name2}
        </p>
        <div className="absolute inset-x-[12%] bottom-[9%] grid grid-cols-3 gap-[5%]" style={{ color: "var(--cp-ink)" }}>
          <Leaves />
          <Frangipani />
          <Diamond />
        </div>
      </div>
    </div>
  );
}
