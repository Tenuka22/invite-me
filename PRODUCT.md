# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Hosts:** a bride and/or groom in Sri Lanka building their wedding invitation on a phone, with or without an account. They add guests one party at a time (single, couple, group) and send each party its own link.
- **Guests:** relatives and friends opening their personal link, mostly by tapping it in WhatsApp on a phone; some open it on a desktop. Ages range from teens to older family. When adding a guest the host records an age group (teen, adult, 40s, elder, family) so the page can address them suitably.

## Product Purpose

Let a couple go from nothing to a shareable, personal wedding invitation in minutes, and see who opened it and who is coming. Success: every guest understands who is inviting them, to whose wedding, when and where, and answers the RSVP without help.

## Positioning

Each guest party gets its own unguessable link that shows only what concerns them (how they are invited, seat, notes), built from a designed preset rather than a template form.

## Operating Context

Links travel through WhatsApp. Guests read on small phones, often outdoors or in bright rooms, and some are older readers. Hosts work from the dashboard: guests list with live open/RSVP meter, and the card editor.

## Capabilities and Constraints

- Presets live in `apps/web/src/presets/<preset>/`; each preset owns its guest page, its look options, and its editor fields. Golden Caller stays; new presets are added beside it.
- Venue location: the host pastes a Google Maps link; the guest page shows a map from it and an "Open in Google Maps" action. Map tiles are free OpenStreetMap tiles via Leaflet (as in the school-admissions project).
- English + Sinhala are planned; v1 copy is English.
- No pictures on the guest page: no photos or picture illustrations. Geometry, pattern and type only.
- Calm, quiet background music per preset is allowed; it must never autoplay with sound before the guest chooses it.
- Guest pages carry no InviteMe branding except a small footer (InviteMe, "Built by Tenu22").

## Brand Commitments

Sri Lankan heritage references the user chose for the new invitation: the moonstone (sandakada pahana), Gangaramaya temple at dusk, the Geoffrey Bawa trail poster (laterite red, lime-washed white, tropical green, editorial serif), and the red-and-white Kolam/Raksha dance costume.

## Evidence on Hand

Sample card content in `packages/api/src/invites/card.ts` (`DEFAULT_CARD`). No real couple names, venues, photographs, or music files have been supplied; anything shown in prototypes is sample content.

## Product Principles

1. The guest's questions come first: who invites me, to whose wedding, when, where, how do I reply.
2. Personal, not generic: the page speaks to this party (name, how they are invited, seat, notes).
3. Legible for every guest, including older readers on small phones.
4. Ceremony without clutter: motion and sound are invited, never imposed.
