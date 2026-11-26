import type { PartyView } from "@invite-me/api/invites/store";
import { CheckCircle2, Eye, HelpCircle, Info, Link2Off, Mail, Send, XCircle, type LucideIcon } from "lucide-react";

import { Badge, type BadgeTone, Popover, PopoverContent, PopoverTrigger } from "@/components/ui";

/**
 * One status per guest party, mutually exclusive, derived from what the API tracks:
 * `revoked`, `rsvp`, `opens` (link opened at least once) and `shared` (host copied or shared the link).
 * An opened link wins over "not shared": the guest clearly has the link.
 */
export type GuestStatus = "confirmed" | "maybe" | "declined" | "awaiting" | "not-opened" | "not-shared" | "revoked";

export const STATUS_ORDER: readonly GuestStatus[] = ["confirmed", "maybe", "declined", "awaiting", "not-opened", "not-shared"];

export const STATUS: Record<GuestStatus, { label: string; tone: BadgeTone; icon: LucideIcon; meaning: string }> = {
  confirmed: { label: "Confirmed", tone: "success", icon: CheckCircle2, meaning: "They replied yes and told you how many are coming." },
  maybe: { label: "Maybe", tone: "warning", icon: HelpCircle, meaning: "They replied that they might come." },
  declined: { label: "Declined", tone: "danger", icon: XCircle, meaning: "They replied that they can't come." },
  awaiting: { label: "Awaiting reply", tone: "info", icon: Eye, meaning: "They opened the invitation but have not answered yet." },
  "not-opened": { label: "Not opened", tone: "neutral", icon: Mail, meaning: "You shared the link, but they have not opened it yet." },
  "not-shared": { label: "Not shared", tone: "neutral", icon: Send, meaning: "You have not copied or shared their link yet, and it has not been opened." },
  revoked: { label: "Link revoked", tone: "danger", icon: Link2Off, meaning: "Their link no longer works." },
};

export function guestStatus(party: PartyView): GuestStatus {
  if (party.revoked) return "revoked";
  if (party.rsvp === "yes") return "confirmed";
  if (party.rsvp === "maybe") return "maybe";
  if (party.rsvp === "no") return "declined";
  if (party.opens > 0) return "awaiting";
  return party.shared ? "not-opened" : "not-shared";
}

export function StatusBadge({ status }: { status: GuestStatus }) {
  const s = STATUS[status];
  return (
    <Badge tone={s.tone} icon={s.icon}>
      {s.label}
    </Badge>
  );
}

/** Touch-friendly definitions: a popover opened by tap, not a hover tooltip. */
export function StatusHelp() {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex min-h-11 items-center gap-2 rounded-pill px-2 font-medium text-text-muted outline-none hover:text-text">
        <Info className="size-5" aria-hidden />
        What do these mean?
      </PopoverTrigger>
      <PopoverContent title="Guest statuses" align="start" className="w-[min(calc(100vw-2rem),26rem)]">
        <dl className="grid gap-3">
          {STATUS_ORDER.map((key) => (
            <div key={key} className="grid justify-items-start gap-1">
              <dt>
                <StatusBadge status={key} />
              </dt>
              <dd className="text-label text-text-muted">{STATUS[key].meaning}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
