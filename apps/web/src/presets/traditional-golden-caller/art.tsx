import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import { cardDateParts, hostBlock, timeRange } from "@invite-me/api/invites/card";
import { useEffect, useState } from "react";

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

  return (
    <GuestStage {...props} toneClass={`tone-golden-${look.backdrop}`}>
      <article className={`ga ${drawn ? "is-in" : ""}`} aria-label={`Invitation for ${party.displayName}`}>
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
          <p className="ga-for">For {party.displayName}</p>
          {host.hosts[0] ? <p>{host.hosts[0]}</p> : null}
          {host.connector ? <p className="ga-soft">{host.connector}</p> : null}
          {host.hosts[1] ? <p>{host.hosts[1]}</p> : null}
          <p className="ga-request">{host.request}</p>
          <p className="ga-soft ga-occasion">{host.occasion}</p>
        </header>

        <h1 className="ga-names">
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
          {card.subEvents.map((s, i) => (
            <p key={i} className="ga-soft">
              {s.label} at {s.time}
            </p>
          ))}
          <p className="ga-venue">{card.venueName}</p>
          <p className="ga-soft">{card.city}</p>
        </section>
      </article>
    </GuestStage>
  );
}
