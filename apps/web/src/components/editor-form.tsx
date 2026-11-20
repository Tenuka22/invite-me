import { Button } from "@invite-me/ui/components/motion/button/base";
import { ChevronDown, Plus, X } from "lucide-react";
import { type ReactNode, type TextareaHTMLAttributes, useId } from "react";

import type { CardField } from "@/presets/traditional-golden-caller/card";

const CONTROL =
  "w-full rounded-md border border-foreground/15 bg-background px-2.5 text-sm outline-none transition-colors " +
  "placeholder:italic placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:ring-2 focus:ring-ring/30 " +
  "aria-invalid:border-destructive";
/** 44px tall on touch screens, compact on desktop. */
const SINGLE = `${CONTROL} h-11 lg:h-9`;

export const fieldId = (key: string) => `field-${key}`;

/** Label, required/optional marker, control, then helper or error. Wires the label to the control. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  action,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Small right-aligned control on the label row, e.g. "Reset to default". */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`grid min-w-0 content-start gap-1 ${className ?? ""}`}>
      <div className="flex min-h-5 items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[0.8125rem] font-medium">
          {label}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {required ? "Required" : "Optional"}
          </span>
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextProps = {
  id: string;
  /** Which card part this edits, so focus can highlight it. */
  card?: CardField;
  value: string;
  max: number;
  placeholder?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function TextControl({
  id,
  card,
  value,
  max,
  placeholder,
  invalid,
  onChange,
  onBlur,
}: TextProps) {
  return (
    <input
      id={id}
      data-card-field={card}
      type="text"
      className={SINGLE}
      maxLength={max}
      placeholder={placeholder}
      value={value}
      aria-invalid={invalid || undefined}
      aria-describedby={`${id}-msg`}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  );
}

/** Grows with its content; use only where the text really wraps on the card. */
export function GrowControl({
  id,
  card,
  value,
  max,
  placeholder,
  onChange,
  ...rest
}: TextProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "id" | "placeholder">) {
  return (
    <textarea
      id={id}
      data-card-field={card}
      rows={1}
      className={`${CONTROL} min-h-11 resize-none py-2 leading-5 [field-sizing:content] lg:min-h-9 lg:py-1.5`}
      maxLength={max}
      placeholder={placeholder}
      value={value}
      aria-describedby={`${id}-msg`}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

/** "9.30 AM" (stored text) <-> "09:30" (native time input). */
function parseTime(text: string): string | null {
  const m = /^\s*(\d{1,2})(?:[.:](\d{2}))?\s*([ap])\.?m\.?\s*$/i.exec(text);
  if (!m) return null;
  const hour = Number(m[1]);
  if (hour < 1 || hour > 12) return null;
  const pm = m[3]!.toLowerCase() === "p";
  return `${String((hour % 12) + (pm ? 12 : 0)).padStart(2, "0")}:${m[2] ?? "00"}`;
}

function formatTime(value: string): string {
  const [h, m] = value.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}.${m} ${hour >= 12 ? "PM" : "AM"}`;
}

/**
 * Time picker that keeps the stored "9.30 AM" text format. Existing text it cannot read stays
 * editable as plain text, so nothing a host already wrote is lost.
 */
export function TimeControl({
  id,
  card,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  card?: CardField;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const parsed = value.trim() ? parseTime(value) : "";
  if (parsed === null) {
    return (
      <TextControl
        id={id}
        card={card}
        value={value}
        max={20}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  }
  return (
    <input
      id={id}
      data-card-field={card}
      type="time"
      className={SINGLE}
      value={parsed}
      aria-describedby={`${id}-msg`}
      onChange={(e) => onChange(e.target.value ? formatTime(e.target.value) : "")}
    />
  );
}

/** One accordion row: title + summary of values while closed, content while open. */
export function AccordionSection({
  id,
  title,
  affects,
  summary,
  done,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  /** Where this group shows up on the card. */
  affects: string;
  summary: string;
  done: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panel = useId();
  return (
    <section id={id} className="scroll-mt-20 border-t border-foreground/10 first:border-t-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center gap-3 rounded-sm py-2 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden
            className={`grid size-5 shrink-0 place-items-center rounded-full border text-[0.6rem] ${
              done
                ? "border-primary bg-primary text-primary-foreground"
                : "border-foreground/25 text-transparent"
            }`}
          >
            ✓
          </span>
          <span className="grid min-w-0 flex-1">
            <span className="font-display text-base font-semibold tracking-[-0.01em]">
              {title}
              <span className="sr-only">{done ? ", complete" : ", incomplete"}</span>
            </span>
            {open ? (
              <span className="text-xs text-muted-foreground">{affects}</span>
            ) : (
              <span className="truncate text-xs text-muted-foreground">{summary}</span>
            )}
          </span>
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div
        id={panel}
        role="region"
        aria-label={title}
        hidden={!open}
        className="grid gap-3 pb-5 pl-8"
      >
        {children}
      </div>
    </section>
  );
}

/** Rows of side-by-side fields with add and remove. */
export function RowList<T>({
  addLabel,
  max,
  min = 0,
  items,
  empty,
  onChange,
  render,
}: {
  addLabel: string;
  max: number;
  min?: number;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, i: number, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <div className="grid grid-cols-2 gap-2">
            {render(item, i, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
          </div>
          {items.length > min ? (
            <button
              type="button"
              aria-label={`Remove row ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="mt-[1.5rem] grid size-11 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:size-9"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : (
            <span className="size-11 lg:size-9" />
          )}
        </div>
      ))}
      {items.length < max ? (
        <Button
          variant="secondary"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...items, empty])}
        >
          <Plus className="mr-1 size-4" aria-hidden />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
