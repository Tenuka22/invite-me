import { cn } from "@invite-me/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Mail, Plus, User } from "lucide-react";
import { type CSSProperties, type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Brand } from "@/components/brand";
import { NewInvitationDialog } from "@/components/new-invitation-dialog";
import { TooltipProvider, buttonStyles } from "@/components/ui";

type Tab = "home" | "invitations" | "profile";

function activeTab(pathname: string): Tab | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/invitations")) return "invitations";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

const NAV = [
  { tab: "home", to: "/", label: "Home", Icon: Home },
  { tab: "invitations", to: "/invitations", label: "Invitations", Icon: Mail },
  { tab: "profile", to: "/profile", label: "Profile", Icon: User },
] as const;

type Shell = { openNew: () => void; setFlowOn: (on: boolean) => void; slot: HTMLElement | null };
const ShellContext = createContext<Shell>({ openNew: () => {}, setFlowOn: () => {}, slot: null });
/** Opens the "New invitation" dialog from anywhere inside the shell. */
export function useNewInvitation() {
  return useContext(ShellContext).openNew;
}

/**
 * Actions for a focused task (edit card, add guest, print). Rendering this hides the tab bar and
 * shows a sticky action bar at the bottom on every screen size; the shell pads the page to match.
 */
export function FlowBar({ children }: { children: ReactNode }) {
  const { setFlowOn, slot } = useContext(ShellContext);
  useEffect(() => {
    setFlowOn(true);
    return () => setFlowOn(false);
  }, [setFlowOn]);
  return slot ? createPortal(children, slot) : null;
}

const TAB_BAR = "calc(4.25rem + env(safe-area-inset-bottom))";
const ACTION_BAR = "calc(4.5rem + env(safe-area-inset-bottom))";

/**
 * The one layout shell. It owns every fixed bar and publishes their heights as `--header-h` and
 * `--bottom-bar-h`; the page body pads itself with them, so nothing is ever covered.
 *
 * - below md: a top bar (brand, New invitation) and a bottom tab bar.
 * - md and up: a top bar with the nav links and one New invitation button.
 * - `flow`: focused tasks (edit, add guest, print) hide the tab bar and show their own action bar.
 */
export function HostShell({ children, signedIn = true }: { children: ReactNode; signedIn?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = activeTab(pathname);
  const [newOpen, setNewOpen] = useState(false);
  const [flowOn, setFlowOn] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const showTabs = signedIn && !flowOn;
  const bottom = flowOn ? ACTION_BAR : showTabs ? TAB_BAR : "0px";
  const shell = useMemo(() => ({ openNew: () => setNewOpen(true), setFlowOn, slot }), [slot]);

  return (
    <ShellContext.Provider value={shell}>
      <TooltipProvider>
        <div
          className="host-app flex min-h-dvh flex-col [--bottom-bar-h:var(--bar-small)] md:[--bottom-bar-h:var(--bar-wide)]"
          style={{ ["--bar-small" as string]: bottom, ["--bar-wide" as string]: flowOn ? ACTION_BAR : "0px" } as CSSProperties}
        >
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-pill focus:bg-surface-raised focus:px-4 focus:py-3 focus:shadow-overlay">
            Skip to content
          </a>
          <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm print:hidden" style={{ height: "var(--header-h)" }}>
            <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-(--page-gutter)">
              <Brand />
              {signedIn ? (
                <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
                  {NAV.map(({ tab, to, label }) => (
                    <Link
                      key={tab}
                      to={to}
                      aria-current={active === tab ? "page" : undefined}
                      className={cn("inline-flex min-h-11 items-center rounded-pill px-4 font-medium", active === tab ? "bg-primary-soft text-text" : "text-text-muted hover:text-text")}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              ) : null}
              {signedIn ? (
                <>
                  <button type="button" onClick={() => setNewOpen(true)} className={buttonStyles({ variant: "secondary", size: "icon", className: "md:hidden" })} aria-label="New invitation">
                    <Plus className="size-6" aria-hidden />
                  </button>
                  <button type="button" onClick={() => setNewOpen(true)} className={buttonStyles({ variant: "secondary", className: "hidden md:inline-flex" })}>
                    <Plus className="size-5" aria-hidden /> New invitation
                  </button>
                </>
              ) : (
                <Link to="/login" className={buttonStyles({ variant: "primary" })}>
                  Sign in
                </Link>
              )}
            </div>
          </header>

          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-(--page-gutter) pt-[calc(var(--header-h)+1.5rem)] outline-none print:max-w-none print:p-0"
            style={{ paddingBottom: "calc(var(--bottom-bar-h) + 2rem)" }}
          >
            {children}
          </main>

          {showTabs ? (
            <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden print:hidden">
              <ul className="mx-auto grid h-[4.25rem] max-w-md grid-cols-3">
                {NAV.map(({ tab, to, label, Icon }) => (
                  <li key={tab}>
                    <Link
                      to={to}
                      aria-current={active === tab ? "page" : undefined}
                      className={cn("grid h-full place-content-center justify-items-center gap-0.5 text-label font-medium", active === tab ? "text-primary" : "text-text-muted")}
                    >
                      <Icon className="size-6" strokeWidth={active === tab ? 2.2 : 1.8} aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {flowOn ? (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm print:hidden">
              <div ref={setSlot} className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-3 px-(--page-gutter)" />
            </div>
          ) : null}
        </div>
        <NewInvitationDialog open={newOpen} onOpenChange={setNewOpen} signedIn={signedIn} />
      </TooltipProvider>
    </ShellContext.Provider>
  );
}
