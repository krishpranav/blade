import React, { useMemo } from "react";
import { useWallet } from "@/lib/wallet";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { compact, fmtUsd } from "@/lib/format";

export function WalletHoldings({ tokenSymbol = "TOKEN", currentPriceUsd = 0 }) {
  const { publicKey, solBalance, connect } = useWallet();

  // Mock holdings data for demonstration
  const holdings = useMemo(() => {
    if (!publicKey) return null;
    
    // Simulate some holdings for the current token
    const amount = 50000;
    const avgEntry = currentPriceUsd * 0.85; // Mock entry price at 15% discount
    const valueUsd = amount * currentPriceUsd;
    const pnlUsd = valueUsd - (amount * avgEntry);
    const pnlPct = ((currentPriceUsd - avgEntry) / avgEntry) * 100;

    return {
      amount,
      avgEntry,
      valueUsd,
      pnlUsd,
      pnlPct,
    };
  }, [publicKey, currentPriceUsd]);

  if (!publicKey) {
    return (
      <div className="rounded-xl border border-border bg-surface/40 p-5 shadow-card text-center">
        <Wallet className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
        <h3 className="mt-3 font-display text-sm font-semibold">Connect Wallet</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Connect your wallet to track your holdings and PnL.
        </p>
        <button
          onClick={connect}
          className="mt-4 w-full rounded-lg bg-surface-2 py-2 text-xs font-semibold hover:bg-surface transition-colors"
        >
          Connect Phantom
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="font-display flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Wallet className="h-4 w-4 text-violet" />
          My Portfolio
        </h3>
        <div className="text-[11px] font-mono font-semibold text-foreground">
          {solBalance?.toFixed(3)} SOL
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground uppercase tracking-tight">
            <span>Holdings</span>
            <span>Value (USD)</span>
          </div>
          <div className="mt-1 flex justify-between items-baseline">
            <span className="font-mono text-lg font-bold">{compact(holdings?.amount || 0)} {tokenSymbol}</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {fmtUsd(holdings?.valueUsd || 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/20">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase">Avg Entry</div>
            <div className="font-mono text-xs font-semibold">{fmtUsd(holdings?.avgEntry || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">Unrealized PnL</div>
            <div className={`flex items-center justify-end gap-1 font-mono text-xs font-bold ${holdings && holdings.pnlUsd >= 0 ? "text-bull" : "text-bear"}`}>
              {holdings && holdings.pnlUsd >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {holdings && holdings.pnlUsd >= 0 ? "+" : ""}{fmtUsd(holdings?.pnlUsd || 0)}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-surface-2/60 p-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Return</span>
            <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${holdings && holdings.pnlPct >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
              {holdings && holdings.pnlPct >= 0 ? "+" : ""}{holdings?.pnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
