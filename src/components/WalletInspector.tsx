import React, { useState, useCallback, memo } from "react";
import { Search, Copy, ExternalLink, TrendingUp, TrendingDown, Wallet, BarChart, Clock, Zap } from "lucide-react";
import { compact, fmtUsd, shortAddr } from "@/lib/format";

type WalletToken = {
  symbol: string;
  amount: number;
  valueUsd: number;
  pnlUsd: number;
  pnlPct: number;
  avgEntry: number;
  currentPrice: number;
};

type WalletTx = {
  type: "buy" | "sell";
  token: string;
  amountUsd: number;
  time: number;
  txhash: string;
  pnl?: number;
};

type WalletInspectionResult = {
  wallet: string;
  solBalance: number;
  totalValueUsd: number;
  totalPnlUsd: number;
  winRate: number;
  tradesTotal: number;
  avgHoldTime: string;
  tokens: WalletToken[];
  recentTxs: WalletTx[];
};

function mockInspect(wallet: string): WalletInspectionResult {
  const seed = wallet.charCodeAt(0) + wallet.charCodeAt(1);
  return {
    wallet,
    solBalance: 12.45 + (seed % 100),
    totalValueUsd: 8400 + (seed * 50),
    totalPnlUsd: 2100 + (seed * 10),
    winRate: 60 + (seed % 28),
    tradesTotal: 80 + (seed % 200),
    avgHoldTime: `${3 + (seed % 20)}m`,
    tokens: [
      { symbol: "WIF", amount: 1240, valueUsd: 3040, pnlUsd: 820, pnlPct: 37.1, avgEntry: 1.78, currentPrice: 2.45 },
      { symbol: "BONK", amount: 12_000_000, valueUsd: 1820, pnlUsd: -240, pnlPct: -11.6, avgEntry: 0.000018, currentPrice: 0.0000152 },
      { symbol: "POPCAT", amount: 4200, valueUsd: 1764, pnlUsd: 640, pnlPct: 56.9, avgEntry: 0.27, currentPrice: 0.42 },
    ],
    recentTxs: [
      { type: "buy", token: "WIF", amountUsd: 500, time: Date.now() - 120_000, txhash: "3Ax1...zQp9", pnl: undefined },
      { type: "sell", token: "POPCAT", amountUsd: 800, time: Date.now() - 3_600_000, txhash: "7bK9...mXr2", pnl: 640 },
      { type: "buy", token: "BONK", amountUsd: 300, time: Date.now() - 7_200_000, txhash: "9rLp...4VcQ", pnl: undefined },
      { type: "sell", token: "WIF", amountUsd: 1200, time: Date.now() - 86_400_000, txhash: "CmPq...8KwJ", pnl: -180 },
    ],
  };
}

function ago(ms: number) {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

export const WalletInspector = memo(function WalletInspector() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<WalletInspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "history">("portfolio");

  const inspect = useCallback(() => {
    if (input.trim().length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setResult(mockInspect(input.trim()));
      setLoading(false);
    }, 800);
  }, [input]);

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-violet" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Wallet Inspector
        </span>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter any Solana wallet address..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && inspect()}
            className="flex-1 rounded-sm border border-neutral-800 bg-black px-3 py-2 font-mono text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50"
          />
          <button
            onClick={inspect}
            disabled={loading || input.trim().length < 10}
            className="rounded-sm border border-violet/30 bg-violet/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-violet hover:bg-violet hover:text-white transition-none disabled:opacity-40"
          >
            {loading ? "Loading..." : "Inspect"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <>
          {/* Stat Bar */}
          <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800">
            {[
              { label: "Portfolio", value: fmtUsd(result.totalValueUsd) },
              { label: "Total PnL", value: (result.totalPnlUsd >= 0 ? "+" : "") + fmtUsd(result.totalPnlUsd), color: result.totalPnlUsd >= 0 ? "text-bull" : "text-bear" },
              { label: "Win Rate", value: result.winRate + "%" },
              { label: "SOL Bal", value: result.solBalance.toFixed(2) + " SOL" },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2.5 bg-[#0a0a0a]">
                <div className="text-[9px] uppercase tracking-widest text-neutral-600">{s.label}</div>
                <div className={`mt-0.5 font-mono text-[12px] font-semibold ${(s as any).color ?? "text-white"}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-800 bg-black">
            {(["portfolio", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-none ${
                  activeTab === tab ? "border-violet text-white" : "border-transparent text-neutral-500 hover:text-white"
                }`}
              >
                {tab === "portfolio" ? "Tokens" : "Tx History"}
              </button>
            ))}
          </div>

          {activeTab === "portfolio" && (
            <div className="divide-y divide-neutral-900">
              {result.tokens.map((token) => (
                <div key={token.symbol} className="flex items-center gap-4 px-4 py-3 hover:bg-[#111] transition-none">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-violet/10 text-[11px] font-bold text-violet border border-violet/20 shrink-0">
                    {token.symbol.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[12px] text-white">{token.symbol}</div>
                    <div className="text-[10px] text-neutral-600 font-mono">
                      {compact(token.amount)} @ {fmtUsd(token.avgEntry)} avg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] text-white">{fmtUsd(token.valueUsd)}</div>
                    <div className={`font-mono text-[10px] ${token.pnlUsd >= 0 ? "text-bull" : "text-bear"}`}>
                      {token.pnlUsd >= 0 ? "+" : ""}{fmtUsd(token.pnlUsd)} ({token.pnlPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="divide-y divide-neutral-900">
              {result.recentTxs.map((tx, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-[#111] transition-none">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-sm shrink-0 ${tx.type === "buy" ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"}`}>
                    {tx.type === "buy" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white">
                      {tx.type.toUpperCase()} {tx.token}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-neutral-600 font-mono mt-0.5">
                      <span>{tx.txhash}</span>
                      <span className="text-neutral-700">{ago(tx.time)} ago</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] text-white">{fmtUsd(tx.amountUsd)}</div>
                    {tx.pnl !== undefined && (
                      <div className={`font-mono text-[10px] ${tx.pnl >= 0 ? "text-bull" : "text-bear"}`}>
                        PnL: {tx.pnl >= 0 ? "+" : ""}{fmtUsd(tx.pnl)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!result && !loading && (
        <div className="py-10 text-center text-[10px] uppercase tracking-widest text-neutral-700">
          Inspect any wallet to view their portfolio & PnL
        </div>
      )}
    </div>
  );
});
