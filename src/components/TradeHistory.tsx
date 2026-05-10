import React, { useEffect, useState, memo } from "react";
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

export const TradeHistory = memo(function TradeHistory({ currentPriceUsd = 0.005 }: { currentPriceUsd?: number }) {
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
    <div className="flex flex-col overflow-hidden rounded-sm border border-neutral-800 bg-black shadow-none">
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Order Feed
        </span>
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-bull">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull"></span>
          </span>
          Live
        </span>
      </div>
      
      <div className="flex-1 overflow-x-auto contain-strict">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-[#050505] uppercase tracking-wider text-neutral-600 border-b border-neutral-800">
            <tr>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap">Time</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap">Type</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap text-right">Price</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap text-right">USD</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap text-right">Size</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap text-right">Maker</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {trades.map((t) => (
              <TradeRow key={t.id} t={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const TradeRow = memo(({ t }: { t: Trade }) => (
  <tr className="border-b border-neutral-900/50 hover:bg-[#111] transition-none">
    <td className="px-3 py-1 text-neutral-500">
      {new Date(t.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
    </td>
    <td className={`px-3 py-1 font-bold uppercase ${t.type === "buy" ? "text-bull" : "text-bear"}`}>
      {t.type}
    </td>
    <td className={`px-3 py-1 text-right ${t.type === "buy" ? "text-bull" : "text-bear"}`}>
      ${t.priceUsd.toFixed(6)}
    </td>
    <td className="px-3 py-1 text-right text-white">
      ${compact(t.amountUsd)}
    </td>
    <td className="px-3 py-1 text-right text-neutral-500">
      {compact(t.amountToken)}
    </td>
    <td className="px-3 py-1 text-right text-neutral-400 hover:text-white cursor-pointer">
      {shortAddr(t.wallet, 4)}
    </td>
  </tr>
));

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
