import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback, memo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { getTrendingSolana, getMemecoinsSolana, type DSPair } from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";
import {
  Flame, Sparkles, Rocket, BarChart3, Coins, Star, StarOff,
  ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpDown, Search,
  TrendingUp, TrendingDown, Zap, Eye,
} from "lucide-react";

type Tab = "trending" | "memes" | "watchlist";
type SortKey = "default" | "gainers" | "losers" | "volume" | "liquidity" | "new" | "mcap";

// ─── Mini sparkline (SVG) ─────────────────────────────────────────
const Sparkline = memo(({ positive }: { positive: boolean }) => {
  const pts = useMemo(() => {
    const arr: number[] = [];
    let val = 50;
    for (let i = 0; i < 20; i++) {
      val = Math.min(95, Math.max(5, val + (Math.random() - (positive ? 0.42 : 0.58)) * 15));
      arr.push(val);
    }
    return arr;
  }, [positive]);

  const w = 80, h = 28;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * w} ${h - ((p - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={path} fill="none" stroke={positive ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

// ─── Risk Badge ───────────────────────────────────────────────────
function RiskBadge({ score }: { score: number }) {
  if (score >= 75) return (
    <span className="flex items-center gap-0.5 rounded-sm border border-bull/20 bg-bull/10 px-1 py-0.5 text-[8px] font-bold uppercase text-bull">
      <ShieldCheck className="h-2 w-2" /> Safe
    </span>
  );
  if (score >= 50) return (
    <span className="flex items-center gap-0.5 rounded-sm border border-amber-500/20 bg-amber-500/10 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-400">
      <AlertTriangle className="h-2 w-2" /> Medium
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 rounded-sm border border-bear/20 bg-bear/10 px-1 py-0.5 text-[8px] font-bold uppercase text-bear">
      <ShieldAlert className="h-2 w-2" /> High Risk
    </span>
  );
}

// Mock a deterministic risk score per token
function mockRiskScore(symbol: string): number {
  const sum = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 30 + (sum % 70);
}

export function DiscoverPage() {
  const [tab, setTab] = useState<Tab>("trending");
  const [sort, setSort] = useState<SortKey>("default");
  const [q, setQ] = useState("");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const trendingQ = useQuery({
    queryKey: ["trending-solana"],
    queryFn: () => getTrendingSolana(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
  const memesQ = useQuery({
    queryKey: ["memes-solana"],
    queryFn: () => getMemecoinsSolana(),
    refetchInterval: 25_000,
    staleTime: 15_000,
    enabled: tab === "memes",
  });

  const baseData = tab === "trending" ? trendingQ.data : tab === "memes" ? memesQ.data : trendingQ.data;
  const isLoading = (tab === "trending" ? trendingQ.isLoading : tab === "memes" ? memesQ.isLoading : false);

  const toggleWatchlist = useCallback((addr: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.has(addr) ? next.delete(addr) : next.add(addr);
      return next;
    });
  }, []);

  const rows = useMemo(() => {
    let list: DSPair[] = baseData ?? [];

    if (tab === "watchlist") {
      list = (trendingQ.data ?? []).filter((p) => watchlist.has(p.baseToken.address));
    }

    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.baseToken.symbol.toLowerCase().includes(needle) ||
          p.baseToken.name?.toLowerCase().includes(needle) ||
          p.baseToken.address.toLowerCase().includes(needle)
      );
    }

    switch (sort) {
      case "gainers": return [...list].sort((a, b) => (b.priceChange?.h24 ?? 0) - (a.priceChange?.h24 ?? 0));
      case "losers": return [...list].sort((a, b) => (a.priceChange?.h24 ?? 0) - (b.priceChange?.h24 ?? 0));
      case "volume": return [...list].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
      case "liquidity": return [...list].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
      case "new": return [...list].sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0));
      case "mcap": return [...list].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
      default: return list;
    }
  }, [baseData, trendingQ.data, q, sort, tab, watchlist]);

  const SortButton = ({ id, label }: { id: SortKey; label: string }) => (
    <button
      onClick={() => setSort(sort === id ? "default" : id)}
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-none ${
        sort === id
          ? "border-violet/40 bg-violet/10 text-violet"
          : "border-neutral-800 bg-[#0a0a0a] text-neutral-500 hover:text-white"
      }`}
    >
      {label}
      <ArrowUpDown className="h-2.5 w-2.5" />
    </button>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white">Discover</h1>
            <p className="mt-0.5 text-[11px] uppercase tracking-widest text-neutral-600">
              Live Solana markets · Refreshes every 30s
            </p>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-sm border border-neutral-800 bg-[#0a0a0a] px-3 py-2 focus-within:border-violet/50">
              <Search className="h-3.5 w-3.5 text-neutral-600" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search symbol, name, address…"
                className="w-64 bg-transparent font-mono text-[11px] text-white outline-none placeholder:text-neutral-700"
              />
            </div>
            {/* View toggle */}
            <div className="flex rounded-sm border border-neutral-800 overflow-hidden">
              {(["table", "grid"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-[10px] font-bold uppercase transition-none ${
                    viewMode === mode ? "bg-neutral-800 text-white" : "bg-[#0a0a0a] text-neutral-600 hover:text-white"
                  }`}
                >
                  {mode === "table" ? "≡" : "⊞"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-0 rounded-sm border border-neutral-800 bg-black overflow-hidden w-fit">
          {([
            { id: "trending", label: "Trending", icon: Flame },
            { id: "memes", label: "Memes", icon: Coins },
            { id: "watchlist", label: `Watchlist (${watchlist.size})`, icon: Star },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider border-r border-neutral-800 last:border-r-0 transition-none ${
                tab === t.id ? "bg-[#1a1a1a] text-white" : "text-neutral-500 hover:text-white"
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Sort Controls ───────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-neutral-700">Sort:</span>
          <SortButton id="gainers" label="Top Gainers" />
          <SortButton id="losers" label="Top Losers" />
          <SortButton id="volume" label="Volume" />
          <SortButton id="liquidity" label="Liquidity" />
          <SortButton id="new" label="Newest" />
          <SortButton id="mcap" label="Market Cap" />
          {sort !== "default" && (
            <button
              onClick={() => setSort("default")}
              className="text-[9px] uppercase tracking-widest text-neutral-700 hover:text-white transition-none"
            >
              ✕ Clear
            </button>
          )}
          <span className="ml-auto text-[9px] text-neutral-700 font-mono">
            {rows.length} pairs
          </span>
        </div>

        {/* ── Table View ──────────────────────────────────────── */}
        {viewMode === "table" && (
          <div className="overflow-hidden rounded-sm border border-neutral-800 bg-black shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#050505] text-left uppercase tracking-widest text-neutral-600">
                    <th className="w-8 px-3 py-2.5" />
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Token</th>
                    <th className="px-4 py-2.5 text-right font-medium">Risk</th>
                    <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th className="px-4 py-2.5 text-right font-medium">1h</th>
                    <th className="px-4 py-2.5 text-right font-medium">24h</th>
                    <th className="px-4 py-2.5 text-right font-medium">Vol 24h</th>
                    <th className="px-4 py-2.5 text-right font-medium">Liquidity</th>
                    <th className="px-4 py-2.5 text-right font-medium">MCap</th>
                    <th className="px-4 py-2.5 text-right font-medium">Age</th>
                    <th className="px-4 py-2.5 text-right font-medium">7d Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading &&
                    Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-900">
                        <td colSpan={12} className="px-4 py-3">
                          <div className="h-5 animate-pulse rounded-sm bg-neutral-900" />
                        </td>
                      </tr>
                    ))}
                  {rows.map((p, idx) => {
                    const ch1 = p.priceChange?.h1 ?? null;
                    const ch24 = p.priceChange?.h24 ?? null;
                    const riskScore = mockRiskScore(p.baseToken.symbol);
                    const isWatched = watchlist.has(p.baseToken.address);
                    return (
                      <tr
                        key={p.pairAddress}
                        className="group border-b border-neutral-900/60 hover:bg-[#0d0d0d] transition-none"
                      >
                        {/* Watchlist star */}
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => toggleWatchlist(p.baseToken.address)}
                            className={`transition-none ${isWatched ? "text-amber-400" : "text-neutral-800 group-hover:text-neutral-600"}`}
                          >
                            <Star className="h-3.5 w-3.5" fill={isWatched ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-neutral-600">{idx + 1}</td>
                        {/* Token info */}
                        <td className="px-4 py-2.5">
                          <Link
                            to="/token/$mint"
                            params={{ mint: p.baseToken.address }}
                            className="flex items-center gap-3"
                          >
                            {p.info?.imageUrl ? (
                              <img src={p.info.imageUrl} alt="" className="h-7 w-7 rounded-sm bg-neutral-900 object-cover shrink-0" loading="lazy" />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-violet/15 text-[9px] font-bold text-violet border border-violet/20">
                                {p.baseToken.symbol.slice(0, 3)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">{p.baseToken.symbol}</span>
                                <span className="hidden truncate text-[9px] text-neutral-600 md:block">
                                  {p.baseToken.name}
                                </span>
                              </div>
                              <div className="text-[9px] text-neutral-700 uppercase tracking-wider">{p.dexId}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right"><RiskBadge score={riskScore} /></td>
                        <td className="px-4 py-2.5 text-right font-mono text-white">
                          {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                        </td>
                        <td className={"px-4 py-2.5 text-right font-mono " + pctClass(ch1)}>{fmtPct(ch1)}</td>
                        <td className={"px-4 py-2.5 text-right font-mono " + pctClass(ch24)}>{fmtPct(ch24)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-neutral-300">
                          {p.volume?.h24 ? "$" + compact(p.volume.h24) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-neutral-300">
                          {p.liquidity?.usd ? "$" + compact(p.liquidity.usd) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-neutral-300">
                          {p.marketCap ? "$" + compact(p.marketCap) : p.fdv ? "$" + compact(p.fdv) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-neutral-600">
                          {ageFromMs(p.pairCreatedAt)}
                        </td>
                        {/* Mini sparkline */}
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end">
                            <Sparkline positive={(ch24 ?? 0) >= 0} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-4 py-16 text-center text-[11px] uppercase tracking-widest text-neutral-700">
                        {tab === "watchlist" ? "No tokens in watchlist. Star tokens to track them." : "No tokens match your filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Grid View ───────────────────────────────────────── */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading &&
              Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-sm border border-neutral-900 bg-neutral-900" />
              ))}
            {rows.map((p) => {
              const ch24 = p.priceChange?.h24 ?? null;
              const isWatched = watchlist.has(p.baseToken.address);
              const riskScore = mockRiskScore(p.baseToken.symbol);
              return (
                <div key={p.pairAddress} className="group relative rounded-sm border border-neutral-800 bg-[#0a0a0a] p-3 hover:border-neutral-600 transition-none">
                  {/* Star */}
                  <button
                    onClick={() => toggleWatchlist(p.baseToken.address)}
                    className={`absolute right-2 top-2 transition-none ${isWatched ? "text-amber-400" : "text-neutral-800 group-hover:text-neutral-600"}`}
                  >
                    <Star className="h-3.5 w-3.5" fill={isWatched ? "currentColor" : "none"} />
                  </button>
                  <Link to="/token/$mint" params={{ mint: p.baseToken.address }}>
                    <div className="flex items-center gap-2 mb-3">
                      {p.info?.imageUrl ? (
                        <img src={p.info.imageUrl} alt="" className="h-8 w-8 rounded-sm object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-violet/15 text-[9px] font-bold text-violet border border-violet/20">
                          {p.baseToken.symbol.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-[12px] text-white">{p.baseToken.symbol}</div>
                        <RiskBadge score={riskScore} />
                      </div>
                    </div>
                    <Sparkline positive={(ch24 ?? 0) >= 0} />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-white">
                        {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                      </span>
                      <span className={"font-mono text-[11px] font-bold " + pctClass(ch24)}>
                        {fmtPct(ch24)}
                      </span>
                    </div>
                    <div className="mt-1 text-[9px] text-neutral-700 uppercase tracking-wider">
                      Vol ${compact(p.volume?.h24 ?? 0)}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
