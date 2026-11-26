import { useQuery } from "@tanstack/react-query";
import { Download, Printer, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { PrintStyle, SIZES, Sheet, SheetPreview, layoutFor, type PrintPayload, type SizeId } from "@/components/print-sheet";
import { toast } from "@/components/toaster";
import { Button, Dialog, DialogContent, EmptyState, Field, SegmentedControl, Select, Skeleton, Switch } from "@/components/ui";
import { ENV } from "@/env.public";
import type { GuestPartyView } from "@/presets/types";
import { orpc } from "@/utils/orpc";

const SIZE_OPTIONS = (Object.keys(SIZES) as SizeId[]).map((s) => ({ value: s, label: s.toUpperCase() }));
const DIRECTION_OPTIONS = [
  { value: "portrait", label: "Portrait", icon: <RectangleVertical className="size-5" aria-hidden /> },
  { value: "landscape", label: "Landscape", icon: <RectangleHorizontal className="size-5" aria-hidden /> },
];

/** Print or save the invitation as a PDF: pick whose card, the paper, and see the real paper shape. */
export function PrintDialog({
  invitationId,
  open,
  onOpenChange,
  guestId,
}: {
  invitationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestId?: string;
}) {
  const invitation = useQuery({ ...orpc.invitations.get.queryOptions({ input: { id: invitationId } }), enabled: open });
  const guests = useQuery({ ...orpc.parties.list.queryOptions({ input: { eventId: invitationId } }), enabled: open });
  const [size, setSize] = useState<SizeId>("a5");
  const [landscape, setLandscape] = useState(false);
  const [marks, setMarks] = useState(false);
  const [who, setWho] = useState<string>(guestId ?? "blank");
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (open) setWho(guestId ?? "blank");
  }, [open, guestId]);

  const card = invitation.data?.card;
  const people = guests.data;
  const sheets = useMemo<(GuestPartyView | null)[]>(() => {
    const list = people ?? [];
    const chosen = who === "all" ? list : list.filter((p) => p.id === who);
    if (who === "blank" || chosen.length === 0) return [null];
    return chosen.map((p) => ({ displayName: p.displayName, ageGroup: p.ageGroup, seats: p.seats, seatLabel: p.seatLabel, rules: p.rules }));
  }, [people, who]);

  const layout = layoutFor({ size, landscape, marks });

  const options = [
    { value: "blank", label: "Blank template" },
    ...(people && people.length > 0
      ? [{ value: "all", label: "All guests, one page each" }, ...people.map((p) => ({ value: p.id, label: p.displayName }))]
      : []),
  ];
  const selectValue = options.some((o) => o.value === who) ? who : "blank";

  async function download() {
    if (!card) return;
    setBusy(true);
    try {
      const res = await fetch(`${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/api/print-pdf`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, landscape, marks, card, parties: sheets } satisfies PrintPayload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `The server answered ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.name1}-${card.name2}-${size}.pdf`.replace(/\s+/g, "-");
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your PDF is ready");
    } catch (error) {
      toast.error("Could not make the PDF", { description: error instanceof Error ? error.message : "Try Print instead." });
    } finally {
      setBusy(false);
    }
  }

  // Browser printing: mount the real-size sheets, let the artwork draw, print, then remove them.
  function printHere() {
    setPrinting(true);
    window.setTimeout(() => window.print(), 1800);
  }
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, [printing]);

  const ready = Boolean(card);
  const footer = (
    <>
      <Button variant="secondary" disabled={!ready || printing} loading={printing} onClick={printHere} icon={<Printer className="size-5" aria-hidden />}>
        Print
      </Button>
      <Button loading={busy} disabled={!ready} onClick={() => void download()} icon={<Download className="size-5" aria-hidden />}>
        Download PDF
      </Button>
    </>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          title="Print or save as PDF"
          description="Fonts and colours are kept exactly as you see them."
          size="xl"
          footer={footer}
        >
          {invitation.isError ? (
            <EmptyState title="We can't open that invitation" description="It may have been deleted." action={<Button variant="secondary" onClick={() => void invitation.refetch()}>Retry</Button>} />
          ) : !card ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
              <div className="grid gap-5">
                <Field
                  label="Whose card"
                  description={
                    guests.isError
                      ? "We couldn't load your guests. You can still print a blank template."
                      : people && people.length === 0
                        ? "Add guests to print a card with their name. A blank template leaves a line to write the name by hand."
                        : "A blank template leaves a line to write the name by hand."
                  }
                >
                  <Select value={selectValue} onValueChange={setWho} options={options} aria-label="Whose card" />
                </Field>
                <Field label="Paper size" description={`${SIZES[size].w} × ${SIZES[size].h} mm`}>
                  <SegmentedControl aria-label="Paper size" value={size} onValueChange={(v) => setSize(v as SizeId)} options={SIZE_OPTIONS} />
                </Field>
                <Field label="Direction">
                  <SegmentedControl aria-label="Direction" value={landscape ? "landscape" : "portrait"} onValueChange={(v) => setLandscape(v === "landscape")} options={DIRECTION_OPTIONS} />
                </Field>
                <Switch checked={marks} onCheckedChange={setMarks} label="Bleed and crop marks" description="For print shops: 3 mm of colour past the edge and cut marks." />
              </div>
              <div className="grid justify-items-center gap-2">
                <SheetPreview card={card} party={sheets[0] ?? null} {...layout} marks={marks} />
                <p className="text-label text-text-muted">
                  {SIZES[size].label} · {landscape ? "Landscape" : "Portrait"}
                </p>
                {sheets.length > 1 ? <p className="text-label text-text-muted">Showing the first of {sheets.length} pages</p> : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {printing && card
        ? createPortal(
            <div data-print-root className="hidden print:block">
              <PrintStyle pageW={layout.pageW} pageH={layout.pageH} />
              <style>{`@media print { body > *:not([data-print-root]) { display: none !important; } }`}</style>
              {sheets.map((party, i) => (
                <Sheet key={party?.displayName ?? `blank-${i}`} card={card} party={party} last={i === sheets.length - 1} {...layout} marks={marks} fit={1} />
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
