import "@fontsource/gloock/latin-400.css";
import type { Card } from "@invite-me/api/invites/card";

import "./beira.css";
import { Horizon } from "./scene";

/** A small still of the design: the sunset sky, the pavilion on its horizon, the lake below. */
export function BeiraThumb({ card }: { card: Card }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ containerType: "inline-size", background: "linear-gradient(180deg,#f7c98a,#f2a66e 46%,#df7a5f)", ["--sil" as string]: "#4a1d2c", ["--sun" as string]: "#fcd98c", ["--sun-y" as string]: "0px" }}>
      <p className="absolute inset-x-0 top-[12%] text-center text-[clamp(18px,7cqw,38px)] leading-[0.95]" style={{ fontFamily: "Gloock, Georgia, serif", color: "#33131f" }}>
        {card.name1}
        <br />
        <span className="text-[0.4em] tracking-[0.3em]" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>AND</span>
        <br />
        {card.name2}
      </p>
      <div className="absolute inset-x-0 bottom-[22%]">
        <Horizon />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[22%]" style={{ background: "linear-gradient(180deg,#8e4458,#3d2340)" }} />
    </div>
  );
}
