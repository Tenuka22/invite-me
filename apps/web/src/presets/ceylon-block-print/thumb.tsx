import "@fontsource-variable/fraunces";
import type { Card } from "@invite-me/api/invites/card";

import "./ceylon.css";
import { Corner, Diamond, Frangipani, Leaves, Ring } from "./motifs";

const SERIF = "Fraunces Variable, Georgia, serif";
const ORNAMENTS = [Leaves, Frangipani, Diamond, Ring, Frangipani, Leaves];

function dayParts(date: string): { day: string; month: string } | null {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: String(d.getUTCDate()),
    month: d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase(),
  };
}

/** A small still of the design: the printed card filling its tile, names on one left edge, a band of ornaments. */
export function CeylonThumb({ card }: { card: Card }) {
  const when = dayParts(card.date);
  const ink = { color: "var(--cp-ink)" };
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

        <div className="absolute inset-x-[13%] top-[27%]" style={{ fontFamily: SERIF, ...ink }}>
          <p className="text-[clamp(7px,2.6cqw,11px)] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--cp-text)" }}>
            The wedding of
          </p>
          <p className="mt-[4cqw] font-semibold leading-[0.95] tracking-[-0.01em]" style={{ fontSize: "clamp(18px,12.5cqw,52px)" }}>
            {card.name1}
            <br />
            <span className="font-normal italic" style={{ color: "var(--cp-text)" }}>
              &amp;
            </span>{" "}
            {card.name2}
          </p>
          <div className="mt-[5cqw] flex items-center gap-[3cqw] border-t pt-[4cqw]" style={{ borderColor: "var(--cp-ink)" }}>
            {when ? (
              <>
                <b className="text-[clamp(20px,11cqw,44px)] font-semibold leading-[0.9]">{when.day}</b>
                <span className="text-[clamp(7px,2.6cqw,11px)] font-semibold uppercase leading-tight tracking-[0.18em]">
                  {when.month}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div
          className="absolute inset-x-[8%] bottom-[7%] grid grid-cols-6 border-y"
          style={{ borderColor: "var(--cp-ink)", color: "var(--cp-ink)" }}
        >
          {ORNAMENTS.map((Ornament, i) => (
            <span
              key={i}
              className={`grid aspect-square place-items-center p-[18%] ${i ? "border-l" : ""}`}
              style={{ borderColor: "var(--cp-ink)" }}
            >
              <Ornament className="size-full" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
