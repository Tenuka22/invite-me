import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import { cardDateParts, hostBlock, joinPlace, timeRange } from "@invite-me/api/invites/card";
import { type CSSProperties, useRef } from "react";

import { useFit } from "../fit";
import { Invited } from "../invited";
import { GuestStage } from "../stage";
import type { GuestPageProps } from "../types";
import { TimeRange } from "../time-range";
import "./ceylon.css";
import { resolveLook } from "./config";
import { Corner, Diamond, Frangipani, Leaves, Lotus, Ring } from "./motifs";

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
  const band = el.querySelector(".cp-band")?.getBoundingClientRect();
  const pad = 12;
  return { left: r.left + pad, right: r.right - pad, top: r.top + pad, bottom: (band?.top ?? r.bottom) - 4 };
}

function longestWord(...names: string[]) {
  return Math.max(1, ...names.flatMap((n) => n.split(/\s+/).map((w) => w.length)));
}

const UNITS = [Leaves, Frangipani, Diamond, Lotus, Ring, Leaves, Frangipani, Diamond, Lotus, Ring, Leaves, Frangipani];

/** A strip of repeating block-print units, like the border of a printed book cover. */
function Band() {
  return (
    <div className="cp-band" aria-hidden>
      {UNITS.map((Unit, i) => (
        <span key={i} className="cp-tile">
          <Unit />
        </span>
      ))}
    </div>
  );
}

/**
 * A block-print page: red ink on oatmeal paper, or coral with sage and navy. Everything sits on
 * one left edge, divided by thin rules; a band of repeating ornaments closes the page. Portrait
 * stacks the words over the band; landscape puts the words left and a tiled panel right.
 */
export function CeylonGuestPage(props: GuestPageProps) {
  const { card, party, lite = false } = props;
  const look = resolveLook(card.look);
  const date = cardDateParts(card.date);
  const host = hostBlock(card);
  const root = useRef<HTMLElement>(null);
  useFit(root, ".cp-head, .cp-names, .cp-when", limits, [card, party.displayName, lite]);
  const place = joinPlace(titleCase(card.venueName), titleCase(card.city));

  return (
    <GuestStage {...props} toneClass={`tone-ceylon-${look.palette}`}>
      <article
        ref={root}
        className="cp"
        data-palette={look.palette}
        data-age={party.ageGroup ?? "adult"}
        aria-label={`Invitation for ${party.displayName}`}
      >
        <div className="cp-card">
          <div className="cp-frame" aria-hidden />
          <Corner className="cp-corner is-tl" />
          <Corner className="cp-corner is-tr" />

        <div className="cp-text">
          <header className="cp-head">
            {party.displayName ? <p className="cp-hello">{salutation(party.displayName, party.ageGroup)}</p> : null}
            {host.hosts.length ? (
              <p className="cp-hosts">
                {host.hosts[0] ? <span>{host.hosts[0]}</span> : null}
                {host.connector ? <span className="cp-join">{host.connector}</span> : null}
                {host.hosts[1] ? <span>{host.hosts[1]}</span> : null}
              </p>
            ) : null}
            <p className="cp-request">
              {host.request} {host.occasion}
            </p>
          </header>

          <h1 className="cp-names" style={{ "--len": longestWord(card.name1, card.name2) } as CSSProperties}>
            <span>{card.name1}</span>
            <span>
              <i>&amp;</i> {card.name2}
            </span>
          </h1>

          <div className="cp-when">
            <p className="cp-day">
              <b>{date.day}</b>
              <span>
                {titleCase(date.month)}
                <br />
                {date.year}
              </span>
            </p>
            <p className="cp-line">
              {titleCase(date.weekday)}
              {timeRange(card) ? " · " : null}
              <TimeRange card={card} />
            </p>
            {place ? <p className="cp-line">{place}</p> : null}
            <Invited party={party} print={props.print} />
          </div>
        </div>

        <Band />
          </div>
      </article>
    </GuestStage>
  );
}
