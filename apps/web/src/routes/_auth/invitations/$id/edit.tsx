import { CARD_PLACEHOLDERS, type Card, cardSchema } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { DatePicker } from "@invite-me/ui/components/motion/date-picker";
import { Input } from "@invite-me/ui/components/motion/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ComponentProps, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { EditorSkeleton } from "@/components/page-skeletons";
import { toast } from "@/components/toaster";
import { TEXTAREA } from "@/lib/form-styles";
import { GoldenCallerCard } from "@/presets/traditional-golden-caller/card";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/edit")({
  component: InvitationEditor,
});

/** Wrapped card lines, so the full sentence stays visible while editing. */
const COPY_AREA =
  "min-h-[4.25rem] w-full resize-y rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-foreground/40 focus:ring-2 focus:ring-ring/30";
const FIELD_LABEL = "grid gap-1.5 text-sm font-medium";

/** The overlay drops the page chrome, so the card can use almost the whole window. */
const LARGE_PREVIEW_MAX_WIDTH = "min(100%, calc((100svh - 8rem) * 0.706))";

function InvitationEditor() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));

  if (invitation.isPending) return <EditorSkeleton />;
  if (invitation.isError) {
    return (
      <div className="grid max-w-md justify-items-start gap-3 py-8">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Couldn't load this invitation</h2>
        <p className="text-sm text-muted-foreground">
          The connection dropped or the invitation is no longer here.
        </p>
        <Button variant="outline" size="sm" onClick={() => void invitation.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    <Editor key={JSON.stringify(invitation.data.card)} id={id} initial={invitation.data.card} />
  );
}

function Editor({ id, initial }: { id: string; initial: Card }) {
  const [draft, setDraft] = useState<Card>(initial);
  /** What the server has, so autosave knows there is something to write. */
  const savedSnapshot = useRef(JSON.stringify(initial));
  const [savedOnce, setSavedOnce] = useState(false);
  const save = useMutation(
    orpc.invitations.saveCard.mutationOptions({
      onError: (error) => toast.error("Could not save invitation", { description: error.message }),
    }),
  );

  const persist = useCallback(
    (card: Card) => {
      save.mutate(
        { id, card },
        {
          onSuccess: () => {
            savedSnapshot.current = JSON.stringify(card);
            setSavedOnce(true);
          },
        },
      );
    },
    [id, save.mutate],
  );

  // Autosave: once typing settles, valid drafts are written without asking. Invalid ones wait.
  useEffect(() => {
    if (JSON.stringify(draft) === savedSnapshot.current) return;
    const parsed = cardSchema.safeParse(draft);
    if (!parsed.success) return;
    const timer = window.setTimeout(() => persist(parsed.data), 900);
    return () => window.clearTimeout(timer);
  }, [draft, persist]);

  const dirty = JSON.stringify(draft) !== savedSnapshot.current;

  /** Required fields only complain once the host has been in them, so a fresh card isn't a wall of red. */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));
  const incomplete = !draft.name1.trim() || !draft.name2.trim() || !draft.date;

  function set<K extends keyof Card>(key: K, value: Card[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function saveNow() {
    const parsed = cardSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Check the card", { description: parsed.error.issues[0]?.message });
      return;
    }
    persist(parsed.data);
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <SaveStatus
          pending={save.isPending}
          failed={save.isError}
          dirty={dirty}
          saved={savedOnce}
          onSave={saveNow}
          incomplete={incomplete}
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,min(calc((100svh-11rem)*0.706),40vw))] lg:gap-14">
        <div className="grid content-start gap-7">
          <Section title="The couple">
            <div className="grid grid-cols-2 gap-3">
              <Text
                label="Name 1"
                placeholder={CARD_PLACEHOLDERS.name1}
                value={draft.name1}
                max={40}
                error={touched.name1 && !draft.name1.trim() ? "Add a name" : undefined}
                onBlur={() => touch("name1")}
                onChange={(v) => set("name1", v)}
              />
              <Text
                label="Name 2"
                placeholder={CARD_PLACEHOLDERS.name2}
                value={draft.name2}
                max={40}
                error={touched.name2 && !draft.name2.trim() ? "Add a name" : undefined}
                onBlur={() => touch("name2")}
                onChange={(v) => set("name2", v)}
              />
            </div>
          </Section>

          <Section title="When">
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                className="col-span-2"
                label="Date"
                value={draft.date}
                placeholder="Pick the date"
                error={touched.date && !draft.date ? "Pick the date" : undefined}
                onClose={() => touch("date")}
                onChange={(v) => set("date", v)}
              />
              <Text
                label="From"
                placeholder={CARD_PLACEHOLDERS.timeFrom}
                value={draft.timeFrom}
                max={20}
                onChange={(v) => set("timeFrom", v)}
              />
              <Text
                label="To"
                placeholder={CARD_PLACEHOLDERS.timeTo}
                value={draft.timeTo}
                max={20}
                onChange={(v) => set("timeTo", v)}
              />
            </div>
          </Section>

          <Section title="Where & RSVP">
            <div className="grid grid-cols-2 gap-3">
              <Text
                label="Venue"
                placeholder={CARD_PLACEHOLDERS.venueName}
                value={draft.venueName}
                max={80}
                onChange={(v) => set("venueName", v)}
              />
              <Text
                label="City"
                placeholder={CARD_PLACEHOLDERS.city}
                value={draft.city}
                max={60}
                onChange={(v) => set("city", v)}
              />
            </div>
            <ListEditor
              title="Contacts"
              max={5}
              min={1}
              items={draft.rsvpContacts}
              empty={{ name: "", phone: "" }}
              onChange={(items) => set("rsvpContacts", items)}
              render={(item, update) => (
                <div className="grid grid-cols-2 gap-2">
                  <Text
                    label="Name"
                    placeholder={CARD_PLACEHOLDERS.contactName}
                    value={item.name}
                    max={40}
                    onChange={(v) => update({ ...item, name: v })}
                  />
                  <Text
                    label="Phone"
                    placeholder={CARD_PLACEHOLDERS.contactPhone}
                    value={item.phone}
                    max={24}
                    onChange={(v) => update({ ...item, phone: v })}
                  />
                </div>
              )}
            />
          </Section>

          <Disclosure title="Wording on the card">
            <CopyArea
              label="Host line 1"
              placeholder={CARD_PLACEHOLDERS.hostLine1}
              value={draft.hostLine1}
              max={80}
              onChange={(v) => set("hostLine1", v)}
            />
            <Text
              label="Connector"
              placeholder={CARD_PLACEHOLDERS.connector}
              value={draft.connector}
              max={40}
              onChange={(v) => set("connector", v)}
            />
            <CopyArea
              label="Host line 2"
              placeholder={CARD_PLACEHOLDERS.hostLine2}
              value={draft.hostLine2}
              max={80}
              onChange={(v) => set("hostLine2", v)}
            />
            <CopyArea
              label="Request line"
              placeholder={CARD_PLACEHOLDERS.requestLine}
              value={draft.requestLine}
              max={120}
              onChange={(v) => set("requestLine", v)}
            />
            <CopyArea
              label="Occasion line"
              placeholder={CARD_PLACEHOLDERS.occasionLine}
              value={draft.occasionLine}
              max={160}
              onChange={(v) => set("occasionLine", v)}
            />
          </Disclosure>

          <Disclosure title="Extra details">
            <ListEditor
              title="Sub-events"
              max={5}
              items={draft.subEvents}
              empty={{ label: "", time: "" }}
              onChange={(items) => set("subEvents", items)}
              render={(item, update) => (
                <div className="grid grid-cols-2 gap-2">
                  <Text
                    label="Label"
                    value={item.label}
                    max={60}
                    onChange={(v) => update({ ...item, label: v })}
                  />
                  <Text
                    label="Time"
                    value={item.time}
                    max={20}
                    onChange={(v) => update({ ...item, time: v })}
                  />
                </div>
              )}
            />
            <label className={FIELD_LABEL}>
              Rules
              <textarea
                className={TEXTAREA}
                maxLength={400}
                value={draft.rules}
                onChange={(e) => set("rules", e.target.value)}
              />
            </label>
          </Disclosure>
        </div>

        <Preview card={draft} />
      </div>
    </div>
  );
}

