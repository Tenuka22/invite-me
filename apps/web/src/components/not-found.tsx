import { NotFoundMagnetic } from "@invite-me/ui/components/motion/not-found/magnetic";

/** Fallback for unknown URLs, in the host theme (cream paper, Fraunces, terracotta). */
export function NotFound({
  title = "This page doesn't exist",
  description = "The link may be old or mistyped. If you were sent an invitation, ask the host for a fresh link.",
  inline = false,
}: {
  title?: string;
  description?: string;
  /** Inside the host app frame: no full-screen height. */
  inline?: boolean;
} = {}) {
  return (
    <div className={`host-app grid place-items-center ${inline ? "py-10" : "min-h-svh"}`}>
      <NotFoundMagnetic
        title={title}
        description={description}
        homeHref="/"
        homeLabel="Back home"
        browseHref="/invitations"
        browseLabel="My invitations"
      />
    </div>
  );
}
