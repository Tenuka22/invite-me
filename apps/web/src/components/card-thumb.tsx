import { cn } from "@invite-me/ui/lib/utils";
import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";

import { GoldenCallerCard } from "@/presets/traditional-golden-caller/card";

/** Width the card is laid out at. Its type does not shrink, so small cards are scaled down from here. */
const LAYOUT_WIDTH = 440;

/** The whole invitation at any width: laid out once at full size, then scaled to fit its box. */
export function CardThumb({
  card,
  className,
}: {
  card: ComponentProps<typeof GoldenCallerCard>["card"];
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / LAYOUT_WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className={cn("relative aspect-[1075/1523] overflow-hidden", className)}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: LAYOUT_WIDTH, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        <GoldenCallerCard card={card} forceOpen maxWidth="100%" />
      </div>
    </div>
  );
}
