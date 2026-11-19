import type { Party } from "./party";

export type Meter = {
  /** Seats allotted to active (non-revoked) parties. */
  allottedSeats: number;
  /** Head-count confirmed by `yes` RSVPs: the headline number. */
  confirmedSeats: number;
  /** Seats of parties that have opened the invite: the marker on the gauge. */
  openedSeats: number;
  maybe: number;
  no: number;
  notOpened: number;
  notShared: number;
};

export function computeMeter(parties: readonly Party[]): Meter {
  const meter: Meter = {
    allottedSeats: 0,
    confirmedSeats: 0,
    openedSeats: 0,
    maybe: 0,
    no: 0,
    notOpened: 0,
    notShared: 0,
  };
  for (const party of parties) {
    if (party.revoked) continue;
    meter.allottedSeats += party.seats;
    meter.confirmedSeats += party.confirmedSeats;
    if (party.opens > 0) meter.openedSeats += party.seats;
    else meter.notOpened += 1;
    if (party.rsvp === "maybe") meter.maybe += 1;
    if (party.rsvp === "no") meter.no += 1;
    if (!party.shared) meter.notShared += 1;
  }
  return meter;
}
