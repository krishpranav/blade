import React, { useEffect, useState, memo } from "react";
import { Eye, TrendingUp, TrendingDown, Star } from "lucide-react";
import { compact, fmtUsd, shortAddr } from "@/lib/format";

type IntelEvent = {
  id: string;
  type: "buy" | "sell";
  wallet: string;
  isSmartMoney: boolean;
  isFreshWallet: boolean;
  amountUsd: number;
  timestamp: number;
};

export const SmartMoneyPanel = memo(function SmartMoneyPanel() {
  const [events, setEvents] = useState<IntelEvent[]>([]);

  useEffect(() => {
    // Generate initial events
    const initial = Array.from({ length: 6 }).map((_, i) => createIntelEvent(i * 10));
    setEvents(initial);

    // Simulate incoming whale/smart money transactions
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // Only occasionally spawn an intel event
        setEvents((prev) => [createIntelEvent(0), ...prev].slice(0, 15));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-neutral-800 bg-black shadow-none">
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-3 py-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          <Eye className="h-3 w-3 text-violet" />
          Intel Feed
        </h3>
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-bull">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull"></span>
          </span>
          Scanning
        </span>
      </div>

      <div className="flex-1 overflow-y-auto contain-strict">
        {events.map((ev) => (
          <IntelRow key={ev.id} ev={ev} />
        ))}
      </div>
    </div>
  );
});

const IntelRow = memo(({ ev }: { ev: IntelEvent }) => (
  <div className="flex items-center justify-between border-b border-neutral-900/50 bg-transparent px-3 py-2 transition-none hover:bg-[#111]">
    <div className="flex items-center gap-3">
      <div className={`flex h-6 w-6 items-center justify-center rounded-sm ${ev.type === "buy" ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"}`}>
        {ev.type === "buy" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold text-white hover:text-violet hover:underline cursor-pointer">
            {shortAddr(ev.wallet, 4)}
          </span>
          {ev.isSmartMoney && (
            <span className="flex items-center rounded-sm bg-amber-500/10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20">
              <Star className="mr-0.5 h-2 w-2" /> Smart
            </span>
          )}
          {ev.isFreshWallet && !ev.isSmartMoney && (
            <span className="rounded-sm bg-blue-500/10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
              Fresh
            </span>
          )}
        </div>
        <span className="text-[9px] text-neutral-500 font-mono">
          {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
        </span>
      </div>
    </div>
    
    <div className={`font-mono text-[12px] font-bold ${ev.type === "buy" ? "text-bull" : "text-bear"}`}>
      {ev.type === "buy" ? "+" : "-"}{fmtUsd(ev.amountUsd)}
    </div>
  </div>
));

function createIntelEvent(ageSeconds: number): IntelEvent {
  const isBuy = Math.random() > 0.3; // Whales are accumulating?
  const amountUsd = 10000 + (Math.random() * 90000); // 10k to 100k
  const isSmartMoney = Math.random() > 0.8;
  const isFreshWallet = Math.random() > 0.7;
  
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let mockWallet = '';
  for (let i = 0; i < 44; i++) mockWallet += chars.charAt(Math.floor(Math.random() * chars.length));

  return {
    id: Math.random().toString(36).substring(7),
    type: isBuy ? "buy" : "sell",
    wallet: mockWallet,
    isSmartMoney,
    isFreshWallet,
    amountUsd,
    timestamp: Date.now() - (ageSeconds * 1000),
  };
}
