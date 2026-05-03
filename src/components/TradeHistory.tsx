import React, { useEffect, useState } from "react";
import { compact, shortAddr } from "@/lib/format";

type Trade = {
  id: string;
  type: "buy" | "sell";
  priceUsd: number;
  amountToken: number;
  amountUsd: number;
  wallet: string;
  timestamp: number;
};

export function TradeHistory({ currentPriceUsd = 0.005 }: { currentPriceUsd?: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Generate some initial mock trades
    const initial = Array.from({ length: 15 }).map((_, i) => createMockTrade(currentPriceUsd, i));
    setTrades(initial);

    // Simulate real-time incoming trades
    const interval = setInterval(() => {
      setTrades((prev) => {
        const newTrade = createMockTrade(currentPriceUsd, 0);
        return [newTrade, ...prev].slice(0, 50); // Keep last 50
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPriceUsd]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
      <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Trades
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-bull">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull"></span>
          </span>
          Live Feed
        </span>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-surface/60 uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium text-right">Price</th>
              <th className="px-3 py-2 font-medium text-right">USD</th>
              <th className="px-3 py-2 font-medium text-right">Size</th>
              <th className="px-3 py-2 font-medium text-right">Maker</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-border/20 hover:bg-surface-2/50 transition-colors">
                <td className="px-3 py-1.5 text-muted-foreground">
                  {new Date(t.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
                </td>
                <td className={`px-3 py-1.5 font-semibold ${t.type === "buy" ? "text-bull" : "text-bear"}`}>
                  {t.type.toUpperCase()}
                </td>
                <td className={`px-3 py-1.5 text-right ${t.type === "buy" ? "text-bull" : "text-bear"}`}>
                  ${t.priceUsd.toFixed(6)}
                </td>
                <td className="px-3 py-1.5 text-right text-foreground">
                  ${compact(t.amountUsd)}
                </td>
                <td className="px-3 py-1.5 text-right text-muted-foreground">
                  {compact(t.amountToken)}
                </td>
                <td className="px-3 py-1.5 text-right text-violet hover:underline cursor-pointer">
                  {shortAddr(t.wallet, 4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function createMockTrade(basePrice: number, ageSeconds: number): Trade {
  const isBuy = Math.random() > 0.4; // Slightly more buys
  const sizeMultiplier = Math.random() * 10000;
  const priceVariance = basePrice * (1 + (Math.random() - 0.5) * 0.02);
  const amountUsd = sizeMultiplier * priceVariance;
  
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let mockWallet = '';
  for (let i = 0; i < 44; i++) mockWallet += chars.charAt(Math.floor(Math.random() * chars.length));

  return {
    id: Math.random().toString(36).substring(7),
    type: isBuy ? "buy" : "sell",
    priceUsd: priceVariance,
    amountToken: sizeMultiplier,
    amountUsd,
    wallet: mockWallet,
    timestamp: Date.now() - (ageSeconds * 1000),
  };
}
