import type { Card } from "@invite-me/api/invites/card";
import { useEffect, useRef, useState } from "react";

import type { GuestPartyView } from "@/presets/types";

/** Trim sizes in millimetres, portrait. Landscape swaps them. */
export const SIZES = {
  a6: { label: "A6 card", w: 105, h: 148 },
  a5: { label: "A5 invitation", w: 148, h: 210 },
  a4: { label: "A4 poster", w: 210, h: 297 },
} as const;
export type SizeId = keyof typeof SIZES;

const BLEED = 3; // mm of artwork that goes past the cut line
const MARK_ZONE = 8; // mm of margin that holds the crop marks
export const PX_PER_MM = 96 / 25.4;

/** Everything the print page and the server's PDF render need to agree on. */
export type PrintSpec = { size: SizeId; landscape: boolean; marks: boolean };
export type PrintPayload = PrintSpec & { card: Card; parties: (GuestPartyView | null)[] };

/** Page, artwork and crop-mark geometry in millimetres. */
export function layoutFor({ size, landscape, marks }: PrintSpec) {
  const trimW = landscape ? SIZES[size].h : SIZES[size].w;
  const trimH = landscape ? SIZES[size].w : SIZES[size].h;
  const art = marks ? BLEED : 0;
  const inset = marks ? MARK_ZONE - BLEED : 0;
  return {
    pageW: trimW + 2 * (art + inset),
    pageH: trimH + 2 * (art + inset),
    artW: trimW + 2 * art,
    artH: trimH + 2 * art,
    inset,
  };
}

/** The `@page` and print rules for a sheet size. Colours and sizes are printed exactly as drawn. */
export function PrintStyle({ pageW, pageH }: { pageW: number; pageH: number }) {
  return (
    <style>{`
      @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
      @media print {
        html, body { margin: 0 !important; background: #fff !important; }
        .print-sheet { zoom: 1 !important; box-shadow: none !important; margin: 0 !important; }
      }
    `}</style>
  );
}

/**
 * The real sheet, scaled down to sit inside a panel. This is the same component the browser prints,
 * so the preview cannot disagree with the paper: it shows the page, the artwork and the crop marks.
 */
export function SheetPreview({
  card,
  party,
  pageW,
  pageH,
  artW,
  artH,
  inset,
  marks,
}: {
  card: Card;
  party: GuestPartyView | null;
  pageW: number;
  pageH: number;
  artW: number;
  artH: number;
  inset: number;
  marks: boolean;
}) {
  const studio = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const width = pageW * PX_PER_MM;
  const height = pageH * PX_PER_MM;

  useEffect(() => {
    // The column around the panel is the room: the panel hugs the paper, so its own width would
    // depend on the size it is measuring.
    const host = studio.current?.parentElement;
    if (!host) return;
    const measure = () => {
      // p-4 and the panel's border are not room for the paper, and the dialog's height caps it.
      const width = host.clientWidth - 34;
      const height = Math.min(280, window.innerHeight * 0.3);
      setRoom((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // The fit is a pure function of the room, so the paper can never spill outside the preview.
  const scale = room.width > 0 ? Math.min(room.width / width, room.height / height, 1) : 0;

  return (
    <div ref={studio} className="mx-auto grid w-fit min-w-0 justify-items-center rounded-2xl border border-border bg-surface p-4">
      <div className="relative" style={{ width: width * scale, height: height * scale }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
          {scale > 0 ? (
            <Sheet card={card} party={party} last pageW={pageW} pageH={pageH} artW={artW} artH={artH} inset={inset} marks={marks} fit={1} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Sheet({
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
          {[inset + 3, pageH - inset - 3].flatMap((y) => [
            <span key={`h-l-${y}`} className={tick} style={{ left: mm(1), top: mm(y), width: mm(inset - 1), height: "0.25pt" }} />,
            <span key={`h-r-${y}`} className={tick} style={{ right: mm(1), top: mm(y), width: mm(inset - 1), height: "0.25pt" }} />,
          ])}
          {[inset + 3, pageW - inset - 3].flatMap((x) => [
            <span key={`v-t-${x}`} className={tick} style={{ top: mm(1), left: mm(x), height: mm(inset - 1), width: "0.25pt" }} />,
            <span key={`v-b-${x}`} className={tick} style={{ bottom: mm(1), left: mm(x), height: mm(inset - 1), width: "0.25pt" }} />,
          ])}
        </>
      ) : null}
    </div>
  );
}
