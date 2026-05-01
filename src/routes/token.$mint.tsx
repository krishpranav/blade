import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { getTokenPairs } from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass, shortAddr } from "@/lib/format";
import { ExternalLink, Copy, ArrowLeft } from "lucide-react";
import { SwapTerminal } from "@/components/SwapTerminal";

export function TokenPage() {
  const { mint } = useParams({ from: "/token/$mint" });
  const { data, isLoading } = useQuery({
    queryKey: ["token-pairs", mint],
    queryFn: () => getTokenPairs({ data: { mint } }),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const top = data?.[0];
  const wallet = useWallet();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <div className="h-64 animate-pulse rounded-xl bg-surface" />
        </div>
      </AppLayout>
    );
  }

  if (!top) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-[1200px] px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold">Token not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find any Solana pairs for this mint.
          </p>
          <Link
            to="/discover"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-gradient px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Browse Discover
          </Link>
        </div>
      </AppLayout>
    );
  }

  const ch24 = top.priceChange?.h24 ?? null;
  const price = top.priceUsd ? parseFloat(top.priceUsd) : null;
  const buys24 = top.txns?.h24?.buys ?? 0;
  const sells24 = top.txns?.h24?.sells ?? 0;
  const total = buys24 + sells24;
  const buyPct = total > 0 ? (buys24 / total) * 100 : 50;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <button
          onClick={() => window.history.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/40 p-5 shadow-card">
          {top.info?.imageUrl ? (
            <img
              src={top.info.imageUrl}
              alt=""
              className="h-14 w-14 rounded-full bg-surface-2 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet/20 text-sm font-semibold">
              {top.baseToken.symbol.slice(0, 3)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {top.baseToken.symbol}
              </h1>
              <span className="text-sm text-muted-foreground">{top.baseToken.name}</span>
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] uppercase text-muted-foreground">
                {top.dexId}
              </span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(mint)}
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              {shortAddr(mint, 8)} <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono text-2xl font-semibold">{price ? fmtUsd(price) : "—"}</div>
            <div className={"font-mono text-sm " + pctClass(ch24)}>
              {fmtPct(ch24)} <span className="text-muted-foreground">24h</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
          <Cell
            label="Liquidity"
            value={top.liquidity?.usd ? "$" + compact(top.liquidity.usd) : "—"}
          />
          <Cell label="Volume 24h" value={top.volume?.h24 ? "$" + compact(top.volume.h24) : "—"} />
          <Cell label="Market Cap" value={top.marketCap ? "$" + compact(top.marketCap) : "—"} />
          <Cell label="FDV" value={top.fdv ? "$" + compact(top.fdv) : "—"} />
          <Cell label="Pair Age" value={ageFromMs(top.pairCreatedAt)} />
          <Cell label="Trades 24h" value={total ? total.toLocaleString() : "—"} />
        </div>

        {/* Chart + trade panel */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-semibold">
                  {top.baseToken.symbol}/{top.quoteToken.symbol}
                </span>
                <span className="text-muted-foreground">on {top.dexId}</span>
              </div>
              {top.url && (
                <a
                  href={top.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Open chart <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {/* Embed DexScreener chart for real candles */}
            <iframe
              src={`https://dexscreener.com/solana/${top.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
              className="flex-1 w-full bg-background"
              title="chart"
            />
          </div>

          {/* Trade panel */}
          <div className="flex flex-col gap-4">
            <SwapTerminal defaultInput="SOL" defaultOutput={top.baseToken.symbol} />
          </div>
        </div>

        {/* Other pools */}
        {data && data.length > 1 && (
          <div className="mt-6">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Other pools
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
              <table className="w-full text-sm">
                <thead className="bg-surface/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Pool</th>
                    <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th className="px-4 py-2.5 text-right font-medium">Liquidity</th>
                    <th className="px-4 py-2.5 text-right font-medium">Vol 24h</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(1, 8).map((p) => (
                    <tr
                      key={p.pairAddress}
                      className="border-t border-border/40 hover:bg-surface-2"
                    >
                      <td className="px-4 py-2.5">
                        {p.dexId} · {p.baseToken.symbol}/{p.quoteToken.symbol}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {p.liquidity?.usd ? "$" + compact(p.liquidity.usd) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {p.volume?.h24 ? "$" + compact(p.volume.h24) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Removed old modals */}
    </AppLayout>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}


