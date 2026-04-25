export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={"flex items-center gap-2 " + className}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="vg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M16 3 L29 28 L3 28 Z" fill="url(#vg)" />
        <path d="M16 11 L23 25 L9 25 Z" fill="oklch(0.13 0.01 260)" />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        VERTEX
      </span>
      <span className="rounded-md bg-violet/15 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.78_0.18_295)]">
        Pro
      </span>
    </div>
  );
}
