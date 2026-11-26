import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";

import { type Look, type LookOption, resolveLook } from "./look";

/** Renders every look option a preset declares; nothing here is preset-specific. */
export function LookPicker({
  options,
  look,
  onChange,
}: {
  options: readonly LookOption[];
  look: Look | undefined;
  onChange: (next: Look) => void;
}) {
  const current = resolveLook(options, look);
  return (
    <div className="grid gap-5">
      {options.map((option) => (
        <fieldset key={option.key} className="grid gap-2">
          <legend className="px-1 text-sm font-medium">{option.label}</legend>
          {option.hint ? <p className="px-1 text-xs text-muted-foreground">{option.hint}</p> : null}
          <RadioGroup
            aria-label={option.label}
            orientation="horizontal"
            className="flex-wrap gap-x-5 gap-y-2"
            value={current[option.key]}
            onValueChange={(value) => onChange({ ...current, [option.key]: value })}
          >
            {option.choices.map((choice) => (
              <RadioGroupItem key={choice.value} value={choice.value} label={choice.label} />
            ))}
          </RadioGroup>
        </fieldset>
      ))}
    </div>
  );
}
