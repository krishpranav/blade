import { useMemo, useState } from "react";

const KNOWN_TOKEN_ICONS: Record<string, string> = {
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  WSOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/EPjFWdd5AufqSSqeM2q8xeZ5vPr3gF7CKaQfuF1VmWf/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/Es9vMFrzaCERmJfrF4H2FYD4bbA4unrVhoHhaNbQx4F/logo.png",
  JUP: "https://static.jup.ag/jup/icon.png",
  JITOSOL: "https://metadata.jito.network/token/jitosol/image",
  BONK: "https://arweave.net/hQB1hYDgxEYKdib8KQWUkNSTKqzUQ9p2U7Z4l5cVv5g",
  WIF: "https://bafkreihn5qksz4b62y6k4pymrw3ly5yzzifsztwhz6y2gnn7m5mu43b6tq.ipfs.nftstorage.link",
};

type TokenIconProps = {
  symbol: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

export function TokenIcon({ symbol, imageUrl, size = "md", className = "" }: TokenIconProps) {
  const [failed, setFailed] = useState(false);
  const normalized = symbol.trim().toUpperCase();
  const src = !failed ? imageUrl || KNOWN_TOKEN_ICONS[normalized] : undefined;
  const fallback = useMemo(() => normalized.replace(/[^A-Z0-9]/g, "").slice(0, 3) || "???", [normalized]);

  if (src) {
    return (
      <img
        src={src}
        alt={`${symbol} logo`}
        className={`${sizeClass[size]} shrink-0 rounded-sm bg-neutral-900 object-cover ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass[size]} flex shrink-0 items-center justify-center rounded-sm border border-neutral-800 bg-neutral-950 text-[9px] font-bold text-neutral-300 ${className}`}
      title={symbol}
    >
      {fallback}
    </div>
  );
}
