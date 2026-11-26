import type { Card } from "@invite-me/api/invites/card";
import type { AgeGroup } from "@invite-me/api/invites/party";
import type { ComponentType } from "react";

import type { LookOption } from "./look";

export type RsvpAnswer = "yes" | "maybe" | "no";

/** What a guest page knows about the party it is addressed to. */
export type GuestPartyView = {
  displayName: string;
  ageGroup: AgeGroup | null;
  seats: number;
  seatLabel: string | null;
  rules: string | null;
};

export type GuestPageProps = {
  card: Card;
  party: GuestPartyView;
  /** Current reply: pending, yes, maybe or no. */
  answer: string;
  /** The reply being saved, while the request is in flight. */
  pending?: RsvpAnswer;
  onAnswer: (status: RsvpAnswer, headCount: number) => void;
  /**
   * Light version for previews: no map, music, motion or first-visit guide, so it paints fast.
   * The full version is the same page without this flag.
   */
  lite?: boolean;
  /** Printed copy: no buttons, and an empty "Invited" line when no guest is chosen. */
  print?: boolean;
};

export type Preset = {
  name: string;
  /** One line for the host choosing a design. */
  blurb: string;
  lookOptions: readonly LookOption[];
  /** One single-screen card per orientation: portrait is centred, landscape is split left and right. */
  GuestPage: ComponentType<GuestPageProps>;
};
