import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";

import { type Card, cardDateParts, withPlaceholders } from "@invite-me/api/invites/card";

import { Mandala } from "./mandala";

/*
 * Tailwind version of the Traditional Golden Caller card (golden-caller.css is no longer needed).
 *
 * Needs Tailwind v3.4+ or v4 (named groups, group-data variants, arbitrary properties).
 * Fonts (Marcellus + Cormorant Garamond) are bundled via @fontsource and imported in __root.tsx.
 *
 * Sizing: the card is a 1075:1523 portrait. Every size below is in `cqw`
 * (1cqw = 1% of the card width, the root is the size container), so the layout
 * is a pixel-proportional copy of the reference at any width. The sheet keeps that
 * ratio as a *minimum* height and grows for tall content, so nothing can clip.
 */

/* ---- design tokens (colour morph variables live on the root) ---------- */

const ROOT_VARS = [
  "[--paper-a:#f6f4ec]",
  "[--paper-b:#eee2c5]",
  "[--gold-a:#ad8d36]",
  "[--gold-b:#7d5f1c]",
  "[--frame-a:#bfae74]",
  "[--frame-b:#9d8647]",
  "[--ink:#42454a]",
  "[--sheen:50%]",
  "[--k:calc(var(--shift,0)*100%)]",
  "[--gold:color-mix(in_oklab,var(--gold-a)_calc(100%_-_var(--k)),var(--gold-b))]",
  "[--paper:color-mix(in_oklab,var(--paper-a)_calc(100%_-_var(--k)),var(--paper-b))]",
  "[--frame:color-mix(in_oklab,var(--frame-a)_calc(100%_-_var(--k)),var(--frame-b))]",
  "[--gold-hi:color-mix(in_oklab,var(--gold)_55%,#fff1c2)]",
  "[--gold-lo:color-mix(in_oklab,var(--gold)_72%,#3d2c06)]",
].join(" ");

const FONT_CAPS = "font-[family-name:Marcellus,Cormorant_Garamond,Georgia,serif]";
const FONT_NUM =
  "font-[family-name:Cormorant_Garamond,Marcellus,Georgia,serif] font-light [font-variant-numeric:lining-nums]";
const FONT_AMP = "font-[family-name:Cormorant_Garamond,Georgia,serif] italic";

/** Gold text with a moving specular sheen (driven by --sheen on the root). */
const GOLD_TEXT = [
  "inline-block",
  "bg-[image:linear-gradient(105deg,var(--gold)_0%,var(--gold)_40%,var(--gold-hi)_50%,var(--gold)_60%,var(--gold)_100%)]",
  "bg-[length:260%_100%] bg-[position:var(--sheen)_0] bg-clip-text",
  "text-transparent [-webkit-text-fill-color:transparent]",
].join(" ");

const EASE_OUT = "ease-[cubic-bezier(0.2,0.7,0.2,1)]";

/* ---- reveal helpers ---------------------------------------------------- */

/** Observes once; `seen` latches true the first time the element is 10% visible. */
/** Card parts the editor can point at; each is a `data-field` on the card. */
export type CardField =
  | "hostLine1"
  | "connector"
  | "hostLine2"
  | "requestLine"
  | "occasionLine"
  | "name1"
  | "name2"
  | "date"
  | "timeFrom"
  | "subEvents"
  | "venueName"
  | "city"
  | "rsvpContacts"
  | "rules";

const HOST_FIELDS = ["hostLine1", "connector", "hostLine2"] as const;

function useInView<T extends Element>(enabled: boolean) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || seen || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, seen]);

  return { ref, seen };
}

/**
 * Fades/blurs its children in. It is also the `group/reveal` that every
 * descendant animation (mandala, rule, date frame) keys off via
 * `group-data-[in=true]/reveal:`; `--d` is the stagger delay they inherit.
 */
