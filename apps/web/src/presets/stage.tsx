import { type Card, cardDateParts, timeRange } from "@invite-me/api/invites/card";
import { Button, ButtonLink } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { AnimatedBadge } from "@invite-me/ui/components/motion/animated-badge";
import { AnimatedNumber } from "@invite-me/ui/components/motion/animated-number";
import { BottomSheet } from "@invite-me/ui/components/motion/bottom-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@invite-me/ui/components/motion/tabs";
import { CalendarPlus, Compass, Info, MapPin, Minus, Phone, Plus, Share2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { downloadCalendar, mapsLinkFor } from "./calendar";
import "./stage.css";
import { Tour, type TourStep, useFirstVisit } from "./tour";
import type { GuestPageProps, RsvpAnswer } from "./types";
import { VenueMap } from "./venue-map";

const BADGE: Record<string, { status: "neutral" | "success" | "warning" | "danger"; label: string }> = {
  pending: { status: "neutral", label: "No reply yet" },
  yes: { status: "success", label: "You're coming" },
  maybe: { status: "warning", label: "Maybe" },
  no: { status: "danger", label: "Can't come" },
};

/** Days left, counted up by a rolling number. Computed after mount so server and client agree. */
function DaysToGo({ iso }: { iso: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const ms = new Date(`${iso}T00:00:00`).getTime() - Date.now();
    setDays(Number.isFinite(ms) ? Math.ceil(ms / 86_400_000) : null);
  }, [iso]);
  if (days === null || days < 0) return <p className="stage-big">The celebration is here</p>;
  if (days === 0) return <p className="stage-big">Today</p>;
  return (
    <p className="stage-count-down">
      <AnimatedNumber value={days} /> <span>{days === 1 ? "day" : "days"} to go</span>
    </p>
  );
}

async function shareInvitation(card: Card, name: string) {
  const data = { title: `${card.name1} & ${card.name2}`, text: `${name}, you're invited.`, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else await navigator.clipboard.writeText(window.location.href);
  } catch {
    // the guest closed the share sheet
  }
}

const ANSWERS: { status: RsvpAnswer; label: string }[] = [
  { status: "yes", label: "Yes, we'll come" },
  { status: "maybe", label: "Not sure yet" },
  { status: "no", label: "Can't make it" },
];

const THANKS: Record<string, string> = {
  yes: "Thank you. We can't wait to celebrate with you.",
  maybe: "Thank you. Please tell us when you know.",
  no: "You'll be missed. Thank you for letting us know.",
};

const CTA: Record<string, string> = {
  pending: "Will you attend?",
  yes: "You're coming. Change",
  maybe: "Maybe. Change",
  no: "Can't come. Change",
};

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export type StageProps = GuestPageProps & {
  /** CSS class that sets the `--st-*` colours for this design and look. */
  toneClass: string;
  /** The card artwork. It fills the stage above the floating buttons. */
  children: ReactNode;
  /** Extra controls for the info sheet (for example a music switch). */
  infoExtra?: ReactNode;
  /** Controls floating in the corner (for example a music button). */
  corner?: ReactNode;
};

/**
 * One screen, never scrolled. The preset draws the card; this frame adds the floating
 * "Will you attend?" button, an info drawer, and a first-visit guide. `lite` leaves out
 * everything heavy so previews paint immediately.
 */