/** Autosave is the primary path; this only reports it and offers a manual retry when needed. */
function SaveStatus({
  pending,
  failed,
  dirty,
  saved,
  onSave,
  incomplete,
}: {
  pending: boolean;
  failed: boolean;
  dirty: boolean;
  saved: boolean;
  onSave: () => void;
  incomplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      {pending ? (
        "Saving…"
      ) : failed ? (
        <>
          Not saved
          <Button variant="ghost" size="sm" onClick={onSave}>
            Try again
          </Button>
        </>
      ) : incomplete ? (
        "Add both names and the date to start saving"
      ) : dirty ? (
        <>
          Unsaved changes
          <Button variant="ghost" size="sm" onClick={onSave}>
            Save now
          </Button>
        </>
      ) : saved ? (
        "Saved"
      ) : (
        "Saves automatically"
      )}
    </div>
  );
}

/**
 * The card, three ways: inline on desktop, a sheet on phones, and a full-screen view from either one.
 * Inline it is sized to fit the window; the overlay is where you go to read the small print.
 */
function Preview({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const expand = () => setOpen(true);

  return (
    <>
      <section className="hidden min-w-0 lg:sticky lg:top-6 lg:block lg:self-start">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
            Preview
          </h2>
          <Button variant="ghost" size="sm" onClick={expand}>
            View larger
          </Button>
        </div>
        <button
          type="button"
          onClick={expand}
          aria-label="View the invitation larger"
          className="mt-4 block w-full cursor-zoom-in rounded-lg text-left focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
        >
          <div className="rounded-lg shadow-[0_18px_40px_-16px_oklch(0.26_0.035_40/0.45)] transition-shadow hover:shadow-[0_24px_48px_-16px_oklch(0.26_0.035_40/0.5)]">
            <GoldenCallerCard card={card} forceOpen maxWidth="100%" />
          </div>
        </button>
        <p className="mt-3 text-center text-sm text-muted-foreground">What your guests see</p>
      </section>

      <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
        <Button variant="primary" className="w-full" onClick={expand}>
          Preview invitation
        </Button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Invitation preview"
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setOpen(false)}
            className="absolute inset-0 w-full cursor-default bg-foreground/50 backdrop-blur-[2px]"
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-4 sm:p-8">
            <div className="pointer-events-auto grid w-full max-w-[min(94vw,42rem)] gap-3">
              <div className="flex items-center gap-3 text-background">
                <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <span className="text-sm font-medium">Preview</span>
              </div>
              <div className="grid place-items-center overflow-y-auto rounded-lg shadow-2xl">
                <GoldenCallerCard card={card} forceOpen maxWidth={LARGE_PREVIEW_MAX_WIDTH} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-foreground/10 pt-6">
      <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Native disclosure: keyboard and screen-reader behaviour for free. Closed keeps the page short. */
function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-t border-foreground/10">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-sm py-3 font-display text-lg font-semibold tracking-[-0.02em] focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
        >
          <path d="M4 6.5 8 10.5 12 6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="grid gap-5 pb-4">{children}</div>
    </details>
  );
}

function CopyArea({
  label,
  placeholder,
  value,
  max,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className={FIELD_LABEL}>
      {label}
      <textarea
        placeholder={placeholder}
        rows={2}
        maxLength={max}
        className={COPY_AREA}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Text({
  label,
  value,
  max,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
} & Omit<ComponentProps<typeof Input>, "label" | "value" | "onChange" | "maxLength">) {
  return <Input label={label} maxLength={max} value={value} onChange={onChange} {...rest} />;
}

function ListEditor<T>({
  title,
  max,
  min = 0,
  items,
  empty,
  onChange,
  render,
}: {
  title: string;
  max: number;
  min?: number;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {items.length < max ? (
          <Button variant="secondary" size="sm" onClick={() => onChange([...items, empty])}>
            + Add
          </Button>
        ) : null}
      </div>
      {items.length > 0 ? (
        <div className="grid divide-y divide-foreground/10 border-y border-foreground/10">
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 py-3">
              {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
              {items.length > min ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
