import { Button } from "@invite-me/ui/components/motion/button/base";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { GuestAvatar } from "@/components/guest-avatar";
import { toast } from "@/components/toaster";
import { orpc } from "@/utils/orpc";

type SharedParty = { id: string; displayName: string; guestPath: string };

/** A guest's personal link, as text, a QR code to scan from a phone, and the system share sheet. */
export function GuestShare({
  party,
  note = "Send them their link or let them scan.",
  onDone,
  onAnother,
  split = false,
}: {
  party: SharedParty;
  note?: string;
  onDone?: () => void;
  onAnother?: () => void;
  /** From `md` up, put the QR beside the link and buttons instead of above them. */
  split?: boolean;
}) {
  const queryClient = useQueryClient();
  const url = `${window.location.origin}${party.guestPath}`;
  const [qr, setQr] = useState<string>();
  const canShare = typeof navigator.share === "function";

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: "#2a1d17", light: "#00000000" } })
      .then((data) => live && setQr(data))
      .catch(() => live && setQr(undefined));
    return () => {
      live = false;
    };
  }, [url]);

  // Handing the link out is what "shared" means for the host's meter.
  const markShared = useMutation(
    orpc.parties.markShared.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.parties.list.key() }),
    }),
  );

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
    markShared.mutate({ id: party.id });
  }

  async function share() {
    try {
      await navigator.share({ title: `Invitation for ${party.displayName}`, url });
      markShared.mutate({ id: party.id });
    } catch {
      // Closing the share sheet is not an error.
    }
  }

  return (
    <div
      className={`grid gap-6 rounded-2xl border border-border bg-card p-5 sm:p-6 ${split ? "md:grid-cols-[15rem_minmax(0,1fr)] md:gap-x-8" : ""}`}
    >
      <div className="col-span-full flex items-center gap-3">
        <GuestAvatar seed={party.id} size={44} />
        <div className="min-w-0">
          <p className="truncate font-display text-xl">{party.displayName}</p>
          <p className="text-sm text-muted-foreground">{note}</p>
        </div>
      </div>

      <div className="mx-auto grid size-56 place-items-center rounded-lg bg-background ring-1 ring-border">
        {qr ? (
          <img src={qr} alt={`QR code for ${party.displayName}'s invitation`} className="size-52" />
        ) : (
          <span className="text-sm text-muted-foreground">Making QR…</span>
        )}
      </div>
      <div className="grid content-start gap-6">
        <div className="grid gap-1.5">
          <label htmlFor="guest-link" className="text-[0.8125rem] font-medium">
            Personal link
          </label>
          <input
            id="guest-link"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className={canShare ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
          <Button size="lg" onClick={copy}>
            <Copy className="size-4" aria-hidden />
            Copy link
          </Button>
          {canShare ? (
            <Button size="lg" variant="outline" className="border-foreground/25" onClick={share}>
              <Share2 className="size-4" aria-hidden />
              Share
            </Button>
          ) : null}
        </div>
      </div>

      {onDone && onAnother ? (
        <div className="col-span-full flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button variant="ghost" onClick={onAnother}>
            Add another
          </Button>
          <Button variant="secondary" onClick={onDone}>
            Done
          </Button>
        </div>
      ) : null}
    </div>
  );
}
