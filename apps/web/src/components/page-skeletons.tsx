import type { ReactNode } from "react";

import { Skeleton } from "@/components/skeleton";

/** Meaningful status for screen readers while a page's shapes are placeholders. */
function Status({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Signed-in page placeholder, picked from the destination path so the loading frame already has
 * that page's shape. Used while the session is checked, before the page itself mounts.
 */
export function HostPageSkeleton({ pathname }: { pathname: string }) {
  const path = pathname.replace(/\/+$/, "");
  if (path === "/invitations/new") return <NewInvitationSkeleton />;
  if (path === "/invitations") return <InvitationsSkeleton />;

  const invitation = path.match(/^\/invitations\/[^/]+(?:\/(edit))?$/);
  if (invitation) {
    if (invitation[1] === "edit") return <EditorSkeleton />;
    return <OverviewSkeleton />;
  }
  return <GenericPageSkeleton />;
}

/** Title, a few rows, a list. Fallback for signed-in paths without a page-specific shape. */
function GenericPageSkeleton() {
  return (
    <Status label="Loading page">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-3 w-64 max-w-full" />
        <div className="mt-8 grid gap-3 border-t border-foreground/10 pt-6">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center justify-between gap-4 py-3">
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </Status>
  );
}

/** Invitations list: title and New button, then the rows. */
export function InvitationsSkeleton() {
  return (
    <Status label="Loading invitations">
      <main className="mx-auto w-full max-w-5xl px-6 pt-8 md:pt-12">
        <Skeleton className="h-10 w-56" />
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item}>
              <Skeleton className="aspect-[0.706] w-full rounded-lg" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
        </div>
      </main>
    </Status>
  );
}

/** New invitation: back link and heading, the template cards, then the create row. */
export function NewInvitationSkeleton() {
  return (
    <Status label="Loading templates">
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-7 w-44" />
        <Skeleton className="mt-2 h-3 w-80 max-w-full" />
        <div className="mt-8 grid gap-4">
          {[0, 1].map((row) => (
            <Skeleton key={row} className="h-48 rounded-xl" />
          ))}
        </div>
        <div className="mt-8 flex items-center gap-4">
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </main>
    </Status>
  );
}

/** Overview: title, then the card thumbnail beside date, replies and guests. */
function OverviewSkeleton() {
  return (
    <Status label="Loading invitation">
      <main className="mx-auto w-full max-w-6xl px-6 pt-4 pb-16">
        <Skeleton className="h-9 w-72 max-w-full" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
          <Skeleton className="mx-auto aspect-[0.706] w-48 rounded-lg lg:mx-0 lg:w-full" />
          <div className="grid content-start gap-10">
            <div className="grid gap-2">
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid gap-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </div>
      </main>
    </Status>
  );
}

/**
 * The portrait card keeps a 0.706 width:height ratio. The editor sizes its preview column from the
 * same expression, so the skeleton and the loaded card take the same width and nothing shifts.
 */
export const PREVIEW_WIDTH = "min(calc((100svh - 11rem) * 0.706), 40vw)";

/** Editor body: save status, the form sections, then the preview column. */
export function EditorSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16">
        <div className="grid content-start gap-7">
          <div className="grid gap-4 border-t border-foreground/10 pt-5">
            <Skeleton className="h-3 w-20" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
          <div className="grid gap-4 border-t border-foreground/10 pt-5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-10 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
          <div className="grid gap-4 border-t border-foreground/10 pt-5">
            <Skeleton className="h-3 w-24" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>
        <div className="hidden justify-self-start rounded-2xl bg-muted/50 p-3 lg:block">
          <Skeleton className="aspect-[0.706] rounded-xl" style={{ width: PREVIEW_WIDTH }} />
        </div>
      </div>
    </div>
  );
}

/** Sign-in methods, so the form does not appear out of an empty screen. */
export function LoginSkeleton() {
  return (
    <Status label="Loading sign in">
      <main className="grid min-h-svh place-items-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-56" />
          <div className="mt-10 grid gap-3">
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
          </div>
        </div>
      </main>
    </Status>
  );
}

/** Guest invitation: the portrait card plus the RSVP block. */
export function GuestInviteSkeleton() {
  return (
    <Status label="Loading invitation">
      <main className="mx-auto w-full max-w-md px-3 py-4 lg:max-w-none">
        <Skeleton className="mx-auto mb-3 h-3 w-28" />
        <Skeleton className="aspect-[1075/1523] w-full max-w-[min(900px,calc((100svh-1.5rem)*0.706))] rounded-sm" />
        <Skeleton className="mt-6 h-40 rounded-lg" />
      </main>
    </Status>
  );
}
