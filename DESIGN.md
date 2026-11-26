---
name: Invite Me (host app)
description: A calm, warm, traditional-but-premium app for couples to build and send wedding invitations.
colors:
  background: "oklch(0.975 0.014 85)"
  surface: "oklch(0.99 0.008 85)"
  surface-raised: "oklch(0.997 0.004 85)"
  border: "oklch(0.9 0.02 75)"
  border-strong: "oklch(0.62 0.03 60)"
  text: "oklch(0.26 0.035 40)"
  text-muted: "oklch(0.47 0.03 50)"
  text-placeholder: "oklch(0.52 0.025 50)"
  primary: "oklch(0.54 0.16 35)"
  primary-hover: "oklch(0.49 0.16 35)"
  primary-foreground: "oklch(0.985 0.01 85)"
  primary-soft: "oklch(0.94 0.03 55)"
  accent-gold: "oklch(0.66 0.11 85)"
  accent-gold-text: "oklch(0.5 0.09 80)"
  success: "oklch(0.45 0.1 150)"
  warning: "oklch(0.48 0.11 70)"
  danger: "oklch(0.5 0.17 27)"
  focus-ring: "oklch(0.45 0.13 35)"
typography:
  display:
    fontFamily: "Fraunces Variable, Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.5rem + 1vw, 2.25rem)"
    fontWeight: 450
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Fraunces Variable, Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 450
    lineHeight: 1.25
  body:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, Noto Sans Sinhala, Noto Sans Tamil, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.35
rounded:
  pill: "9999px"
  xl: "0.875rem"
  2xl: "1.25rem"
  3xl: "1.75rem"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "24px"
  header-mobile: "56px"
  header-desktop: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    height: "48px"
  card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.2xl}"
  dialog:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.3xl}"
---

# Design system: Invite Me (host app)

## Overview

Warm ivory paper, dark-brown ink, a terracotta primary and gold only as an accent. Serif (Fraunces) is for the page title and section titles; everything else is Inter. The app is calm and unhurried: one primary action per screen, generous touch targets, and advanced controls tucked into menus, dialogs and collapsibles. It is the opposite of a dashboard or a wizard. The invitation artwork (Golden Caller, Beira Dusk, Ceylon Block Print, Sanni Tiles) and the guest pages keep their own looks and are not part of this system.

## Colors

Roles live in `apps/web/src/styles/tokens.css` under `.host-app` and are exposed to Tailwind as `bg-surface`, `text-text-muted`, `bg-primary`, `text-accent-gold-text` and so on. Nothing in a host screen uses a raw colour.

- Text on the ivory background is `text` (about 14:1) or `text-muted` (about 6.5:1). Placeholders use `text-placeholder` (5:1) and always read "e.g. ...".
- White text on `primary` is 4.9:1. The primary is 0.02 darker than the earlier terracotta for that reason.
- Gold is decoration. Small gold text uses `accent-gold-text`, never `accent-gold`.
- Status is never colour alone: every Badge pairs an icon with a label (success, warning, danger, info, neutral).

## Typography

Page title: `text-display`, one per page. Section titles: `text-section`. Body and form text: `text-body` (16px minimum). Labels and helper text: `text-label` (14px). No host text is smaller than 14px. Sinhala and Tamil fall back to Noto fonts, and long words wrap (`overflow-wrap: anywhere`); never truncate names to a fixed width.

## Layout

One shell (`components/host-shell.tsx`) owns every fixed bar and publishes `--header-h` and `--bottom-bar-h`; the page body pads itself with them, so nothing is ever covered. Below `md`: top bar (brand, New invitation icon) and a bottom tab bar (Home, Invitations, Profile). From `md`: top bar with nav links and one New invitation button, no tab bar. Focused tasks (edit card, add guest, print) render `<FlowBar>`, a sticky action bar on every width that replaces the tab bar. Content is `max-w-6xl`, gutters 16px (24px from md). Layouts hold at 360px and at 200% text zoom without horizontal scroll.

## Elevation & Depth

Three shadows only: `shadow-raised` (buttons, selected tabs), `shadow-overlay` (menus, popovers, dialogs, toasts) and `shadow-sheet`. Surfaces are told apart by border and tone first, shadow second.

## Shapes

Radii come from a closed scale: pill (buttons, chips, tabs, badges), xl (inputs, selects), 2xl (cards, list rows), 3xl (dialogs and sheets). No arbitrary radii.

## Components

All primitives live in `apps/web/src/components/ui/` as thin styled wrappers on Base UI (`@base-ui/react`), styled with its data attributes (`data-[checked]`, `data-[pressed]`, `data-[open]`, `data-[starting-style]`). A live showcase is at `/design`.

- Button: primary, secondary, ghost, danger; 44px minimum; `loading` shows a spinner and blocks repeat presses. Use `buttonStyles()` for router Links.
- Dialog: a bottom sheet below `md`, a centred dialog from `md`, with a sticky footer for actions. AlertDialog is only for irreversible actions; prefer an Undo toast.
- Field: label always visible, helper text, inline error linked with `aria-describedby`.
- Menu, Popover, Tooltip, Tabs, Select, RadioGroup (rows of 56px or more), SegmentedControl, FilterChips, Switch, Checkbox, NumberField (48px steppers), Collapsible, Accordion, Progress, Avatar, Toast, Skeleton, EmptyState, PageHeader.
- InvitationCard (`components/invitation-card.tsx`) is the only way a card is drawn in the host app: thumbnails, previews and print previews scale the design's own artwork with a CSS transform.

## Do's and Don'ts

- Do give each screen one primary action; do move everything else into a menu, dialog or "More options".
- Do toast every mutation, with Undo where it can be undone.
- Do keep copy short, friendly and in sentence case ("Add guest").
- Don't use hover-only controls, placeholder-only labels, or colour-only status.
- Don't add fixed bars or padding hacks in pages; the shell owns them.
- Don't add a second card renderer, or re-lay-out the artwork per size.
- Don't use radii, shadows or type sizes outside the scales above.
