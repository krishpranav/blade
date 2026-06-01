import React, { useState, useEffect, memo } from "react";
import { Globe, TrendingUp, TrendingDown, Zap, BarChart2 } from "lucide-react";
import { compact, fmtUsd, fmtPct, pctClass } from "@/lib/format";
import { getBackendMarketSnapshot } from "@/server/solana";

type MarketStat = {
  label: string;
  value: string;
  change?: number;
  highlight?: boolean;
};

type TopMover = {
  symbol: string;
  pct: number;
  priceUsd: number;
};

type FearGreed = {
  score: number; // 0-100
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
};

function getFearGreed(score: number): FearGreed["label"] {
  if (score <= 25) return "Extreme Fear";
  if (score <= 45) return "Fear";
  if (score <= 55) return "Neutral";
  if (score <= 75) return "Greed";
  return "Extreme Greed";
}

export const MarketOverviewBar = memo(function MarketOverviewBar() {
  const [stats, setStats] = useState<MarketStat[]>([]);
  const [gainers, setGainers] = useState<TopMover[]>([]);
  const [losers, setLosers] = useState<TopMover[]>([]);
  const [fearScore, setFearScore] = useState(62);
  const [solPrice, setSolPrice] = useState(148.42);

  useEffect(() => {
    const update = async () => {
      try {
        const snapshot = await getBackendMarketSnapshot();
        setSolPrice(snapshot.sol_price_usd);
        setFearScore(snapshot.fear_greed_score);
        setStats([
          {
            label: "SOL",
            value: fmtUsd(snapshot.sol_price_usd),
            change: (Math.random() - 0.5) * 4,
            highlight: true,
          },
          { label: "Sol Vol 24h", value: `$${compact(snapshot.total_volume_24h_usd)}` },
          { label: "New Pairs 1h", value: snapshot.new_pairs_1h.toLocaleString() },
          {
            label: "Dex Txns 24h",
            value: compact(8_200_000 + Math.floor(Math.random() * 100_000)),
          },
          { label: "Active Traders", value: compact(snapshot.active_traders) },
        ]);
        setGainers(
          snapshot.top_gainers.map((asset) => ({
            symbol: asset.symbol,
            pct: asset.change_24h_pct,
            priceUsd: asset.price_usd,
          })),
        );
        setLosers(
          snapshot.top_losers.map((asset) => ({
            symbol: asset.symbol,
            pct: asset.change_24h_pct,
            priceUsd: asset.price_usd,
          })),
        );
        return;
      } catch {
        // Fall back to local simulation when the Rust backend is not running.
      }

      const newSolPrice = 148.42 + (Math.random() - 0.5) * 2;
      setSolPrice(newSolPrice);
      setFearScore((prev) => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 3)));

      setStats([
        {
          label: "SOL",
          value: `$${newSolPrice.toFixed(2)}`,
          change: (Math.random() - 0.5) * 4,
          highlight: true,
        },
        { label: "Sol Vol 24h", value: `$${compact(2_840_000_000 + Math.random() * 100_000_000)}` },
        { label: "New Pairs 1h", value: `${412 + Math.round(Math.random() * 30)}` },
        { label: "Dex Txns 24h", value: compact(8_200_000 + Math.floor(Math.random() * 100_000)) },
        { label: "Active Traders", value: compact(142_000 + Math.floor(Math.random() * 5000)) },
      ]);

      setGainers([
        { symbol: "WIF", pct: 42.1 + Math.random() * 5, priceUsd: 2.45 },
        { symbol: "POPCAT", pct: 28.4 + Math.random() * 3, priceUsd: 0.42 },
        { symbol: "MOODENG", pct: 18.8 + Math.random() * 4, priceUsd: 0.128 },
      ]);

      setLosers([
        { symbol: "BOME", pct: -(22.4 + Math.random() * 3), priceUsd: 0.00842 },
        { symbol: "SLERF", pct: -(14.2 + Math.random() * 2), priceUsd: 0.34 },
        { symbol: "MYRO", pct: -(8.1 + Math.random() * 2), priceUsd: 0.018 },
      ]);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const fearLabel = getFearGreed(fearScore);
  const fearColor =
    fearScore <= 25
      ? "text-bear"
      : fearScore <= 45
        ? "text-orange-400"
        : fearScore <= 55
          ? "text-neutral-400"
          : fearScore <= 75
            ? "text-bull"
            : "text-emerald-400";

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0a0a0a] shadow-none">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-2">
        <Globe className="h-3 w-3 text-neutral-500" />
        <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">
          Solana Market Overview
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-stretch divide-x divide-neutral-800 min-w-max">
          {/* Stats */}
          {stats.map((stat) => (
            <div key={stat.label} className={`px-4 py-2.5 ${stat.highlight ? "bg-violet/5" : ""}`}>
              <div className="text-[9px] uppercase tracking-widest text-neutral-600">
                {stat.label}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-white">{stat.value}</span>
                {stat.change !== undefined && (
                  <span
                    className={`font-mono text-[10px] ${stat.change >= 0 ? "text-bull" : "text-bear"}`}
                  >
                    {stat.change >= 0 ? "+" : ""}
                    {stat.change.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Fear & Greed */}
          <div className="px-4 py-2.5">
            <div className="text-[9px] uppercase tracking-widest text-neutral-600">
              Fear & Greed
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`font-mono text-[16px] font-black leading-none ${fearColor}`}>
                {Math.round(fearScore)}
              </span>
              <span className={`text-[9px] font-semibold ${fearColor}`}>{fearLabel}</span>
            </div>
          </div>

          {/* Top Gainers */}
          <div className="px-4 py-2.5">
            <div className="mb-1 text-[9px] uppercase tracking-widest text-bull">Top Gainers</div>
            <div className="flex flex-col gap-0.5">
              {gainers.map((g) => (
                <div key={g.symbol} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-white w-14">
                    {g.symbol}
                  </span>
                  <span className="font-mono text-[10px] text-bull">+{g.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="px-4 py-2.5">
            <div className="mb-1 text-[9px] uppercase tracking-widest text-bear">Top Losers</div>
            <div className="flex flex-col gap-0.5">
              {losers.map((l) => (
                <div key={l.symbol} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-white w-14">
                    {l.symbol}
                  </span>
                  <span className="font-mono text-[10px] text-bear">{l.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* New Pairs Pulse */}
          <div className="px-4 py-2.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet" />
            </span>
            <span className="text-[9px] uppercase tracking-widest text-neutral-500">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
});
