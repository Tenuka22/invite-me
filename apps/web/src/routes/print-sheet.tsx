import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { type PrintPayload, PrintStyle, Sheet, layoutFor } from "@/components/print-sheet";

/**
 * The sheets exactly as they print, with the job in the URL fragment (`#<base64url json>`). The
 * server opens this page in a headless browser to make the PDF, so the fragment never reaches
 * any server log. The page sets `data-ready` on the body once every card has drawn.
 */
export const Route = createFileRoute("/print-sheet")({
  ssr: false,
  head: () => ({ meta: [{ title: "Print" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PrintSheet,
});

function decode(hash: string): PrintPayload | null {
  try {
    const b64 = hash.replace(/^#/, "").replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as PrintPayload;
  } catch {
    return null;
  }
}

function PrintSheet() {
  const [job, setJob] = useState<PrintPayload | null>(null);
  useEffect(() => setJob(decode(window.location.hash)), []);

  const count = job?.parties.length ?? 0;
  useEffect(() => {
    if (!job) return;
    let ready = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReady = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "invite-preview-ready") return;
      if (++ready < count) return;
      // Every card has asked for its content; give the fonts and the first paint a moment.
      void document.fonts.ready.then(() => {
        timer = setTimeout(() => document.body.setAttribute("data-ready", "1"), 1200);
      });
    };
    window.addEventListener("message", onReady);
    return () => {
      window.removeEventListener("message", onReady);
      clearTimeout(timer);
    };
  }, [job, count]);

  if (!job) return null;
  const layout = layoutFor(job);
  return (
    <div>
      <PrintStyle pageW={layout.pageW} pageH={layout.pageH} />
      {job.parties.map((party, i) => (
        <Sheet
          key={party?.displayName ?? "blank"}
          card={job.card}
          party={party}
          last={i === count - 1}
          {...layout}
          marks={job.marks}
          fit={1}
        />
      ))}
    </div>
  );
}
