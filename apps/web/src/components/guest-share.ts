import type { PartyView } from "@invite-me/api/invites/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/toaster";
import { orpc } from "@/utils/orpc";

export function guestLink(party: Pick<PartyView, "guestPath">) {
  return `${window.location.origin}${party.guestPath}`;
}

export function shareText(party: Pick<PartyView, "displayName">, link: string) {
  return `Dear ${party.displayName}, you are invited. Your private invitation: ${link}`;
}

export function whatsappUrl(party: Pick<PartyView, "displayName">, link: string) {
  return `https://wa.me/?text=${encodeURIComponent(shareText(party, link))}`;
}

export const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** Copy and share actions for a guest link. Copying or sharing marks the guest as "shared". */
export function useGuestShare(eventId: string) {
  const queryClient = useQueryClient();
  const markShared = useMutation(
    orpc.parties.markShared.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey({ input: { eventId } }) }),
    }),
  );
  function noteShared(party: PartyView) {
    if (!party.shared && !party.revoked) markShared.mutate({ id: party.id });
  }
  async function copy(party: PartyView) {
    try {
      await navigator.clipboard.writeText(guestLink(party));
      toast.success("Link copied");
      noteShared(party);
    } catch {
      toast.error("Couldn't copy the link", { description: "Press and hold the link to copy it." });
    }
  }
  async function share(party: PartyView) {
    const link = guestLink(party);
    try {
      await navigator.share({ title: "Invitation", text: shareText(party, link), url: link });
      noteShared(party);
    } catch (error) {
      // Closing the share sheet is not an error.
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error("Couldn't open sharing");
    }
  }
  function openWhatsapp(party: PartyView) {
    window.open(whatsappUrl(party, guestLink(party)), "_blank", "noopener");
    noteShared(party);
  }
  return { copy, share, openWhatsapp };
}
