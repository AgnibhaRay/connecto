export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="10" fill="currentColor" />
      <path
        d="M21.4 10.6c-1.35-1.2-3.15-1.95-5.15-1.95-4.35 0-7.85 3.3-7.85 7.35s3.5 7.35 7.85 7.35c2 0 3.8-.75 5.15-1.95"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="21.6" cy="16" r="1.7" fill="#ffffff" />
    </svg>
  );
}

export function LogoWord({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoMark className="h-7 w-7" />
      Connecto
    </span>
  );
}
