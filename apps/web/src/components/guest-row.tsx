import type { PartyView } from "@invite-me/api/invites/store";
import { Copy, Link2, MoreVertical, Printer, Share2, UserX } from "lucide-react";

import { AgeAvatar } from "@/components/age-figure";
import { guestStatus, StatusBadge } from "@/components/guest-status";
import { canNativeShare } from "@/components/guest-share";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, buttonStyles } from "@/components/ui";

const ICON_BUTTON = buttonStyles({ variant: "ghost", size: "icon" });

export type GuestActions = {
  copy: (party: PartyView) => void;
  share: (party: PartyView) => void;
  whatsapp: (party: PartyView) => void;
  showLink: (party: PartyView) => void;
  print: (party: PartyView) => void;
  revoke: (party: PartyView) => void;
};

/** One guest: avatar, name, seats, label, status and the actions for their link. Never shows the raw URL. */
export function GuestRow({ party, actions }: { party: PartyView; actions: GuestActions }) {
  const status = guestStatus(party);
  const meta = [`${party.seats} seat${party.seats === 1 ? "" : "s"}`, party.seatLabel].filter(Boolean).join(" · ");
  return (
    <li className="grid gap-3 rounded-2xl border border-border bg-surface-raised p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <AgeAvatar group={party.ageGroup ?? "adult"} name={party.displayName} className="size-12" />
        <div className="min-w-0">
          <p className="break-words font-medium">{party.displayName}</p>
          <p className="break-words text-label text-text-muted">{meta}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <StatusBadge status={status} />
        {party.revoked ? null : (
          <div className="flex items-center">
            <button type="button" className={ICON_BUTTON} aria-label={`Copy link for ${party.displayName}`} onClick={() => actions.copy(party)}>
              <Copy className="size-5" aria-hidden />
            </button>
            {canNativeShare() ? (
              <button type="button" className={ICON_BUTTON} aria-label={`Share link with ${party.displayName}`} onClick={() => actions.share(party)}>
                <Share2 className="size-5" aria-hidden />
              </button>
            ) : (
              <Menu>
                <MenuTrigger className={ICON_BUTTON} aria-label={`Share link with ${party.displayName}`}>
                  <Share2 className="size-5" aria-hidden />
                </MenuTrigger>
                <MenuContent>
                  <MenuItem onClick={() => actions.whatsapp(party)}>Share on WhatsApp</MenuItem>
                  <MenuItem onClick={() => actions.copy(party)}>Copy link</MenuItem>
                </MenuContent>
              </Menu>
            )}
            <Menu>
              <MenuTrigger className={ICON_BUTTON} aria-label={`More actions for ${party.displayName}`}>
                <MoreVertical className="size-5" aria-hidden />
              </MenuTrigger>
              <MenuContent>
                <MenuItem onClick={() => actions.showLink(party)}>
                  <Link2 className="size-5" aria-hidden /> Show link
                </MenuItem>
                <MenuItem onClick={() => actions.print(party)}>
                  <Printer className="size-5" aria-hidden /> Print card
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onClick={() => actions.revoke(party)}>
                  <UserX className="size-5" aria-hidden /> Revoke link
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        )}
      </div>
    </li>
  );
}
