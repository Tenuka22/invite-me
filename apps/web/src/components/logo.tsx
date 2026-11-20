/** The Invite Me mark: a diamond in a diamond, drawn in the current text colour. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3.6 20.4 12 12 20.4 3.6 12Z" />
      <path d="M12 8.4 15.6 12 12 15.6 8.4 12Z" />
    </svg>
  );
}
