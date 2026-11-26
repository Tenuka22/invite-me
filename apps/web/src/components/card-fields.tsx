import { CONNECTORS, type Card, HOST_MODES, type HostMode, OCCASION_PHRASES, REQUEST_PHRASES } from "@invite-me/api/invites/card";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button, Field, Input, Select } from "@/components/ui";
import { orpc } from "@/utils/orpc";

/** A visible label, optional hint and inline error around one text input. */
export function TextField({
  label,
  value,
  max,
  onChange,
  type,
  placeholder,
  description,
  error,
  optional,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  optional?: boolean;
  inputMode?: "text" | "tel" | "url";
  autoComplete?: string;
}) {
  return (
    <Field label={label} description={description} error={error} optional={optional}>
      <Input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={max}
        value={value}
        onValueChange={onChange}
      />
    </Field>
  );
}

export const HOST_CHOICES: Record<HostMode, { label: string; hint: string }> = {
  parents: { label: "Both parents", hint: "One line for the parents, like Mr. & Mrs. Perera" },
  parent: { label: "One parent", hint: "A single parent, like Mrs. Perera" },
  families: { label: "Two families", hint: "Both sides named, like the bride's and groom's parents" },
  host: { label: "A host or family", hint: "Someone else is inviting, like The Perera Family" },
  none: { label: "No host", hint: "The card opens with the couple's names" },
};

const HOST_OPTIONS = HOST_MODES.map((m) => ({ value: m, label: HOST_CHOICES[m].label, description: HOST_CHOICES[m].hint }));

const HOST_ROLE: Record<Exclude<HostMode, "none" | "families">, { label: string; placeholder: string }> = {
  parents: { label: "Parents", placeholder: "e.g. Mr. & Mrs. Perera" },
  parent: { label: "Parent", placeholder: "e.g. Mrs. Perera" },
  host: { label: "Host or family", placeholder: "e.g. The Perera Family" },
};

/** Who is inviting: pick the shape in a Select, then fill the lines it needs, named by role. */
export function HostFields({ card, set }: { card: Card; set: <K extends keyof Card>(key: K, value: Card[K]) => void }) {
  const mode = card.hostMode;
  return (
    <div className="grid gap-5">
      <Field label="Who is inviting?" description={HOST_CHOICES[mode].hint}>
        <Select value={mode} onValueChange={(v) => set("hostMode", v as HostMode)} options={HOST_OPTIONS} aria-label="Who is inviting" />
      </Field>

      {mode === "none" ? null : mode === "families" ? (
        <>
          <TextField label="Bride's parents" placeholder="e.g. Mr. & Mrs. Perera" value={card.hostLine1} max={80} onChange={(v) => set("hostLine1", v)} />
          <Field label="Joined by">
            <Select
              value={card.connector || "__none"}
              onValueChange={(v) => set("connector", v === "__none" ? "" : v)}
              options={[{ value: "__none", label: "Nothing" }, ...CONNECTORS.map((c) => ({ value: c, label: sentence(c) }))]}
              aria-label="Joining word"
            />
          </Field>
          <TextField label="Groom's parents" placeholder="e.g. Mr. & Mrs. Silva" value={card.hostLine2} max={80} onChange={(v) => set("hostLine2", v)} />
        </>
      ) : (
        <TextField
          label={HOST_ROLE[mode].label}
          placeholder={HOST_ROLE[mode].placeholder}
          value={card.hostLine1}
          max={80}
          onChange={(v) => set("hostLine1", v)}
        />
      )}
    </div>
  );
}

const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** The two wording lines of the card. */
export function WordingFields({ card, set }: { card: Card; set: <K extends keyof Card>(key: K, value: Card[K]) => void }) {
  return (
    <div className="grid gap-5">
      <Choice label="The invitation" value={card.requestLine} options={[...REQUEST_PHRASES]} onChange={(v) => set("requestLine", v)} />
      <Choice label="The occasion" value={card.occasionLine} options={[...OCCASION_PHRASES]} onChange={(v) => set("occasionLine", v)} max={160} />
    </div>
  );
}

const AUTO = "__auto";
const CUSTOM = "__custom";

/** Pick ready-made wording, leave it on automatic, or write your own. */
function Choice({ value, options, onChange, label, max = 120 }: { value: string; options: string[]; onChange: (value: string) => void; label: string; max?: number }) {
  const matches = options.includes(value);
  const [custom, setCustom] = useState(Boolean(value) && !matches);
  const current = custom ? CUSTOM : value === "" ? AUTO : matches ? value : CUSTOM;
  return (
    <div className="grid gap-3">
      <Field label={label} description={current === AUTO ? "Automatic picks wording that fits your host choice." : undefined}>
        <Select
          aria-label={label}
          value={current}
          options={[
            { value: AUTO, label: "Automatic" },
            ...options.map((o) => ({ value: o, label: sentence(o) })),
            { value: CUSTOM, label: "Write my own" },
          ]}
          onValueChange={(v) => {
            if (v === AUTO) {
              setCustom(false);
              onChange("");
            } else if (v === CUSTOM) {
              setCustom(true);
            } else {
              setCustom(false);
              onChange(v);
            }
          }}
        />
      </Field>
      {current === CUSTOM ? <TextField label="Your wording" value={value} max={max} onChange={onChange} /> : null}
    </div>
  );
}

/** Paste a Google Maps link; the server reads the coordinates so guests see a map. */
export function MapsLinkField({ url, geo, onChange }: { url: string; geo: Card["venueGeo"]; onChange: (url: string, geo: Card["venueGeo"]) => void }) {
  const [text, setText] = useState(url);
  const resolve = useMutation(
    orpc.invitations.resolveMaps.mutationOptions({
      onSuccess: (point, vars) => onChange(vars.url, point),
      onError: () => onChange(text.trim(), null),
    }),
  );
  function commit() {
    const next = text.trim();
    if (next === url && geo) return;
    if (!next) return onChange("", null);
    resolve.mutate({ url: next });
  }
  const error = resolve.isError ? resolve.error.message : undefined;
  return (
    <Field
      label="Google Maps link"
      optional
      error={error}
      description={
        resolve.isPending
          ? "Finding the place…"
          : geo && text.trim() === url
            ? "Map pinned. Guests can open it in Google Maps."
            : "In Google Maps, open the venue, tap Share, then Copy link, and paste it here."
      }
    >
      <Input
        type="url"
        inputMode="url"
        placeholder="e.g. https://maps.app.goo.gl/…"
        maxLength={500}
        value={text}
        onValueChange={setText}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </Field>
  );
}

/** A short list the host can grow, shown as rows with one remove button each. */
export function ListEditor<T>({
  addLabel,
  removeLabel = "Remove",
  max,
  min = 0,
  items,
  empty,
  onChange,
  render,
}: {
  addLabel: string;
  removeLabel?: string;
  max: number;
  min?: number;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void, index: number) => ReactNode;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item, i) => (
        <div key={i} className="grid gap-3 rounded-2xl border border-border bg-surface p-4">
          {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))), i)}
          {items.length > min ? (
            <Button variant="ghost" icon={<Trash2 className="size-5" aria-hidden />} className="justify-self-start" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              {removeLabel}
            </Button>
          ) : null}
        </div>
      ))}
      {items.length < max ? (
        <Button variant="secondary" icon={<Plus className="size-5" aria-hidden />} className="justify-self-start" onClick={() => onChange([...items, empty])}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}

