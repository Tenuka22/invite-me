import "@fontsource/gloock/latin-400.css";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import { cardDateParts, hostBlock, timeRange } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { Music2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GuestStage } from "../stage";
import type { GuestPageProps } from "../types";
import "./beira.css";
import { resolveLook } from "./config";
import { type Music, startMusic } from "./music";
import { Horizon } from "./scene";

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/** How the card greets this party, by the age group the host chose. */
function salutation(name: string, age: string | null) {
  if (age === "teen") return `Hi ${name},`;
  if (age === "elder") return `Respected ${name},`;
  return `Dear ${name},`;
}

/** Quiet music the guest switches on themselves. It never plays on its own. */
function MusicToggle() {
  const music = useRef<Music | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => () => music.current?.stop(), []);
  return (
    <Button
      className="stage-action"
      aria-pressed={on}
      onClick={() => {
        if (on) {
          music.current?.stop();
          music.current = null;
        } else {
          music.current = startMusic();
        }
        setOn(!on);
      }}
    >
      {on ? <VolumeX className="size-5" aria-hidden /> : <Music2 className="size-5" aria-hidden />}
      {on ? "Turn the music off" : "Play quiet music"}
    </Button>
  );
}

/**
 * The card on one screen: a sunset over Beira Lake. Portrait: text on top, names above the
 * horizon, the lake below. Landscape: words on the left, the names on the right over the horizon.
 */
export function BeiraGuestPage(props: GuestPageProps) {
  const { card, party, lite = false } = props;
  const look = resolveLook(card.look);
  const date = cardDateParts(card.date);
  const host = hostBlock(card);

  return (
    <GuestStage
      {...props}
      toneClass="tone-beira"
      infoExtra={look.music === "offer" && !lite ? <MusicToggle /> : null}
    >
      <article className="bd" data-hour={look.hour} data-age={party.ageGroup ?? "adult"} aria-label={`Invitation for ${party.displayName}`}>
        <div className="bd-glow" aria-hidden />
        <div className="bd-words">
          <p className="bd-hello">{salutation(party.displayName, party.ageGroup)}</p>
          <p className="bd-hosts">
            {host.hosts[0] ? <span>{host.hosts[0]}</span> : null}
            {host.connector ? <span className="bd-join">{host.connector}</span> : null}
            {host.hosts[1] ? <span>{host.hosts[1]}</span> : null}
          </p>
          <p className="bd-request">
            {host.request} {host.occasion}
          </p>
        </div>

        <h1 className="bd-names">
          <span>{card.name1}</span>
          <span className="bd-amp">and</span>
          <span>{card.name2}</span>
        </h1>

        <div className="bd-when">
          <p className="bd-date">
            {titleCase(date.weekday)}, {date.day} {titleCase(date.month)} {date.year}
          </p>
          <p>
            {[timeRange(card), [titleCase(card.venueName), titleCase(card.city)].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="bd-lake">
          <Horizon />
          <div className="bd-water" aria-hidden>
            <p className="bd-names bd-mirror">
              <span>{card.name1}</span>
              <span className="bd-amp">and</span>
              <span>{card.name2}</span>
            </p>
          </div>
        </div>
      </article>
    </GuestStage>
  );
}
