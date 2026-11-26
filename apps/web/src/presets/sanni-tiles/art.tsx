import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import "@fontsource/hanken-grotesk/latin-800.css";
import { cardDateParts, hostBlock, timeRange } from "@invite-me/api/invites/card";
import { type CSSProperties, useRef } from "react";

import { useFit } from "../fit";
import { Invited } from "../invited";
import { GuestStage } from "../stage";
import type { GuestPageProps } from "../types";
import { resolveLook } from "./config";
import { Glyph } from "./glyphs";
import "./tiles.css";

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function salutation(name: string, age: string | null) {
  if (age === "teen") return `Hi ${name},`;
  if (age === "elder") return `Respected ${name},`;
  return `Dear ${name},`;
}

function limits(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const grid = el.querySelector(".st-grid")?.getBoundingClientRect();
  const credits = el.querySelector(".st-credits")?.getBoundingClientRect();
  const portrait = Boolean(grid && grid.top > r.top + r.height * 0.2);
  const pad = 12;
  return {
    left: r.left + pad,
    right: (portrait ? r.right : (grid?.left ?? r.right)) - pad,
    top: r.top + pad,
    bottom: (portrait ? grid?.top : credits?.top) ?? r.bottom,
  };
}

function longestWord(...names: string[]) {
  return Math.max(1, ...names.flatMap((n) => n.split(/\s+/).map((w) => w.length)));
}

/**
 * A printed card of flat-colour tiles. Left aligned and unhurried: the names in heavy capitals,
 * the invitation in plain sentences, twelve tiles, then the date and place. Portrait stacks them;
 * landscape puts the words on the left and the tiles on the right.
 */
export function SanniGuestPage(props: GuestPageProps) {
  const { card, party, lite = false } = props;
  const look = resolveLook(card.look);
  const date = cardDateParts(card.date);
  const host = hostBlock(card);
  const root = useRef<HTMLElement>(null);
  useFit(root, ".st-head", limits, [card, party.displayName, lite]);
  const place = [titleCase(card.venueName), titleCase(card.city)].filter(Boolean).join(", ");

  return (
    <GuestStage {...props} toneClass={`tone-sanni-${look.palette}`}>
      <article
        ref={root}
        className="st"
        data-palette={look.palette}
        data-age={party.ageGroup ?? "adult"}
        aria-label={`Invitation for ${party.displayName}`}
      >
        <div className="st-card">
          <header className="st-head">
            {party.displayName ? <p className="st-hello">{salutation(party.displayName, party.ageGroup)}</p> : null}
            <h1 className="st-names" style={{ "--len": Math.max(longestWord(card.name1), longestWord(card.name2) + 2) } as CSSProperties}>
              <span>{card.name1}</span>
              <span>&amp; {card.name2}</span>
            </h1>
            {host.hosts.length ? (
              <p className="st-hosts">{[host.hosts[0], host.connector, host.hosts[1]].filter(Boolean).join(" ")}</p>
            ) : null}
            <p className="st-sub">
              {host.request} {host.occasion}
            </p>
          </header>

          <div className="st-grid" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="st-tile">
                <Glyph index={i} />
              </span>
            ))}
          </div>

          <div className="st-credits">
            <p className="st-day">
              <b>{date.day}</b>
              <span>
                {titleCase(date.month)}
                <br />
                {date.year}
              </span>
            </p>
            <p className="st-line">{[titleCase(date.weekday), timeRange(card)].filter(Boolean).join(" · ")}</p>
            {place ? <p className="st-line">{place}</p> : null}
            <Invited party={party} print={props.print} />
          </div>
        </div>
      </article>
    </GuestStage>
  );
}
