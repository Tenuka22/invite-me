import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { HostDock } from "@/components/host-dock";

type SubPage = {
  title: string;
  description?: string;
  back: string;
  /** Wide pages (the editor) keep a compact title beside the back button. */
  width: "narrow" | "wide";
};

/** Pages that open on their own: a back button and a title, no dock. */
function subPage(pathname: string): SubPage | null {
  if (pathname === "/profile")
    return { title: "Profile", description: "Your account on Invite Me.", back: "/invitations", width: "narrow" };
  if (pathname === "/invitations/new")
    return {
      title: "New invitation",
      description: "Pick a template. You can change every word on it afterwards.",
      back: "/invitations",
      width: "narrow",
    };
  const guestPage = pathname.match(/^\/invitations\/([^/]+)\/guest\/[^/]+$/);
  if (guestPage)
    return {
      title: "Guest",
      description: "Their link, details, and removal.",
      back: `/invitations/${guestPage[1]}`,
      width: "narrow",
    };
  const match = pathname.match(/^\/invitations\/([^/]+)\/(add-guest|edit)$/);
  if (!match) return null;
  const [, id, page] = match;
  if (page === "add-guest")
    return {
      title: "Add guest",
      description: "Each guest gets their own link, so you can see who opened it and who replied.",
      back: `/invitations/${id}`,
      width: "narrow",
    };
  return { title: "Invitation card", back: `/invitations/${id}`, width: "wide" };
}

/** Shell shared by every signed-in page, so loading and ready states keep the same frame. */
export function HostShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sub = subPage(pathname);

  if (sub) {
    const wide = sub.width === "wide";
    const frame = wide ? "max-w-6xl" : "max-w-xl";
    return (
      <div className={wide ? "min-h-svh pb-28" : "min-h-svh pb-12"}>
        <header className={`mx-auto flex h-20 w-full items-center gap-4 px-6 ${frame}`}>
          <Link
            to={sub.back}
            aria-label="Back"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          {wide ? <h1 className="font-display text-2xl tracking-[-0.02em]">{sub.title}</h1> : null}
        </header>
        <main className={`mx-auto w-full px-6 ${frame}`}>
          {wide ? null : (
            <>
              <h1 className="font-display text-4xl tracking-[-0.02em] text-balance">{sub.title}</h1>
              {sub.description ? (
                <p className="mt-2 text-pretty text-muted-foreground">{sub.description}</p>
              ) : null}
            </>
          )}
          <div className={wide ? "mt-4" : "mt-8"}>{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-svh pt-6 pb-28">
      {children}
      <HostDock />
    </div>
  );
}
