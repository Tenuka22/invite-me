import { Button } from "@invite-me/ui/components/motion/button/base";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

const KEY = "invite.tour.v1";

/** True the first time this browser opens a guest page; `markSeen` remembers it. */
export function useFirstVisit(enabled: boolean) {
  const [isFirst, setIsFirst] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    try {
      setIsFirst(localStorage.getItem(KEY) === null);
    } catch {
      setIsFirst(false);
    }
  }, [enabled]);
  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // storage can be blocked; the guide then simply shows again next time
    }
    setIsFirst(false);
  }, []);
  return useMemo(() => ({ isFirst, markSeen }), [isFirst, markSeen]);
}

export type TourStep = { target: string; title: string; body: string };

type Box = { x: number; y: number; w: number; h: number };

function measure(target: string): Box | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/** A step-by-step walk-through: dims the page, lights one control at a time and explains it. */
export function Tour({ steps, toneClass, onDone }: { steps: TourStep[]; toneClass: string; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const step = steps[index]!;
  const last = index === steps.length - 1;

  useLayoutEffect(() => {
    const update = () => setBox(measure(step.target));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step.target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      if (e.key === "ArrowRight" || e.key === "Enter") last ? onDone() : setIndex((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onDone]);

  const pad = step.target === "card" ? 0 : 8;
  const spot = box
    ? { left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 }
    : { left: 0, top: 0, width: 0, height: 0 };
  // The note sits above the lit control when it is in the lower half of the screen, else below.
  const below = box ? box.y + box.h / 2 < window.innerHeight / 2 : false;
  const noteStyle: React.CSSProperties =
    step.target === "card" || !box
      ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
      : below
        ? { left: "50%", top: box.y + box.h + 18, transform: "translateX(-50%)" }
        : { left: "50%", bottom: window.innerHeight - box.y + 18, transform: "translateX(-50%)" };

  return (
    <div className={`tour ${toneClass}`} role="dialog" aria-modal="true" aria-label="Quick tour">
      {step.target === "card" ? <div className="tour-dim" /> : <div className="tour-spot" style={spot} />}
      <div className="tour-note" style={noteStyle}>
        <p className="tour-count">
          {index + 1} of {steps.length}
        </p>
        <h2 className="tour-title">{step.title}</h2>
        <p>{step.body}</p>
        <div className="tour-actions">
          <Button className="stage-action" onClick={onDone}>
            Skip
          </Button>
          <Button className="stage-action is-primary" onClick={() => (last ? onDone() : setIndex((i) => i + 1))}>
            {last ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
