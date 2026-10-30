/** WindSight wordmark: three wind strokes of different lengths. */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="text-forecast">
        <path d="M3 8h11a3 3 0 1 0-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 13h15a3 3 0 1 1-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight">HeadRoom</span>
    </span>
  );
}
