import { Dock, DockItem } from "@invite-me/ui/components/motion/dock";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { MailOpen, Plus, UserRound } from "lucide-react";

/** Bottom navigation for the top-level signed-in pages. Everything else opens as its own sub page. */
export function HostDock() {
  const matchRoute = useMatchRoute();
  const onList = Boolean(matchRoute({ to: "/invitations", fuzzy: true }));

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto">
        <Dock size={48}>
          <DockItem active={onList} aria-label="Invitations">
            <Link
              to="/invitations"
              aria-label="Invitations"
              aria-current={onList ? "page" : undefined}
              className="flex size-full items-center justify-center rounded-full"
            >
              <MailOpen className="size-5" aria-hidden />
            </Link>
          </DockItem>
          <DockItem aria-label="New invitation">
            <Link
              to="/invitations/new"
              aria-label="New invitation"
              className="flex size-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Plus className="size-5" aria-hidden />
            </Link>
          </DockItem>
          <DockItem aria-label="Profile">
            <Link
              to="/profile"
              aria-label="Profile"
              className="flex size-full items-center justify-center rounded-full"
            >
              <UserRound className="size-5" aria-hidden />
            </Link>
          </DockItem>
        </Dock>
      </div>
    </nav>
  );
}
