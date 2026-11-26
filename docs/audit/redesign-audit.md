# Redesign audit (before)

Method: code read of every host screen (`apps/web/src/routes`, `components`, `presets`) merged with the brief's section 3 findings and the screenshots reported from the deployed build (home, template modal, invitation print dialog). Authenticated screens could not be captured at 360 / 768 / 1280px from this environment (sign-in is Google/GitHub only), so those widths are verified from layout code and re-checked after migration with the public routes (`/`, `/design`, `/login`, `/preview/*`).

## P0: blocks use or hides content

| # | Screen | Finding | Fix |
|---|---|---|---|
| 1 | Shell | The floating pill nav (`Dock`) and the "+" FAB cover guest rows, Copy link / Revoke and the print button. Per-page `pt-24`, `pb-44`, `pb-24` hacks. | One shell owns fixed bars and publishes `--header-h` / `--bottom-bar-h`; pages never pad themselves. |
| 2 | Print | Browser print ignored `@page` (A5 card on an A4 sheet, 2 pages, 70% scale); the main button was hidden behind the nav. | Server PDF (done), Print dialog with sticky Download PDF / Print. |
| 3 | Cards | Thumbnail, edit preview, print preview and guest view were four different renderings (different content, missing date, stray decorative circles/blobs). | One `InvitationCard` that renders the real artwork scaled by CSS. |
| 4 | Detail | Contradictory stats ("Confirmed 0/2" beside "Opened seats 2"). | One headline + progress bar and one mutually exclusive status set with definitions. |
| 5 | Guests | Viewer could change the design of the host's card (theme), and the host option to allow it. | Removed; only the owner changes design. |
| 6 | Touch | Row actions (Copy link, Revoke) were small and crowded by the nav; raw monospace URL in every row. | 44px icon buttons, link only in a Popover. |

## P1: confusing or inconsistent

| # | Screen | Finding | Fix |
|---|---|---|---|
| 7 | Home | A template catalogue with a huge "Welcome back"; own invitations below the fold; "MR. XXX & MRS. XXXX" placeholders. | Your invitations first with reply summary and status; templates in the New invitation dialog with real previews; empty state shows templates. |
| 8 | Header | Duplicate "New invitation" button plus a "+" FAB; mobile-style nav on desktop. | Header icon button (<md) / one button (md+); tab bar only <md. |
| 9 | Add guest | One long scrolling form; placeholders look like filled values. | Essentials + More options, "e.g." placeholders, success state with link. |
| 10 | Edit | Five-step wizard with tabs and Back/Next/Save, different on mobile and desktop; five tall radio cards for hosts; generic "line 1/2" labels. | One preview-first screen, Customize rows into dialogs, Select for hosts with concrete roles, autosave. |
| 11 | Print | A page of oversized radio cards. | Dialog with segmented size/direction, Switch for marks. |
| 12 | Controls | Ad-hoc modals, radio-cards, tabs and menus built from the motion components with long per-use class overrides (`[&_legend]:...`). | Base UI primitives in `components/ui`. |
| 13 | Tokens | Colours, radii and type sizes were arbitrary (`rounded-[1.6rem]`, `text-[11px]`, raw oklch). | Tokens in `styles/tokens.css`; only pill / xl / 2xl / 3xl radii. |

## P2: polish

| # | Finding | Fix |
|---|---|---|
| 14 | Primary text on terracotta was 4.4:1; muted/placeholder/gold text had no AA-safe role. | Primary 0.02 darker; `text-placeholder` and `accent-gold-text` roles. |
| 15 | Copy bugs: "Matheeshas parents", "9.28 PM TO 1.28 AM", year wrapped alone, "Beach Resort , Weligama". | Shared text helpers. |
| 16 | Heavy lists: four live thumbnails with endless animation (lag). | Lazy-mounted `InvitationCard`; no endless animation in stills. |
| 17 | Toasts: bespoke stack, no Undo pattern. | Base UI toast with action. |
| 18 | `/design` showcase absent. | Added (hidden, `noindex`). |
