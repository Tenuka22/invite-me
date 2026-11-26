import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui";

export { Skeleton };

function Busy({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

const TILES = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

function TileSkeleton() {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-4 rounded-2xl border border-border bg-surface-raised p-3">
      <Skeleton className="aspect-[9/16] w-full" />
      <div className="grid content-start gap-3 py-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-7 w-24 rounded-pill" />
      </div>
    </div>
  );
}

/** Stands in for the list of invitation tiles. */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Busy label="Loading invitations" className={TILES}>
      {Array.from({ length: count }, (_, i) => (
        <TileSkeleton key={i} />
      ))}
    </Busy>
  );
}

/** Default while any route loads. */
export function PageSkeleton() {
  return (
    <Busy label="Loading">
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
      </div>
    </Busy>
  );
}

/** Invitation detail page while it loads. */
export function WorkspaceSkeleton() {
  return (
    <Busy label="Loading invitation">
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="mt-3 h-5 w-56 max-w-full" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Skeleton className="aspect-[9/16] w-full max-w-xs" />
        <div className="grid content-start gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </Busy>
  );
}

/** Card editor while it loads. */
export function EditorSkeleton() {
  return (
    <Busy label="Loading editor">
      <Skeleton className="h-10 w-56" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <Skeleton className="aspect-[9/16] w-full max-w-xs" />
      </div>
    </Busy>
  );
}

/** Stands in for a guest card while the invitation loads: a full screen with the floating buttons. */
export function GuestSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading your invitation" className="host-app relative grid h-svh place-items-center overflow-hidden">
      <div className="grid w-full max-w-md justify-items-center gap-5 px-8">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-5 w-64 max-w-full" />
        <Skeleton className="h-5 w-52 max-w-full" />
        <Skeleton className="mt-8 h-16 w-72 max-w-full" />
        <Skeleton className="h-16 w-64 max-w-full" />
        <Skeleton className="mt-8 h-8 w-56 max-w-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 px-4 pb-4">
        <Skeleton className="h-[3.75rem] w-full max-w-[26rem] rounded-pill" />
        <Skeleton className="size-[3.75rem] shrink-0 rounded-pill" />
      </div>
    </div>
  );
}

/** Stands in for the sign-in page while it checks your session. */
export function LoginSkeleton() {
  return (
    <div className="host-app grid min-h-svh place-items-center px-6 py-16">
      <Busy label="Loading sign in" className="grid w-full max-w-sm gap-4">
        <Skeleton className="size-9" />
        <Skeleton className="mt-4 h-12 w-48" />
        <Skeleton className="h-6 w-72 max-w-full" />
        <Skeleton className="mt-4 h-12 w-full rounded-pill" />
        <Skeleton className="h-12 w-full rounded-pill" />
      </Busy>
    </div>
  );
}
