import React, { useEffect, useState } from "react";
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

export function SmartMoneyPanel() {
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
    <div className="rounded-xl border border-border bg-surface/40 p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
        <h3 className="font-display flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Eye className="h-4 w-4 text-violet" />
          Smart Money Intel
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] text-bull">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull"></span>
          </span>
          Scanning
        </span>
      </div>

      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-surface/30 p-2.5 transition-colors hover:bg-surface/60">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${ev.type === "buy" ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"}`}>
                {ev.type === "buy" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-foreground hover:text-violet hover:underline cursor-pointer">
                    {shortAddr(ev.wallet, 4)}
                  </span>
                  {ev.isSmartMoney && (
                    <span className="flex items-center rounded-sm bg-amber-500/10 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-500">
                      <Star className="mr-0.5 h-2.5 w-2.5" /> Smart
                    </span>
                  )}
                  {ev.isFreshWallet && !ev.isSmartMoney && (
                    <span className="rounded-sm bg-blue-500/10 px-1 py-0.5 text-[9px] font-bold uppercase text-blue-400">
                      Fresh
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
                </span>
              </div>
            </div>
            
            <div className={`font-mono text-sm font-bold ${ev.type === "buy" ? "text-bull" : "text-bear"}`}>
              {ev.type === "buy" ? "+" : "-"}{fmtUsd(ev.amountUsd)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
