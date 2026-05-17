import React, { useState, useEffect, useCallback, memo } from "react";
import { Users, Copy, TrendingUp, TrendingDown, Star, Trophy, ArrowRight } from "lucide-react";
import { fmtUsd, compact, shortAddr } from "@/lib/format";

type TraderProfile = {
  wallet: string;
  rank: number;
  winRate: number;
  totalPnlUsd: number;
  trades30d: number;
  bestWin: number;
  avgHoldMin: number;
  isFollowed: boolean;
  tags: string[];
};

export const CopyTradingLeaderboard = memo(function CopyTradingLeaderboard() {
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"leaderboard" | "following">("leaderboard");
  const [copySize, setCopySize] = useState<string>("0.1");
  const [sortBy, setSortBy] = useState<"pnl" | "winrate" | "trades">("pnl");

  useEffect(() => {
    const mockTraders: TraderProfile[] = [
      {
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        rank: 1,
        winRate: 87.5,
        totalPnlUsd: 248000,
        trades30d: 312,
        bestWin: 48000,
        avgHoldMin: 4.2,
        isFollowed: false,
        tags: ["Sniper", "Micro-cap"],
      },
      {
        wallet: "4fYNw3dojWmQ4dXtSGE9epjRGy9GFyZH9yZ3s8ByX9t",
        rank: 2,
        winRate: 79.2,
        totalPnlUsd: 182500,
        trades30d: 205,
        bestWin: 32000,
        avgHoldMin: 12.7,
        isFollowed: false,
        tags: ["DCA Master", "LP Trader"],
      },
      {
        wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWh",
        rank: 3,
        winRate: 74.8,
        totalPnlUsd: 97200,
        trades30d: 178,
        bestWin: 21500,
        avgHoldMin: 8.1,
        isFollowed: false,
        tags: ["Degen"],
      },
      {
        wallet: "CuieVDEDtLo7FypjyQUsA6oWzRY1p4N7YNjU72pPxAuG",
        rank: 4,
        winRate: 71.1,
        totalPnlUsd: 63400,
        trades30d: 490,
        bestWin: 14000,
        avgHoldMin: 1.8,
        isFollowed: false,
        tags: ["High Freq", "Sniper"],
      },
      {
        wallet: "GtE9aGjQ7DXKL5bCMhHgthM2TvmjWz1UzQ6b2ENMxPW",
        rank: 5,
        winRate: 68.9,
        totalPnlUsd: 41200,
        trades30d: 143,
        bestWin: 9800,
        avgHoldMin: 22.4,
        isFollowed: false,
        tags: ["Swing Trader"],
      },
    ];
    setTraders(mockTraders);
  }, []);

  const toggleFollow = useCallback((wallet: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(wallet)) next.delete(wallet);
      else next.add(wallet);
      return next;
    });
  }, []);

  const sortedTraders = [...traders].sort((a, b) => {
    if (sortBy === "pnl") return b.totalPnlUsd - a.totalPnlUsd;
    if (sortBy === "winrate") return b.winRate - a.winRate;
    return b.trades30d - a.trades30d;
  });

  const visibleTraders =
    activeTab === "following"
      ? sortedTraders.filter((t) => followed.has(t.wallet))
      : sortedTraders;

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Copy Trading
          </span>
          <span className="rounded-sm bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-500">
            PRO
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-neutral-600">Copy size:</span>
          <input
            type="number"
            step="0.01"
            value={copySize}
            onChange={(e) => setCopySize(e.target.value)}
            className="w-16 rounded-sm border border-neutral-800 bg-black px-1.5 py-0.5 font-mono text-[10px] text-white outline-none focus:border-violet/50 text-right"
          />
          <span className="text-[9px] text-neutral-600">SOL</span>
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-black px-2">
        <div className="flex">
          {(["leaderboard", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest transition-none border-b-2 ${
                activeTab === tab
                  ? "border-violet text-white"
                  : "border-transparent text-neutral-500 hover:text-white"
              }`}
            >
              {tab === "leaderboard" ? "Top Traders" : `Following (${followed.size})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase text-neutral-700">Sort:</span>
          {(["pnl", "winrate", "trades"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[9px] uppercase px-1.5 py-0.5 rounded-sm ${sortBy === s ? "bg-neutral-800 text-white" : "text-neutral-600 hover:text-white"}`}
            >
              {s === "pnl" ? "P&L" : s === "winrate" ? "Win%" : "Trades"}
            </button>
          ))}
        </div>
      </div>

      {/* Trader List */}
      <div className="divide-y divide-neutral-900">
        {visibleTraders.length === 0 ? (
          <div className="py-10 text-center text-[10px] uppercase tracking-widest text-neutral-700">
            {activeTab === "following" ? "Not following any traders yet" : "No traders"}
          </div>
        ) : (
          visibleTraders.map((trader) => {
            const isFollowing = followed.has(trader.wallet);
            return (
              <div
                key={trader.wallet}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-4 px-4 py-3 hover:bg-[#111] transition-none"
              >
                {/* Rank */}
                <div
                  className={`text-center font-mono text-sm font-bold ${
                    trader.rank === 1
                      ? "text-amber-400"
                      : trader.rank === 2
                      ? "text-neutral-300"
                      : trader.rank === 3
                      ? "text-amber-700"
                      : "text-neutral-600"
                  }`}
                >
                  #{trader.rank}
                </div>

                {/* Trader Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-white">
                      {shortAddr(trader.wallet, 5)}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(trader.wallet)}
                      className="text-neutral-700 hover:text-white"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                    <div className="flex gap-1">
                      {trader.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-sm bg-neutral-900 border border-neutral-800 px-1 py-0.5 text-[8px] uppercase text-neutral-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-[10px]">
                    <span className="font-mono text-bull">
                      +{fmtUsd(trader.totalPnlUsd)}
                    </span>
                    <span className="text-neutral-500">
                      Win Rate:{" "}
                      <span className="font-mono text-white">{trader.winRate}%</span>
                    </span>
                    <span className="text-neutral-500">
                      Trades: <span className="font-mono text-white">{trader.trades30d}</span>
                    </span>
                    <span className="text-neutral-500">
                      Avg:{" "}
                      <span className="font-mono text-white">{trader.avgHoldMin}m</span>
                    </span>
                  </div>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => toggleFollow(trader.wallet)}
                  className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-none border ${
                    isFollowing
                      ? "bg-violet/20 border-violet/30 text-violet hover:bg-bear/10 hover:border-bear/20 hover:text-bear"
                      : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-violet/20 hover:border-violet/30 hover:text-violet"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Star className="h-3 w-3 fill-current" /> Copying
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Copy size info */}
      {followed.size > 0 && (
        <div className="border-t border-neutral-800 px-4 py-2.5 bg-[#0a0a0a] flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">
            Copying <span className="text-white font-bold">{followed.size}</span> traders at{" "}
            <span className="font-mono text-violet">{copySize} SOL</span> each
          </span>
          <span className="text-[10px] text-neutral-600">
            Max exposure:{" "}
            <span className="font-mono text-white">
              {(parseFloat(copySize || "0") * followed.size).toFixed(2)} SOL
            </span>
          </span>
        </div>
      )}
    </div>
  );
});
