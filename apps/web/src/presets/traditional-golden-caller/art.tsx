import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import { cardDateParts, hostBlock, timeRange } from "@invite-me/api/invites/card";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { useFit } from "../fit";
import { Invited } from "../invited";
import { GuestStage } from "../stage";
import type { GuestPageProps } from "../types";
import "./art.css";
import { resolveLook } from "./config";
import { Mandala } from "./mandala";

function useDrawn(lite: boolean) {
  const [drawn, setDrawn] = useState(lite);
  // The mandala draws itself once the page has painted; previews show it finished.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return drawn || lite;
}
const CARD_EVENTS = 2;
const LANDSCAPE = "(orientation: landscape) and (min-aspect-ratio: 5/4)";

function limits(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const pad = 16;
  const sides = { left: r.left + pad, right: r.right - pad };
  const bar = document.querySelector(".stage-bar")?.getBoundingClientRect();
  if (window.matchMedia(LANDSCAPE).matches) return { ...sides, top: r.top + pad, bottom: r.bottom - pad, avoid: bar };
  const mandala = el.querySelector(".ga-top")?.getBoundingClientRect();
  return { ...sides, top: (mandala?.bottom ?? r.top) - 6, bottom: (bar?.top ?? r.bottom) - 6 };
}

function longestWord(...names: string[]) {
  return Math.max(1, ...names.flatMap((n) => n.split(/\s+/).map((w) => w.length)));
}

/**
 * The card on one screen. Portrait: everything on a centre line. Landscape: hosts and request on
 * the left, the mandala and the couple in the middle, date and place on the right.
 */
export function GoldenGuestPage(props: GuestPageProps) {
  const { card, party, lite = false } = props;
  const look = resolveLook(card.look);
  const date = cardDateParts(card.date);
  const host = hostBlock(card);
  const drawn = useDrawn(lite);
  const root = useRef<HTMLElement>(null);
  useFit(root, ".ga-hosts, .ga-names, .ga-when", limits, [card, party.displayName, lite]);

  return (
    <GuestStage {...props} toneClass={`tone-golden-${look.backdrop}`}>
      <article ref={root} className={`ga ${drawn ? "is-in" : ""}`} data-age={party.ageGroup ?? "adult"} aria-label={`Invitation for ${party.displayName}`}>
        <div className="ga-glow" aria-hidden />
        <div className="ga-frame" aria-hidden />
        <div className="ga-top" aria-hidden>
          <Mandala />
        </div>
        <div className="ga-corner is-left" aria-hidden>
          <Mandala />
        </div>
        <div className="ga-corner is-right" aria-hidden>
          <Mandala />
        </div>

        <header className="ga-hosts ga-caps">
          {party.displayName ? <p className="ga-for">For {party.displayName}</p> : null}
          {host.hosts[0] ? <p>{host.hosts[0]}</p> : null}
          {host.connector ? <p className="ga-soft">{host.connector}</p> : null}
          {host.hosts[1] ? <p>{host.hosts[1]}</p> : null}
          <p className="ga-request">{host.request}</p>
          <p className="ga-soft ga-occasion">{host.occasion}</p>
        </header>

        <h1 className="ga-names" style={{ "--len": longestWord(card.name1, card.name2) } as CSSProperties}>
          <span>{card.name1}</span>
          <span className="ga-and">and</span>
          <span>{card.name2}</span>
        </h1>

        <section className="ga-when ga-caps">
          <div className="ga-date">
            <span>{date.month}</span>
            <b>{date.day}</b>
            <span>{date.weekday}</span>
          </div>
          <p>
            {[date.year, timeRange(card)].filter(Boolean).join(" · ")}
          </p>
          {card.subEvents.slice(0, CARD_EVENTS).map((s, i) => (
            <p key={i} className="ga-soft">
              {[s.label, s.time].filter(Boolean).join(" at ")}
            </p>
          ))}
          {card.subEvents.length > CARD_EVENTS ? <p className="ga-soft">+ {card.subEvents.length - CARD_EVENTS} more in the schedule</p> : null}
          {card.venueName.trim() ? <p className="ga-venue">{card.venueName}</p> : null}
          {card.city.trim() ? <p className="ga-soft">{card.city}</p> : null}
          <Invited party={party} print={props.print} />
        </section>
      </article>
    </GuestStage>
  );
}
