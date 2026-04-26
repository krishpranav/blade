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
          <linearGradient
            id="blade-mark"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F2D10A" />
            <stop offset="1" stopColor="#FF7324" />
          </linearGradient>
        </defs>
        <path d="M6 5h20l-8 10 8 12H6l8-12Z" fill="url(#blade-mark)" />
        <path d="M13 11h9l-4 5 4 6h-9l4-6Z" fill="#111111" />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">BLADE</span>
      <span className="rounded-md border border-border bg-accent px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
        Live
      </span>
    </div>
  );
}
