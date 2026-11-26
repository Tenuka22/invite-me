import { NotFoundMagnetic } from "@invite-me/ui/components/motion/not-found/magnetic";

/** Fallback for unknown URLs, in the host theme (cream paper, Fraunces, terracotta). */
export function NotFound() {
  return (
    <div className="host-app grid min-h-svh place-items-center">
      <NotFoundMagnetic
        title="This page doesn't exist"
        description="The link may be old or mistyped. If you were sent an invitation, ask the host for a fresh link."
        homeHref="/"
        homeLabel="Back home"
        browseHref="/invitations"
        browseLabel="My invitations"
      />
    </div>
  );
}
