import type { Card } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@invite-me/ui/components/motion/select";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { OPTION_ROW } from "@/components/card-fields";
import type { GuestPartyView } from "@/presets/types";
import { PageTitle } from "@/components/host-shell";
import { NotFound } from "@/components/not-found";
import { Skeleton } from "@/components/skeletons";
import { orpc } from "@/utils/orpc";
import { ENV } from "@/env.public";
import { toast } from "@/components/toaster";
import { PX_PER_MM, PrintStyle, SIZES, Sheet, layoutFor, type PrintPayload, type SizeId } from "@/components/print-sheet";

export const Route = createFileRoute("/_auth/invitations/$id/print")({
  validateSearch: z.object({ guest: z.string().optional() }),
  component: PrintPage,
});


function PrintPage() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  const [size, setSize] = useState<SizeId>("a5");
  const [landscape, setLandscape] = useState(false);
  const [marks, setMarks] = useState(false);
  const [busy, setBusy] = useState(false);

  const { pageW, pageH, artW, artH, inset } = layoutFor({ size, landscape, marks });
  // Show the sheet at a size that fits the screen; printing always uses real millimetres.
  const holder = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.6);
  useEffect(() => {
    const measure = () => {
      const width = holder.current?.clientWidth ?? 600;
      setFit(Math.min(1, (width - 8) / (pageW * PX_PER_MM)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pageW]);

  const card = invitation.data?.card;
  const guests = useQuery(orpc.parties.list.queryOptions({ input: { eventId: id } }));
  const initial = Route.useSearch().guest;
  const [who, setWho] = useState<string>(initial ?? "blank");
  const people = guests.data ?? [];
  const chosen = who === "all" ? people : people.filter((p) => p.id === who);
  const sheets: (GuestPartyView | null)[] =
    who === "blank" || (who !== "all" && chosen.length === 0)
      ? [null]
      : chosen.map((p) => ({ displayName: p.displayName, ageGroup: p.ageGroup, seats: p.seats, seatLabel: p.seatLabel, rules: p.rules }));

  if (invitation.isError) {
    return <NotFound inline title="We can't find that invitation" description="It may have been deleted, or the link is wrong." />;
  }
  if (!card) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[60svh] w-full max-w-md" />
      </div>
    );
  }

  async function download(current: Card) {
    setBusy(true);
    try {
      const res = await fetch(`${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/api/print-pdf`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, landscape, marks, card: current, parties: sheets } satisfies PrintPayload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `The server answered ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${current.name1}-${current.name2}-${size}.pdf`.replace(/\s+/g, "-");
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Could not make the PDF", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 print:block">
      <PrintStyle pageW={pageW} pageH={pageH} />

      <div className="grid gap-8 print:block">
        <div className="print:hidden">
        <PageTitle
          back={{ to: "/invitations/$id", params: { id } }}
          title="Print or save as PDF"
          sub="Print it at home or take the file to a print shop. Fonts and colours are kept exactly as on screen."
        />
        </div>
        <div className="grid gap-8 print:block lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
          <div className="grid gap-6 print:hidden">
            <fieldset className="grid gap-3">
              <legend className="mb-1 text-xl font-[Fraunces_Variable,Fraunces,Georgia,serif]">Whose card</legend>
              <Select value={who} onValueChange={setWho}>
                <SelectTrigger className="h-auto min-h-14 justify-between !rounded-full border-foreground/25 bg-card px-5 py-2 text-left text-lg">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank template, no guest</SelectItem>
                  <SelectItem value="all">All guests, one page each</SelectItem>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-base text-muted-foreground">
                A blank template leaves an empty line after "Invited" to write the name by hand.
              </p>
            </fieldset>
            <fieldset className="grid gap-3">
              <legend className="mb-1 text-xl font-[Fraunces_Variable,Fraunces,Georgia,serif]">Paper size</legend>
              <RadioGroup aria-label="Paper size" value={size} onValueChange={(v) => setSize(v as SizeId)} className="gap-3">
                {(Object.keys(SIZES) as SizeId[]).map((s) => (
                  <RadioGroupItem
                    key={s}
                    value={s}
                    label={SIZES[s].label}
                    description={`${SIZES[s].w} × ${SIZES[s].h} mm`}
                    className={OPTION_ROW}
                  />
                ))}
              </RadioGroup>
            </fieldset>
            <fieldset className="grid gap-3">
              <legend className="mb-1 text-xl font-[Fraunces_Variable,Fraunces,Georgia,serif]">Direction</legend>
              <RadioGroup
                aria-label="Direction"
                value={landscape ? "landscape" : "portrait"}
                onValueChange={(v) => setLandscape(v === "landscape")}
                className="gap-3"
              >
                <RadioGroupItem value="portrait" label="Portrait" description="Tall, like a card" className={OPTION_ROW} />
                <RadioGroupItem value="landscape" label="Landscape" description="Wide, laid out left to right" className={OPTION_ROW} />
              </RadioGroup>
            </fieldset>
            <fieldset className="grid gap-3">
              <legend className="mb-1 text-xl font-[Fraunces_Variable,Fraunces,Georgia,serif]">For a print shop</legend>
              <RadioGroup aria-label="Print shop marks" value={marks ? "marks" : "plain"} onValueChange={(v) => setMarks(v === "marks")} className="gap-3">
                <RadioGroupItem value="plain" label="Plain" description="Exact size, nothing extra" className={OPTION_ROW} />
                <RadioGroupItem
                  value="marks"
                  label="Bleed and crop marks"
                  description="3 mm of colour past the edge and cut marks, the way printers ask for it"
                  className={OPTION_ROW}
                />
              </RadioGroup>
            </fieldset>
            <Button size="lg" className="btn-xl" onClick={() => void download(card)} disabled={busy}>
              <Download className="size-5" aria-hidden /> {busy ? "Making your PDF…" : "Download PDF"}
            </Button>
            <Button size="lg" variant="outline" className="btn-xl btn-xl-outline" onClick={() => window.print()}>
              <Printer className="size-5" aria-hidden /> Print from this browser
            </Button>
            <p className="text-base text-muted-foreground">
              The PDF is made on our server at exactly the paper size you chose, with colours and fonts kept. If it fails,
              print from the browser instead: pick Save as PDF, set margins to None and turn on background graphics.
            </p>
          </div>

          <div ref={holder} className="min-w-0 overflow-hidden rounded-3xl border bg-muted/50 p-3 lg:sticky lg:top-24 print:static print:overflow-visible print:rounded-none print:border-0 print:bg-transparent print:p-0">
            {sheets.map((party, i) => (
            <Sheet
              key={party?.displayName ?? "blank"}
              card={card}
              party={party}
              last={i === sheets.length - 1}
              pageW={pageW}
              pageH={pageH}
              artW={artW}
              artH={artH}
              inset={inset}
              marks={marks}
              fit={fit}
            />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
