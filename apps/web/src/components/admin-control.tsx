import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { toast } from "@/components/toaster";
import { orpc } from "@/utils/orpc";

/** "Invite husband/wife": shows the admin invite link, a QR code, and copy/share. */
export function AdminControl({ eventId }: { eventId: string }) {
  const link = useQuery(orpc.invitations.adminLinks.queryOptions({ input: { id: eventId } }));
  const [qr, setQr] = useState<string>();
  const canShare = typeof navigator.share === "function";
  const url = link.data ? `${window.location.origin}/admin/invite/${eventId}/${link.data.secret}` : "";

  useEffect(() => {
    if (!url) return;
    let live = true;
    QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: "#2a1d17", light: "#00000000" } })
      .then((data) => live && setQr(data))
      .catch(() => live && setQr(undefined));
    return () => {
      live = false;
    };
  }, [url]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success("Admin link copied");
  }

  async function share() {
    await navigator.share({ title: "Admin link for this invitation", url });
  }

  if (!link.data) return null;

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-[0.8125rem] font-medium">Invite husband and wife</p>
      <p className="text-sm text-muted-foreground">
        They open this link and sign in — the invitation becomes theirs to manage with you.
      </p>
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
    </section>
  );
}
