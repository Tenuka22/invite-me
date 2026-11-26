import type { Card } from "@invite-me/api/invites/card";
import { cardDateParts } from "@invite-me/api/invites/card";
import { cn } from "@invite-me/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui";
import type { GuestPartyView } from "@/presets/types";

/** Title the host sees for an invitation: the couple's names. */
export function invitationTitle(card: Card) {
  return `${titleCase(card.name1)} & ${titleCase(card.name2)}`;
}

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function invitationDate(card: Card) {
  const d = cardDateParts(card.date);
  return `${titleCase(d.weekday)}, ${d.day} ${titleCase(d.month)} ${d.year}`;
}

/** The viewport the artwork is laid out in, in CSS px. Every size of the card is this, scaled. */
const REFERENCE_WIDTH = 390;
/** Width over height of the standard card: a tall phone screen. Print uses the paper's own ratio. */
export const CARD_ASPECT = 9 / 16;

/**
 * THE invitation card. Thumbnails, the edit preview, the print preview and the full-preview dialog
 * all render this, so they can never disagree: it shows the design's own artwork (the guest page,
 * without buttons or motion) laid out once at a reference size and scaled with a CSS transform.
 *
 * The artwork sizes itself from its viewport, so it runs in an iframe whose size is the reference
 * size. Off-screen cards are not mounted until they scroll near, which keeps long lists light.
 */
export function InvitationCard({
  card,
  party = null,
  aspect = CARD_ASPECT,
  mode = "view",
  label,
  className,
}: {
  card: Card;
  party?: GuestPartyView | null;
  /** Width over height. Leave it for the standard card; pass the paper ratio for print. */
  aspect?: number;
  /** `print` leaves a blank "Invited" line to write on when no guest is given. */
  mode?: "view" | "print";
  /** Accessible description; defaults to the couple's names. */
  label?: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const height = REFERENCE_WIDTH / aspect;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / REFERENCE_WIDTH);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const seen = new IntersectionObserver(([entry]) => entry?.isIntersecting && setNear(true), { rootMargin: "300px" });
    seen.observe(el);
    return () => {
      resize.disconnect();
      seen.disconnect();
    };
  }, []);

  // The artwork asks for its content when it has booted; answer, and again whenever the card changes.
  useEffect(() => {
    if (!near) return;
    const send = () => frame.current?.contentWindow?.postMessage({ type: "invite-preview", card, party }, window.location.origin);
    const onReady = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.type !== "invite-preview-ready") return;
      send();
      setReady(true);
    };
    window.addEventListener("message", onReady);
    send();
    return () => window.removeEventListener("message", onReady);
  }, [near, card, party]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={label ?? `Invitation card for ${invitationTitle(card)}`}
      className={cn("relative w-full overflow-hidden bg-muted", className)}
      style={{ aspectRatio: String(aspect) }}
    >
      {ready ? null : <Skeleton className="absolute inset-0 rounded-none" />}
      {near ? (
        <iframe
          ref={frame}
          key={`${card.preset}-${mode}-${aspect}`}
          title=""
          aria-hidden
          tabIndex={-1}
          src={`/preview/${card.preset}?${mode === "print" ? "print=1" : "lite=1"}`}
          className={cn("pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-(--duration-base)", ready ? "opacity-100" : "opacity-0")}
          style={{ width: REFERENCE_WIDTH, height, transform: `scale(${scale})` }}
        />
      ) : null}
    </div>
  );
}