function Reveal({
  enabled,
  delay = 0,
  className = "",
  children,
}: {
  enabled: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const { ref, seen } = useInView<HTMLDivElement>(enabled);
  return (
    <div
      ref={ref}
      data-in={seen}
      className={[
        "group/reveal",
        "opacity-0 [transform:translateY(18px)]",
        `transition-[opacity,transform] duration-[900ms] ${EASE_OUT} [transition-delay:var(--d)]`,
        "data-[in=true]:opacity-100 data-[in=true]:[transform:none]",
        "motion-reduce:[transform:none] motion-reduce:duration-200 motion-reduce:[transition-delay:0ms]",
        className,
      ].join(" ")}
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Renders "&" as the small italic ampersand used on the printed card. */
function Amp({ text }: { text: string }) {
  return (
    <>
      {text.split("&").map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? <span className={`mx-[0.05em] text-[0.74em] ${FONT_AMP}`}>&amp;</span> : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* Cached tiles: rasterised once as background images, so scrolling and hovering never re-run a filter. */
const PAPER_PATTERN = svgUrl(
  "<svg xmlns='http://www.w3.org/2000/svg' width='104' height='104' viewBox='0 0 56 56'><g fill='none' stroke='#a8832f' stroke-opacity='.15' stroke-width='.6'><path d='M28 4 52 28 28 52 4 28Z'/><path d='M28 14 42 28 28 42 14 28Z'/></g><g fill='#a8832f' fill-opacity='.08'><circle cx='28' cy='28' r='1.8'/><circle cx='0' cy='0' r='1.6'/><circle cx='56' cy='0' r='1.6'/><circle cx='0' cy='56' r='1.6'/><circle cx='56' cy='56' r='1.6'/></g></svg>",
);
const PAPER_GRAIN = svgUrl(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .42 0 0 0 0 .32 0 0 0 0 .15 .55 0 0 0 -.17'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
);
const PAPER_MOTTLE = svgUrl(
  "<svg xmlns='http://www.w3.org/2000/svg' width='520' height='520'><filter id='m' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.012 .016' numOctaves='3' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .68 0 0 0 0 .52 0 0 0 0 .28 .4 0 0 0 -.14'/></filter><rect width='100%' height='100%' filter='url(#m)'/></svg>",
);

/** Ivory paper: a faint gold lattice, fine grain and soft mottling. */
function PaperTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: `${PAPER_PATTERN}, ${PAPER_GRAIN}, ${PAPER_MOTTLE}`,
        backgroundSize: "104px 104px, 220px 220px, 520px 520px",
      }}
    />
  );
}

/* ---- the card ---------------------------------------------------------- */

/**
 * Renders the golden-caller invitation from card data.
 *
 * `forceOpen` skips the cover so the editor and template picker show the written card straight away
 * (the cover only opens, it never closes again). `maxWidth` overrides the width cap, which is derived
 * from the viewport height so the portrait card always fits on screen.
 */
export function GoldenCallerCard({
  card: rawCard,
  forceOpen = false,
  maxWidth,
  flow = false,
  activeField,
  onFieldClick,
}: {
  card: Card;
  forceOpen?: boolean;
  maxWidth?: string;
  /** Content-sized height with a looser 1:1.3 minimum (instead of 1075:1523), so it never turns square. */
  flow?: boolean;
  /** Editor only: the card part (a `data-field` value) to outline. */
  activeField?: CardField | null;
  /** Editor only: called with the tapped card part. */
  onFieldClick?: (field: CardField) => void;
}) {
  const card = withPlaceholders(rawCard);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(forceOpen);
  const [revealed, setRevealed] = useState(forceOpen);
  const sheenFrame = useRef(0);
  const date = cardDateParts(card.date);
  const hosts = [card.hostLine1, card.connector, card.hostLine2];
  const names = [card.name1, card.name2];

  // The sheet's content waits until the cover has begun to swing, so text never animates behind it.
  useEffect(() => {
    if (!open) {
      setRevealed(false);
      return;
    }
    const t = window.setTimeout(() => setRevealed(true), 450);
    return () => window.clearTimeout(t);
  }, [open]);

  // Scroll drives the colour morph (--shift 0..1).
  // Writes go straight to the DOM so scrolling does not re-render the card.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const next = p.toFixed(2);
      if (next === last) return;
      last = next;
      root.style.setProperty("--shift", next);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (sheenFrame.current) return;
    const el = e.currentTarget;
    const clientX = e.clientX;
    sheenFrame.current = requestAnimationFrame(() => {
      sheenFrame.current = 0;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--sheen", `${Math.round(((clientX - rect.left) / rect.width) * 100)}%`);
    });
  };

  const onCoverKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onFieldTap = onFieldClick
    ? (e: MouseEvent<HTMLDivElement>) => {
        const hit = (e.target as Element).closest<HTMLElement>("[data-field]");
        if (hit) {
          e.preventDefault();
          onFieldClick(hit.dataset.field as CardField);
        }
      }
    : undefined;

  return (
    <div
      ref={rootRef}
      data-open={open}
      onClick={onFieldTap}
      onPointerMove={onPointerMove}
      style={maxWidth ? { maxWidth } : undefined}
      className={[
        ROOT_VARS,
        FONT_CAPS,
        "group/card relative mx-auto w-full max-w-[min(900px,calc((100svh-1.5rem)*0.706))] text-[color:var(--ink)]",
        "[container-type:inline-size] [perspective:1400px]",
        // Forced-open previews are static: resolve the reveal animations in a single frame.
        forceOpen ? "!duration-0 [&_*]:!duration-0 [&_*]:!delay-0" : "",
      ].join(" ")}
    >
      {activeField ? (
        <style>{`[data-field="${activeField}"]{outline:max(2px,0.5cqw) solid var(--ring);outline-offset:0.6cqw;border-radius:0.6cqw}`}</style>
      ) : null}
      {onFieldClick ? (
        <style>{`[data-field]{cursor:pointer}[data-field]:hover{outline:max(1px,0.25cqw) dashed var(--ring);outline-offset:0.6cqw}`}</style>
      ) : null}
      <div className="relative">
        {/* Sheet: thick frame, ivory paper, 1075:1523 portrait */}
        <div
          className={[
            // min-h (not aspect-ratio) so the sheet keeps the 1075:1523 portrait for
            // typical content but stretches when a full card needs more room.
            // `mt-auto` on the rules then pins them to the bottom, clear of RSVP.
            "relative isolate flex flex-col overflow-hidden text-center",
            flow ? "min-h-[130cqw]" : "min-h-[141.674cqw]",
            "border-solid [border-width:2.3cqw] border-[color:var(--frame)] bg-[color:var(--paper)]",
            "px-[4cqw] pb-[2.5cqw] pt-[42.1cqw]",
            "shadow-[inset_0_0_40px_rgb(120_90_30/0.1)]",
            "transition-colors duration-[900ms]",
          ].join(" ")}
        >
          <PaperTexture />

          {/* Top mandala: centre sits on the inner top edge, only the lower half shows */}
          <div className="absolute left-[8.25cqw] top-[-41.75cqw] z-[1] w-[83.5cqw]">
            <Reveal enabled={revealed}>
              <Mandala />
            </Reveal>
          </div>

          {/* Bottom corners: quarter mandalas centred on the inner frame corners */}
          <div className="absolute bottom-[-24.2cqw] left-[-24.2cqw] z-[1] w-[48.4cqw] opacity-90">
            <Reveal enabled={revealed} delay={1800}>
              <Mandala />
            </Reveal>
          </div>
          <div className="absolute bottom-[-24.2cqw] right-[-24.2cqw] z-[1] w-[48.4cqw] opacity-90">
            <Reveal enabled={revealed} delay={1800}>
              <Mandala />
            </Reveal>
          </div>

          <div className="relative z-[1]">
            {/* Hosts */}
            <Reveal enabled={revealed} delay={250}>
              <p className="text-[max(10px,2.6cqw)] uppercase leading-[1.5] tracking-[0.08em]">
                {hosts.map((line, i) => (
                  <span key={i} data-field={HOST_FIELDS[i]} className="block">
                    <Amp text={line} />
                  </span>
                ))}
                <span data-field="requestLine" className="block">
                  {card.requestLine}
                </span>
              </p>
            </Reveal>

            {/* Grey rule, draws from the centre */}
            <Reveal enabled={revealed} delay={500} className="mx-auto mt-[3.9cqw] w-[71.9cqw]">
              <div
                className={[
                  "h-[max(1px,0.28cqw)] origin-center scale-x-0 bg-[#a8a6a1]",
                  `transition-transform duration-[1200ms] ${EASE_OUT} [transition-delay:var(--d)]`,
                  "group-data-[in=true]/reveal:scale-x-100 motion-reduce:scale-x-100 motion-reduce:[transition-delay:0ms]",
                ].join(" ")}
              />
            </Reveal>

            {/* Occasion (wraps to "… OF THEIR / CHILDREN" at the rule width) */}
            <Reveal enabled={revealed} delay={700} className="mt-[1.5cqw]">
              <p
                data-field="occasionLine"
                className="mx-auto max-w-[71.9cqw] text-[max(10px,2.5cqw)] uppercase leading-[1.45] tracking-[0.08em]"
              >
                {card.occasionLine}
              </p>
            </Reveal>

            {/* Names, with AND flanked by two gold rules as wide as the longest name */}
            <Reveal enabled={revealed} delay={1000} className="mt-[0.4cqw]">
              <div className="mx-auto w-fit text-[6.4cqw] leading-none tracking-[0.03em]">
                <div>
                  <span data-field="name1" className={GOLD_TEXT}>
                    {names[0]}
                  </span>
                </div>
                <div className="flex h-[2.9cqw] items-center gap-[1.4cqw] text-[max(10px,2.4cqw)] leading-[1.2] tracking-[0.12em] text-[color:var(--gold)]">
                  <span className="h-[max(1px,0.18cqw)] flex-1 -translate-y-[0.55cqw] bg-[color:var(--gold)]" />
                  <span className="shrink-0 pl-[0.12em]">AND</span>
                  <span className="h-[max(1px,0.18cqw)] flex-1 -translate-y-[0.55cqw] bg-[color:var(--gold)]" />
                </div>
                <div>
                  <span data-field="name2" className={GOLD_TEXT}>
                    {names[1]}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Date: framed month / big day / weekday. Frame lines reveal from the centre outward */}
            <Reveal enabled={revealed} delay={1200} className="mt-[3.3cqw]">
              <div
                data-field="date"
                className="mx-auto grid w-[57cqw] grid-cols-[1fr_9.3cqw_1fr] grid-rows-[4.5cqw]"
              >
                {(["month", "weekday"] as const).map((key) => (
                  <div
                    key={key}
                    className={[
                      key === "month" ? "col-start-1" : "col-start-3",
                      "flex items-center justify-center border-y-[0.2cqw] border-solid border-[color:var(--gold)]",
                      "text-[max(10px,2.6cqw)] uppercase tracking-[0.14em]",
                      "[clip-path:inset(0_50%_0_50%)]",
                      `transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.6,0,0.2,1)] [transition-delay:var(--d)]`,
                      "group-data-[in=true]/reveal:[clip-path:inset(0_0_0_0)]",
                      "motion-reduce:[clip-path:inset(0_0_0_0)] motion-reduce:[transition-delay:0ms]",
                    ].join(" ")}
                  >
                    <span className={`${GOLD_TEXT} pl-[0.14em]`}>{date[key]}</span>
                  </div>
                ))}
                <div className="col-start-2 row-start-1 flex items-center justify-center whitespace-nowrap">
                  <span className={`${FONT_NUM} ${GOLD_TEXT} text-[9.3cqw] leading-none`}>
                    {date.day}
                  </span>
                </div>
              </div>
              <div className="mt-[0.8cqw] text-[max(10px,2.2cqw)] leading-[1.3] tracking-[0.2em] text-[color:var(--gold)] opacity-85">
                {date.year}
              </div>
            </Reveal>

            {/* Time, sub events, venue */}
            <Reveal enabled={revealed} delay={1400} className="mt-[0.6cqw]">
              <p className="text-[max(10px,2.5cqw)] uppercase leading-[1.45] tracking-[0.08em]">
                <span
                  data-field="timeFrom"
                  className="block"
                >{`FROM ${card.timeFrom} TO ${card.timeTo}`}</span>
                {card.subEvents.map((sub, i) => (
                  <span key={i} data-field="subEvents" className="block">
                    {`(${sub.label} AT ${sub.time})`}
                  </span>
                ))}
                <span className="block">AT</span>
              </p>
              <p className="mt-[0.3cqw] text-[3.5cqw] uppercase leading-[1.2] tracking-[0.05em]">
                <span data-field="venueName" className={GOLD_TEXT}>
                  {card.venueName}
                </span>
              </p>
              <p className="mt-[0.5cqw] text-[max(10px,2.5cqw)] uppercase leading-[1.4] tracking-[0.1em]">
                <span data-field="city" className={GOLD_TEXT}>
                  {card.city}
                </span>
              </p>
            </Reveal>

            {/* RSVP */}
            <Reveal enabled={revealed} delay={1600} className="mt-[1.6cqw]">
              <p className="uppercase tracking-[0.1em]">
                <span className="block text-[max(10px,2.05cqw)] leading-[1.3] tracking-[0.12em]">
                  RSVP
                </span>
                {card.rsvpContacts.map((contact, i) => (
                  <span
                    key={i}
                    data-field="rsvpContacts"
                    className="block text-[max(10px,1.95cqw)] leading-[1.3]"
                  >
                    {contact.name}-
                    {forceOpen ? (
                      <span>{contact.phone}</span>
                    ) : (
                      <a
                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                        className="text-inherit no-underline"
                      >
                        {contact.phone}
                      </a>
                    )}
                  </span>
                ))}
              </p>
            </Reveal>
          </div>

          {/* Rules: small print pinned to the bottom of the sheet by mt-auto, so it can
              never collide with the RSVP block above (which is in normal flow). */}
          {card.rules ? (
            <Reveal
              enabled={revealed}
              delay={1800}
              className="relative z-[1] mx-[14cqw] mt-auto pt-[2cqw]"
            >
              <p
                data-field="rules"
                className="text-center text-[max(8px,1.55cqw)] uppercase leading-[1.5] tracking-[0.12em] whitespace-pre-line opacity-80"
              >
                {card.rules}
              </p>
            </Reveal>
          ) : null}
        </div>

        {/* Cover: flat gold panel, cream hairline frame and a mandala ornament; swings open and shut on a hinge */}
        <div
          hidden={forceOpen}
          className="pointer-events-none absolute inset-0 z-[2] overflow-y-clip"
        >
          <div
            role="button"
            tabIndex={open ? -1 : 0}
            aria-label="Open invitation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            onKeyDown={onCoverKey}
            className={[
              "group/cover pointer-events-auto absolute inset-0 flex origin-left cursor-pointer flex-col items-center justify-center gap-[2.6cqw] [backface-visibility:hidden] will-change-transform",
              "border-solid [border-width:2.3cqw] border-[color:var(--frame)] bg-[color:var(--gold)]",
              "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]",
              "transition-[transform,visibility] duration-[1100ms] ease-[cubic-bezier(0.65,0,0.25,1)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--gold)]",
              "group-data-[open=true]/card:pointer-events-none group-data-[open=true]/card:invisible group-data-[open=true]/card:[transform:perspective(1400px)_rotateY(-100deg)]",
              "motion-reduce:transition-opacity motion-reduce:duration-200",
              "motion-reduce:group-data-[open=true]/card:[transform:none] motion-reduce:group-data-[open=true]/card:opacity-0",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute inset-[4cqw] border border-solid border-[#fff3c9]/35" />
            <span className="pointer-events-none absolute inset-[5.4cqw] border border-solid border-[#fff3c9]/15" />
            {/* Ornament: the mandala foil is recoloured to pale gold for this flat panel */}
            <div
              data-in="true"
              className="group/reveal block w-[34cqw] [--gold:#f1dfa4] [--gold-hi:#fff7dc] [--gold-lo:#c9a95a]"
            >
              <Mandala />
            </div>
            <span className="text-[max(16px,4.4cqw)] uppercase leading-none tracking-[0.4em] text-[#fff3c9]">
              Open
            </span>
            <span className="text-[max(11px,2.2cqw)] uppercase tracking-[0.3em] text-[#fff3c9]/85">
              Tap to open
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
