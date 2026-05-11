import React, { useMemo, memo } from "react";
import { useWallet } from "@/lib/wallet";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { compact, fmtUsd } from "@/lib/format";

export const WalletHoldings = memo(function WalletHoldings({ tokenSymbol = "TOKEN", currentPriceUsd = 0 }: { tokenSymbol?: string, currentPriceUsd?: number }) {
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
      <div className="rounded-sm border border-neutral-800 bg-black p-4 shadow-none text-center">
        <Wallet className="mx-auto h-6 w-6 text-neutral-600" />
        <h3 className="mt-3 font-display text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Connect Wallet</h3>
        <p className="mt-1 text-[9px] text-neutral-600 uppercase tracking-widest">
          Connect to track PnL
        </p>
        <button
          onClick={connect}
          className="mt-4 w-full rounded-sm bg-violet/20 text-violet py-2 text-xs font-bold uppercase tracking-wider hover:bg-violet hover:text-white transition-none border border-violet/30"
        >
          Connect Phantom
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-neutral-800 bg-black p-4 shadow-none">
      <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="font-display flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          <Wallet className="h-3 w-3 text-violet" />
          Portfolio
        </h3>
        <div className="text-[11px] font-mono font-semibold text-white">
          {solBalance?.toFixed(3)} SOL
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[9px] text-neutral-500 uppercase tracking-widest">
            <span>Holdings</span>
            <span>Value (USD)</span>
          </div>
          <div className="mt-1 flex justify-between items-baseline">
            <span className="font-mono text-sm font-bold text-white">{compact(holdings?.amount || 0)} {tokenSymbol}</span>
            <span className="font-mono text-sm font-semibold text-white">
              {fmtUsd(holdings?.valueUsd || 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
          <div>
            <div className="text-[9px] text-neutral-500 uppercase tracking-widest">Avg Entry</div>
            <div className="font-mono text-[11px] font-semibold text-white">{fmtUsd(holdings?.avgEntry || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-neutral-500 uppercase tracking-widest">Unrealized PnL</div>
            <div className={`flex items-center justify-end gap-1 font-mono text-[11px] font-bold ${holdings && holdings.pnlUsd >= 0 ? "text-bull" : "text-bear"}`}>
              {holdings && holdings.pnlUsd >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {holdings && holdings.pnlUsd >= 0 ? "+" : ""}{fmtUsd(holdings?.pnlUsd || 0)}
            </div>
          </div>
        </div>

        <div className="rounded-sm bg-[#0a0a0a] p-3 border border-neutral-900">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-widest">Total Return</span>
            <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold border ${holdings && holdings.pnlPct >= 0 ? "bg-bull/10 text-bull border-bull/20" : "bg-bear/10 text-bear border-bear/20"}`}>
              {holdings && holdings.pnlPct >= 0 ? "+" : ""}{holdings?.pnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
