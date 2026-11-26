import { Link } from "@tanstack/react-router";

/** The Invite Me mark: two nested diamonds, as on the public site. */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M12 3.6 20.4 12 12 20.4 3.6 12Z" />
      <path d="M12 8.4 15.6 12 12 15.6 8.4 12Z" />
    </svg>
  );
}

export function Brand({ withName = true, size = "text-lg" }: { withName?: boolean; size?: string }) {
  return (
    <Link to="/" aria-label="Invite Me home" className="inline-flex min-h-11 items-center gap-2.5 text-text">
      <BrandMark />
      {withName ? <span className={`font-[Fraunces_Variable,Fraunces,Georgia,serif] ${size}`}>Invite Me</span> : null}
    </Link>
  );
}
