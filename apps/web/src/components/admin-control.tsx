import { Button } from "@invite-me/ui/components/motion/button/base";
import { Checkbox } from "@invite-me/ui/components/motion/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@invite-me/ui/components/motion/dialog";
import { Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { toast } from "@/components/toaster";
import { orpc } from "@/utils/orpc";

/** The admin invite URL for an event: `/admin/invite/<eventId>/<secret>`. */
async function adminUrl(eventId: string): Promise<string> {
  const link = await orpc.invitations.adminLinks.call({ id: eventId });
  return `${window.location.origin}/admin/invite/${eventId}/${link.secret}`;
}

/** QR code for a URL, cached per URL. */
function useQr(url: string | undefined): string | undefined {
  const [qr, setQr] = useState<string>();
  useEffect(() => {
    if (!url) return;
    let live = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 480,
      color: { dark: "#2a1d17", light: "#00000000" },
    })
      .then((data) => live && setQr(data))
      .catch(() => live && setQr(undefined));
    return () => {
      live = false;
    };
  }, [url]);
  return qr;
}

/** The link itself: QR code, read-only input, copy and system-share buttons. */
function InviteControlContent({ eventId }: { eventId: string }) {
  const [url, setUrl] = useState("");
  const qr = useQr(url);
  const canShare = typeof navigator.share === "function";

  useEffect(() => {
    let live = true;
    adminUrl(eventId)
      .then((u) => live && setUrl(u))
      .catch(() => live && setUrl(""));
    return () => {
      live = false;
    };
  }, [eventId]);

  const link = url;
  if (!link) return null;

  async function copy() {
    await navigator.clipboard.writeText(link);
    toast.success("Admin link copied");
  }

  async function share() {
    await navigator.share({ title: "Admin link for this invitation", url: link });
  }

  return (
    <>
      <div className="mx-auto grid size-56 place-items-center rounded-lg bg-background ring-1 ring-border">
        {qr ? <img src={qr} alt="QR code for the admin link" className="size-52" /> : null}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="admin-link" className="text-[0.8125rem] font-medium">
          Admin link
        </label>
        <input
          id="admin-link"
          readOnly
          value={link}
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
    </>
  );
}

/** The planner-facing section: invite husband and wife through the link. */
export function AdminControl({ eventId }: { eventId: string }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-[0.8125rem] font-medium">Invite husband and wife</p>
      <p className="text-sm text-muted-foreground">
        They open this link and sign in — the invitation becomes theirs to manage with you.
      </p>
      <InviteControlContent eventId={eventId} />
    </section>
  );
}

/** Spouse/fiance invite for non-planners: opens a modal with the same link. */
export function InviteSpouseButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="lg"
        variant="outline"
        className="border-foreground/25"
        onClick={() => setOpen(true)}
      >
        Invite spouse or fiancé
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid gap-5 sm:gap-6">
          <div>
            <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
              Invite spouse or fiancé
            </DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground">
              They open this link and sign in — the invitation becomes theirs to manage with you.
            </DialogDescription>
          </div>
          <InviteControlContent eventId={eventId} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export { Checkbox };
