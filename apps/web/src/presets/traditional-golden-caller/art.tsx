import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import { cardDateParts, formatTime, hostBlock, tidyText } from "@invite-me/api/invites/card";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { useFit } from "../fit";
import { Invited } from "../invited";
import { GuestStage } from "../stage";
import type { GuestPageProps } from "../types";
import { TimeRange } from "../time-range";
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
  // Previews and print hide the floating bar, and a hidden element measures as an empty box at the
  // top of the page. Reading it there would leave no room for the words at all, so the text would
  // shrink to its floor. Without a bar, the card's own bottom edge is the limit.
  const bar = document.querySelector(".stage-bar");
  const barBox = bar?.getBoundingClientRect();
  const barTop = barBox && barBox.height > 0 ? barBox.top : r.bottom;
  if (window.matchMedia(LANDSCAPE).matches)
    return { ...sides, top: r.top + pad, bottom: r.bottom - pad, avoid: barTop < r.bottom ? barBox : undefined };
  const mandala = el.querySelector(".ga-top")?.getBoundingClientRect();
  return { ...sides, top: (mandala?.bottom ?? r.top) - 6, bottom: barTop - 6 };
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
      <article ref={root} className={`ga ${drawn ? "is-in" : ""} ${props.print ? "is-print" : ""}`} data-age={party.ageGroup ?? "adult"} aria-label={`Invitation for ${party.displayName}`}>
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
            <TimeRange card={card} lead={date.year} />
          </p>
          {card.subEvents.slice(0, CARD_EVENTS).map((s, i) => (
            <p key={i} className="ga-soft">
              {[s.label, formatTime(s.time)].filter(Boolean).join(" at ")}
            </p>
          ))}
          {card.subEvents.length > CARD_EVENTS ? <p className="ga-soft">+ {card.subEvents.length - CARD_EVENTS} more in the schedule</p> : null}
          {tidyText(card.venueName) ? <p className="ga-venue">{tidyText(card.venueName)}</p> : null}
          {tidyText(card.city) ? <p className="ga-soft">{tidyText(card.city)}</p> : null}
          <Invited party={party} print={props.print} />
        </section>
      </article>
    </GuestStage>
  );
}
