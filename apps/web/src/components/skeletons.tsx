import { Card, CardContent } from "@invite-me/ui/components/motion/card";

/** A resting block that shimmers while real content loads. Sized by the caller. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`sk rounded-xl ${className}`} />;
}

function Busy({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  );
}

const TILES = "grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4";

function Tile() {
  return (
    <div className="grid gap-3">
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function TileGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={TILES}>
      {Array.from({ length: count }, (_, i) => (
        <Tile key={i} />
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <Busy label="Loading home">
      <Skeleton className="h-14 w-72 max-w-full" />
      <Skeleton className="mt-4 h-5 w-56" />
      <Skeleton className="mb-4 mt-12 h-7 w-40" />
      <TileGridSkeleton count={2} />
      <Skeleton className="mb-4 mt-14 h-7 w-52" />
      <TileGridSkeleton count={3} />
    </Busy>
  );
}

export function ListSkeleton() {
  return (
    <Busy label="Loading invitations">
      <Skeleton className="h-12 w-64 max-w-full" />
      <Skeleton className="mb-8 mt-4 h-5 w-72 max-w-full" />
      <TileGridSkeleton />
    </Busy>
  );
}

export function WorkspaceSkeleton() {
  return (
    <Busy label="Loading invitation">
      <Skeleton className="mb-3 size-12 rounded-full" />
      <Skeleton className="mb-8 h-12 w-80 max-w-full" />
      <div className="grid items-start gap-8 md:grid-cols-[15rem_1fr] lg:gap-12">
        <Skeleton className="mx-auto aspect-[3/4] w-full max-w-[15rem] rounded-2xl md:mx-0" />
        <div className="grid gap-8">
          <div className="grid gap-3">
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32 rounded-full" />
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
          </div>
          <Card>
            <CardContent className="grid gap-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </CardContent>
          </Card>
          {Array.from({ length: 2 }, (_, i) => (
            <Card key={i} size="compact">
              <CardContent className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56 max-w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Busy>
  );
}

export function EditorSkeleton() {
  return (
    <Busy label="Loading the card editor">
      <Skeleton className="mb-3 size-12 rounded-full" />
      <Skeleton className="mb-8 h-12 w-56" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardContent className="grid gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-11 w-full rounded-full" />
                <Skeleton className="h-11 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="mx-auto h-[70svh] w-full max-w-[26rem] rounded-[1.6rem]" />
      </div>
    </Busy>
  );
}

export function ProfileSkeleton() {
  return (
    <Busy label="Loading profile">
      <Skeleton className="mb-3 h-12 w-48" />
      <Skeleton className="mb-8 h-5 w-72 max-w-full" />
      <Card className="max-w-xl">
        <CardContent className="grid gap-5">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </CardContent>
      </Card>
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
        <Skeleton className="h-[3.75rem] w-full max-w-[26rem] rounded-full" />
        <Skeleton className="size-[3.75rem] shrink-0 rounded-full" />
      </div>
    </div>
  );
}

/** Default while any route loads. */
export function PageSkeleton() {
  return (
    <div className="host-app">
      <Busy label="Loading">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-4 h-5 w-80 max-w-full" />
        <div className="mt-10">
          <TileGridSkeleton />
        </div>
      </Busy>
    </div>
  );
}

/** Stands in for the sign-in page while it checks your session. */
export function LoginSkeleton() {
  return (
    <div className="host-app grid min-h-svh place-items-center px-6 py-16">
      <Busy label="Loading sign in">
        <div className="grid w-full max-w-sm gap-4">
          <Skeleton className="size-9" />
          <Skeleton className="mt-4 h-12 w-48" />
          <Skeleton className="h-6 w-72 max-w-full" />
          <Skeleton className="mt-4 h-14 w-full rounded-full" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </Busy>
    </div>
  );
}