export function GuestStage({
  card,
  party,
  answer,
  pending,
  onAnswer,
  lite = false,
  toneClass,
  children,
  infoExtra,
  corner,
}: StageProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [headCount, setHeadCount] = useState(party.seats);
  const first = useFirstVisit(!lite);
  const [touring, setTouring] = useState(false);
  const date = cardDateParts(card.date);

  // The guide opens itself once for a new guest, after the card has drawn in.
  useEffect(() => {
    if (!first.isFirst) return;
    const id = window.setTimeout(() => setTouring(true), 1400);
    return () => window.clearTimeout(id);
  }, [first.isFirst]);

  const finishTour = useCallback(() => {
    setTouring(false);
    first.markSeen();
  }, [first]);

  const steps: TourStep[] = [
    {
      target: "card",
      title: "Your invitation",
      body: `This card was made for ${party.displayName}. It fits your screen. Turn your phone sideways and it rearranges itself.`,
    },
    {
      target: "rsvp",
      title: "Let the hosts know",
      body: "Tap here to say if you are coming. You can change your answer any time.",
    },
    {
      target: "more",
      title: "Everything else",
      body: "The date and time, a map, your seat, and a number to call are all in here.",
    },
  ];

  return (
    <div className={`stage ${toneClass} ${lite ? "is-lite" : ""}`}>
      <div className="stage-art" data-tour="card">
        {children}
      </div>
      {corner}

      <div className="stage-bar" hidden={lite}>
        <Button className="stage-cta" data-tour="rsvp" onClick={() => setRsvpOpen(true)}>
          {CTA[answer] ?? CTA.pending}
        </Button>
        <Button className="stage-more" data-tour="more" aria-label="More information" onClick={() => setInfoOpen(true)}>
          <Info className="size-6" aria-hidden />
        </Button>
      </div>

      <BottomSheet open={rsvpOpen} onOpenChange={setRsvpOpen} snapPoints={["auto"]} title="Will you attend?" className={`stage-sheet ${toneClass}`}>
        <div className="stage-sheet-body">
          <p className="stage-muted">{THANKS[answer] ?? "Kindly let the hosts know."}</p>
          {party.seats > 1 ? (
            <div className="stage-count" role="group" aria-label="How many of you are coming">
              <span className="stage-label">Coming</span>
              <Button className="stage-round" aria-label="One fewer" disabled={headCount <= 1} onClick={() => setHeadCount((n) => Math.max(1, n - 1))}>
                <Minus className="size-5" aria-hidden />
              </Button>
              <output key={headCount} aria-live="polite">
                {headCount}
              </output>
              <Button className="stage-round" aria-label="One more" disabled={headCount >= party.seats} onClick={() => setHeadCount((n) => Math.min(party.seats, n + 1))}>
                <Plus className="size-5" aria-hidden />
              </Button>
              <span className="stage-label">of {party.seats}</span>
            </div>
          ) : null}
          <div className="stage-answers">
            {ANSWERS.map(({ status, label }) => (
              <StatefulButton
                key={status}
                className="stage-answer"
                aria-pressed={answer === status}
                state={pending === status ? "loading" : "idle"}
                loadingText="Saving"
                disabled={pending !== undefined}
                onClick={() => onAnswer(status, headCount)}
              >
                {label}
              </StatefulButton>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={infoOpen} onOpenChange={setInfoOpen} snapPoints={[0.7, 0.95]} title="The details" className={`stage-sheet ${toneClass}`}>
        <div className="stage-sheet-body">
          <header className="stage-head">
            <DaysToGo iso={card.date} />
            <AnimatedBadge status={BADGE[answer]?.status ?? "neutral"} contentKey={answer}>
              {BADGE[answer]?.label ?? "No reply yet"}
            </AnimatedBadge>
          </header>

          <Tabs variant="pill" defaultValue="details">
            <TabsList aria-label="Invitation details" className="w-full [&_[role=tab]]:flex-1 [&_[role=tab]]:justify-center">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="stage-tab">
                <section className="stage-block">
                  <p className="stage-label">When</p>
                  <p className="stage-big">
                    {titleCase(date.weekday)}, {date.day} {titleCase(date.month)} {date.year}
                  </p>
                  <p>
                    {timeRange(card)}
                  </p>
                </section>
                <section className="stage-block">
                  <p className="stage-label">Where</p>
                  <p className="stage-big">{titleCase(card.venueName)}</p>
                  <p className="stage-muted">{titleCase(card.city)}</p>
                  {!lite && card.venueGeo ? (
                    <VenueMap lat={card.venueGeo.lat} lng={card.venueGeo.lng} label={`${card.venueName}, ${card.city}`} />
                  ) : null}
                  <div className="stage-actions">
                    <ButtonLink className="stage-action is-primary" href={mapsLinkFor(card)} target="_blank" rel="noopener noreferrer">
                      <MapPin className="size-5" aria-hidden /> Open in Google Maps
                    </ButtonLink>
                    <Button className="stage-action" onClick={() => downloadCalendar(card)}>
                      <CalendarPlus className="size-5" aria-hidden /> Add to calendar
                    </Button>
                  </div>
                </section>
                {party.seatLabel || card.rules || party.rules ? (
                  <section className="stage-block">
                    {party.seatLabel ? (
                      <p>
                        <span className="stage-label">Your seat</span>
                        <br />
                        {party.seatLabel}
                      </p>
                    ) : null}
                    {card.rules ? <p>{card.rules}</p> : null}
                    {party.rules ? <p>{party.rules}</p> : null}
                  </section>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <ol className="stage-tab stage-timeline">
                {card.subEvents.map((s, i) => (
                  <li key={i}>
                    <time>{s.time}</time>
                    <span>{titleCase(s.label)}</span>
                  </li>
                ))}
                <li>
                  <time>{card.timeFrom}</time>
                  <span>Celebration begins at {titleCase(card.venueName)}</span>
                </li>
                {card.timeTo.trim() ? (
                  <li>
                    <time>{card.timeTo}</time>
                    <span>Celebration ends</span>
                  </li>
                ) : null}
              </ol>
            </TabsContent>

            <TabsContent value="contact">
              <div className="stage-tab">
                <section className="stage-block">
                  <p className="stage-label">Questions about the day</p>
                  <div className="stage-actions">
                    {card.rsvpContacts.map((c, i) => (
                      <ButtonLink key={i} className="stage-action is-primary" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                        <Phone className="size-5" aria-hidden /> Call {titleCase(c.name)}
                      </ButtonLink>
                    ))}
                  </div>
                </section>
                {lite ? null : (
                  <div className="stage-actions">
                    <Button className="stage-action" onClick={() => void shareInvitation(card, party.displayName)}>
                      <Share2 className="size-5" aria-hidden /> Share this invitation
                    </Button>
                    {infoExtra}
                    <Button
                      className="stage-action"
                      onClick={() => {
                        setInfoOpen(false);
                        setTouring(true);
                      }}
                    >
                      <Compass className="size-5" aria-hidden /> Show me around again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </BottomSheet>

      {touring ? <Tour steps={steps} toneClass={toneClass} onDone={finishTour} /> : null}
    </div>
  );
}
