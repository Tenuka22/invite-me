import "@fontsource/hanken-grotesk/latin-800.css";
import type { Card } from "@invite-me/api/invites/card";

import { Glyph } from "./glyphs";
import "./tiles.css";

/** A small still of the design: heavy capitals over a grid of flat-colour tiles. */
export function SanniThumb({ card }: { card: Card }) {
  return (
    <div
      className="st st-thumb relative aspect-[3/4] w-full overflow-hidden"
      data-palette={card.look.palette === "clay" ? "clay" : "teal"}
      style={{ containerType: "inline-size" }}
    >
      <div className="st-card">
        <p className="st-thumb-names">
          {card.name1}
          <br />&amp; {card.name2}
        </p>
        <div className="st-grid">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="st-tile">
              <Glyph index={i} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
