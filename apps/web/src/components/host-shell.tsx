import { Dock, DockItem } from "@invite-me/ui/components/motion/dock";
import { Link, type LinkProps, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Home, Mail, Plus, User } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { type ReactNode, useState } from "react";

import { Brand } from "@/components/brand";

type Tab = "home" | "invitations" | "profile";

function activeTab(pathname: string): Tab | null {
  if (pathname === "/") return "home";
  if (pathname === "/invitations/new") return null;
  if (pathname.startsWith("/invitations")) return "invitations";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

/** Top bar that slides away while you read down and comes back the moment you scroll up. */
function TopBar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (y < 80) setHidden(false);
    else if (y > previous + 4) setHidden(true);
    else if (y < previous - 4) setHidden(false);
  });
  return (
    <motion.header
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className="fixed inset-x-0 top-0 z-30 border-b bg-background print:hidden"
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <Brand />
        <Link
          to="/invitations/new"
          className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:inline-flex"
        >
          New invitation
        </Link>
      </div>
    </motion.header>
  );
}

function NavLink({
  to,
  label,
  Icon,
  active,
}: {
  to: "/" | "/invitations" | "/profile";
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <DockItem active={active}>
      <Link
        to={to}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`absolute inset-0 grid place-content-center justify-items-center gap-0.5 rounded-[1.4rem] text-[11px] font-medium active:scale-95 ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
        {label}
      </Link>
    </DockItem>
  );
}

/** App frame for hosts: a slide-away top bar and a big tab bar docked at the bottom. */
export function HostShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = activeTab(pathname);
  // Editing a card is a focused task with its own Save bar, so the tab bar steps aside.
  const focused = pathname.endsWith("/edit");

  return (
    <div className="host-app flex min-h-svh flex-col">
      <TopBar />
      <main className={`mx-auto w-full max-w-6xl flex-1 px-5 pt-24 print:max-w-none print:p-0 ${focused ? "pb-24" : "pb-44"}`}>
        {children}
        <p className="mt-16 text-center text-sm text-muted-foreground print:hidden">Made by Tenuka22</p>
      </main>
      {focused ? null : (
        <nav aria-label="Main" className="print:hidden fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Dock size={68} className="items-center gap-1 rounded-[2.2rem] p-2 shadow-[0_18px_40px_-16px_rgb(60_30_10/0.35)]">
            <NavLink to="/" label="Home" Icon={Home} active={active === "home"} />
            <NavLink to="/invitations" label="Invitations" Icon={Mail} active={active === "invitations"} />
            <DockItem className="mx-1">
              <Link
                to="/invitations/new"
                aria-label="New invitation"
                className="absolute inset-0 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
              >
                <Plus className="size-8" aria-hidden />
              </Link>
            </DockItem>
            <NavLink to="/profile" label="Profile" Icon={User} active={active === "profile"} />
          </Dock>
        </nav>
      )}
    </div>
  );
}

/** Title row for inner pages: a round back button and the page title. */
export function PageTitle({ back, title, sub }: { back?: LinkProps; title: string; sub?: string }) {
  return (
    <div className="mb-6 grid gap-2">
      {back ? (
        <Link {...back} aria-label="Back" className="grid size-12 place-items-center rounded-full border bg-card shadow-sm active:scale-95">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      ) : null}
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {sub ? <p className="text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
