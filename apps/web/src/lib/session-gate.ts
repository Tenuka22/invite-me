/**
 * The signed-in pages check the session on every navigation. That is a network round trip, so a recent
 * confirmation is reused for a minute. Signing out clears it, and the server still checks every request.
 */
const FRESH_MS = 60_000;
let confirmedAt = 0;

export const sessionGate = {
  isFresh: () => Date.now() - confirmedAt < FRESH_MS,
  confirm: () => {
    confirmedAt = Date.now();
  },
  clear: () => {
    confirmedAt = 0;
  },
};
