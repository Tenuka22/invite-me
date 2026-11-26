import type { Card } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@invite-me/ui/components/motion/select";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { OPTION_ROW } from "@/components/card-fields";
import type { GuestPartyView } from "@/presets/types";
import { PageTitle } from "@/components/host-shell";
import { NotFound } from "@/components/not-found";
import { Skeleton } from "@/components/skeletons";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/print")({
  validateSearch: z.object({ guest: z.string().optional() }),
  component: PrintPage,
});

/** Trim sizes in millimetres, portrait. Landscape swaps them. */
const SIZES = {
  a6: { label: "A6 card", w: 105, h: 148 },
  a5: { label: "A5 invitation", w: 148, h: 210 },
  a4: { label: "A4 poster", w: 210, h: 297 },
} as const;
type SizeId = keyof typeof SIZES;

const BLEED = 3; // mm of artwork that goes past the cut line
const MARK_ZONE = 8; // mm of margin that holds the crop marks
const PX_PER_MM = 96 / 25.4;

function PrintPage() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  const [size, setSize] = useState<SizeId>("a5");
  const [landscape, setLandscape] = useState(false);
  const [marks, setMarks] = useState(false);

  const trimW = landscape ? SIZES[size].h : SIZES[size].w;
  const trimH = landscape ? SIZES[size].w : SIZES[size].h;
  const art = marks ? BLEED : 0;
  const pageW = trimW + 2 * (art + (marks ? MARK_ZONE - BLEED : 0));
  const pageH = trimH + 2 * (art + (marks ? MARK_ZONE - BLEED : 0));
  const artW = trimW + 2 * art;
  const artH = trimH + 2 * art;

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

  const mm = (n: number) => `${n}mm`;
  return (
    <div className="grid gap-8 print:block">
      <style>{`
        @page { size: ${mm(pageW)} ${mm(pageH)}; margin: 0; }
        @media print {
          html, body { margin: 0 !important; background: #fff !important; }
          .print-sheet { zoom: 1 !important; box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

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
            <Button size="lg" className="btn-xl" onClick={() => window.print()}>
              <Printer className="size-5" aria-hidden /> Download PDF or print
            </Button>
            <p className="text-base text-muted-foreground">
              In the window that opens, choose <strong>Save as PDF</strong> as the printer to get a file. Leave margins on
              None and turn on background graphics if your browser asks.
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
              inset={marks ? MARK_ZONE - BLEED : 0}
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

function Sheet({
  card,
  party,
  last,
  pageW,
  pageH,
  artW,
  artH,
  inset,
  marks,
  fit,
}: {
  card: Card;
  party: GuestPartyView | null;
  last: boolean;
  pageW: number;
  pageH: number;
  artW: number;
  artH: number;
  inset: number;
  marks: boolean;
  fit: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const send = () =>
      frame.current?.contentWindow?.postMessage({ type: "invite-preview", card, party }, window.location.origin);
    const onReady = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && e.data?.type === "invite-preview-ready") send();
    };
    window.addEventListener("message", onReady);
    send();
    return () => window.removeEventListener("message", onReady);
  }, [card, party, artW, artH]);
  const preset = card.preset;
  const mm = (n: number) => `${n}mm`;
  const tick = "absolute bg-black";
  return (
    <div
      className={`print-sheet relative mx-auto mb-6 bg-white print:mb-0 ${last ? "" : "print:break-after-page"} shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)]`}
      style={{ width: mm(pageW), height: mm(pageH), zoom: fit }}
    >
      <iframe
        ref={frame}
        key={`${preset}-${artW}-${artH}`}
        title="Card artwork"
        src={`/preview/${preset}?print=1`}
        className="absolute border-0"
        style={{ left: mm(inset), top: mm(inset), width: mm(artW), height: mm(artH) }}
      />
      {marks ? (
        <>
          {/* crop marks sit in the margin, clear of the bleed */}
          {[inset + 3, pageH - inset - 3].flatMap((y) =>
            [
              <span key={`h-l-${y}`} className={tick} style={{ left: mm(1), top: mm(y), width: mm(inset - 1), height: "0.25pt" }} />,
              <span key={`h-r-${y}`} className={tick} style={{ right: mm(1), top: mm(y), width: mm(inset - 1), height: "0.25pt" }} />,
            ],
          )}
          {[inset + 3, pageW - inset - 3].flatMap((x) =>
            [
              <span key={`v-t-${x}`} className={tick} style={{ top: mm(1), left: mm(x), height: mm(inset - 1), width: "0.25pt" }} />,
              <span key={`v-b-${x}`} className={tick} style={{ bottom: mm(1), left: mm(x), height: mm(inset - 1), width: "0.25pt" }} />,
            ],
          )}
        </>
      ) : null}
    </div>
  );
}
