"use client";
// Single-date picker composed from beui.dev/components/motion/date-range-picker.

import { CalendarDays, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import {
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerContent,
  DateRangePickerGrid,
  DateRangePickerHeader,
  DateRangePickerTrigger,
} from "@invite-me/ui/components/motion/date-range-picker";
import { cn } from "@invite-me/ui/lib/utils";

export interface DatePickerProps {
  label: string;
  /** Calendar date as `YYYY-MM-DD`, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the calendar closes, so a form can tell the field was visited. */
  onClose?: () => void;
  placeholder?: string;
  error?: string;
  min?: string;
  max?: string;
  locale?: string;
  className?: string;
}

/**
 * The range picker with one day in it: a "range" whose start and end are the same date, so every
 * click replaces the date and closes the calendar.
 */
export function DatePicker({
  label,
  value,
  onChange,
  onClose,
  placeholder = "Pick a date",
  error,
  min,
  max,
  locale = "en-GB",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const errorId = useId();
  const shown = value
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${value}T00:00:00Z`),
      )
    : null;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="px-1 text-base font-semibold">{label}</span>
      <DateRangePicker
        label={label}
        value={value ? { from: value, to: value } : null}
        onValueChange={(range) => {
          onChange(range?.from ?? "");
          if (range) setOpen(false);
        }}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onClose?.();
        }}
        min={min}
        max={max}
        locale={locale}
        showSummary={false}
      >
        <DateRangePickerTrigger
          aria-label={`${label}: ${shown ?? "not set"}`}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "!h-14 w-full justify-between gap-3 !rounded-full !border !border-foreground/25 bg-card !px-5 text-lg font-normal hover:bg-card",
            error && "border-destructive",
          )}
        >
          <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className={cn("min-w-0 flex-1 truncate pl-1 text-left", !shown && "text-muted-foreground")}>
            {shown ?? placeholder}
          </span>
          <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground", open && "rotate-180")} aria-hidden />
        </DateRangePickerTrigger>
        <DateRangePickerContent>
          <DateRangePickerCalendar
            showSummary={false}
            className={cn(
              "w-full rounded-none border-0 p-4",
              "[&_button]:text-base [&_td]:h-10 [&_th]:text-sm [&_td>button]:h-10 [&_td>button]:max-w-10 [&_td>button]:text-base",
              "[&_td_button.bg-foreground]:!bg-[oklch(0.56_0.16_35)] [&_td_button.bg-foreground]:!text-white",
              "[&_div>div>button]:min-h-11 [&_div>div:last-child>button]:size-11",
            )}
          >
            <DateRangePickerHeader />
            <DateRangePickerGrid />
          </DateRangePickerCalendar>
        </DateRangePickerContent>
      </DateRangePicker>
      {error ? (
        <p id={errorId} className="px-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
