import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/lib/wallet";
import { getMarketStats } from "@/server/solana";
import { fmtUsd, shortAddr } from "@/lib/format";
import { Wallet, Copy, LogOut, ExternalLink, ChevronDown } from "lucide-react";

export function WalletButton() {
  const { ready, publicKey, solBalance, connecting, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ["wallet-market-stats"],
    queryFn: () => getMarketStats(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (!ready) {
    return <div className="h-9 w-28 animate-pulse rounded-md bg-surface/60" />;
  }

  if (!publicKey) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-gradient px-3 text-[12px] font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        <Wallet className="h-3.5 w-3.5" />
        {connecting ? "Connecting…" : "Connect"}
      </button>
    );
  }

  const sol = solBalance ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface/60 px-2.5 text-[12px] font-medium hover:bg-surface"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet/20 text-[10px]">
          ◎
        </span>
        <span className="font-mono">{sol.toFixed(2)}</span>
        <span className="text-muted-foreground">SOL</span>
        <span className="hidden border-l border-border pl-2 font-mono text-muted-foreground sm:inline">
          {shortAddr(publicKey, 3)}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="border-b border-border bg-surface-2/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Phantom Wallet
              </div>
              <div className="mt-1 font-mono text-[12px]">{shortAddr(publicKey, 6)}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold">{sol.toFixed(4)}</span>
                <span className="text-sm text-muted-foreground">SOL</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                ≈ {fmtUsd(sol * (stats?.solUsd ?? 0))}
              </div>
            </div>
            <div className="p-2">
              <Item
                onClick={() => navigator.clipboard.writeText(publicKey)}
                icon={<Copy className="h-3.5 w-3.5" />}
                label="Copy address"
              />
              <Item
                onClick={() =>
                  window.open(
                    `https://solscan.io/account/${publicKey}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                icon={<ExternalLink className="h-3.5 w-3.5" />}
                label="View on Solscan"
              />
              <Item
                onClick={() => {
                  setOpen(false);
                  disconnect();
                }}
                icon={<LogOut className="h-3.5 w-3.5" />}
                label="Disconnect"
                danger
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Item({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition-colors hover:bg-surface-2 " +
        (danger ? "text-bear" : "")
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
