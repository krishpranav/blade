import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  getTrendingSolana,
  getMemecoinsSolana,
  type DSPair,
} from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";
import { Flame, Sparkles, Rocket, BarChart3, Coins } from "lucide-react";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Trending Solana Tokens & Memes | Vertex" },
      {
        name: "description",
        content:
          "Real-time trending Solana tokens and memecoins with price, volume, liquidity, market cap and age.",
      },
      { property: "og:title", content: "Discover Solana tokens — Vertex" },
      {
        property: "og:description",
        content:
          "Live trending Solana tokens & pump.fun memes, sortable by price change, volume, liquidity, and market cap.",
      },
    ],
  }),
  component: Discover,
});

type Tab = "trending" | "memes";
type Filter = "trending" | "gainers" | "new" | "volume";

const FILTERS: { id: Filter; label: string; icon: typeof Flame }[] = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "gainers", label: "Top Gainers", icon: Sparkles },
  { id: "new", label: "New", icon: Rocket },
  { id: "volume", label: "High Volume", icon: BarChart3 },
];

function Discover() {
  const [tab, setTab] = useState<Tab>("trending");
  const [filter, setFilter] = useState<Filter>("trending");
  const [q, setQ] = useState("");

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

  const data = tab === "trending" ? trendingQ.data : memesQ.data;
  const isLoading = tab === "trending" ? trendingQ.isLoading : memesQ.isLoading;

  const rows = useMemo(() => {
    let list: DSPair[] = data ?? [];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.baseToken.symbol.toLowerCase().includes(needle) ||
          p.baseToken.name.toLowerCase().includes(needle) ||
          p.baseToken.address.toLowerCase().includes(needle),
      );
    }
    if (filter === "gainers") {
      list = [...list].sort(
        (a, b) => (b.priceChange?.h24 ?? 0) - (a.priceChange?.h24 ?? 0),
      );
    } else if (filter === "new") {
      list = [...list].sort(
        (a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0),
      );
    } else if (filter === "volume") {
      list = [...list].sort(
        (a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0),
      );
    }
    return list;
  }, [data, q, filter]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Discover
            </h1>
            <p className="text-sm text-muted-foreground">
              Live Solana markets, sorted by activity. Refreshes every 30s.
            </p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by symbol, name, or address…"
            className="h-9 w-full max-w-xs rounded-md border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-violet"
          />
        </div>

        <div className="mb-4 inline-flex items-center gap-1 rounded-lg border border-border bg-surface/40 p-1">
          {([
            { id: "trending", label: "Trending", icon: Flame },
            { id: "memes", label: "Memes", icon: Coins },
          ] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[12px] font-semibold transition-colors " +
                  (active
                    ? "bg-violet-gradient text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors " +
                  (active
                    ? "border-violet/50 bg-violet/15 text-foreground"
                    : "border-border bg-surface/60 text-muted-foreground hover:text-foreground")
                }
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">1h</th>
                  <th className="px-4 py-3 text-right font-medium">24h</th>
                  <th className="px-4 py-3 text-right font-medium">Volume 24h</th>
                  <th className="px-4 py-3 text-right font-medium">Liquidity</th>
                  <th className="px-4 py-3 text-right font-medium">MCap</th>
                  <th className="px-4 py-3 text-right font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="h-6 animate-pulse rounded bg-surface-2" />
                      </td>
                    </tr>
                  ))}
                {rows.map((p) => {
                  const ch1 = p.priceChange?.h1 ?? null;
                  const ch24 = p.priceChange?.h24 ?? null;
                  return (
                    <tr
                      key={p.pairAddress}
                      className="border-b border-border/40 transition-colors hover:bg-surface-2"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/token/$mint"
                          params={{ mint: p.baseToken.address }}
                          className="flex items-center gap-3"
                        >
                          {p.info?.imageUrl ? (
                            <img
                              src={p.info.imageUrl}
                              alt=""
                              className="h-7 w-7 rounded-full bg-surface-2 object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet/20 text-[10px] font-semibold">
                              {p.baseToken.symbol.slice(0, 3)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              {p.baseToken.symbol}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {p.baseToken.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {p.dexId} · {p.quoteToken.symbol}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                      </td>
                      <td className={"px-4 py-3 text-right font-mono " + pctClass(ch1)}>
                        {fmtPct(ch1)}
                      </td>
                      <td className={"px-4 py-3 text-right font-mono " + pctClass(ch24)}>
                        {fmtPct(ch24)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.volume?.h24 ? "$" + compact(p.volume.h24) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.liquidity?.usd ? "$" + compact(p.liquidity.usd) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.marketCap ? "$" + compact(p.marketCap) : p.fdv ? "$" + compact(p.fdv) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {ageFromMs(p.pairCreatedAt)}
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No tokens match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
