import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { getTokenPairs, getTrendingSolana } from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass, shortAddr } from "@/lib/format";
import { ExternalLink, Copy, ArrowLeft } from "lucide-react";
import { SwapTerminal } from "@/components/SwapTerminal";
import { TradeHistory } from "@/components/TradeHistory";
import { SmartMoneyPanel } from "@/components/SmartMoneyPanel";
import { WalletHoldings } from "@/components/WalletHoldings";
import { TokenSecurityPanel } from "@/components/TokenSecurityPanel";

export function TokenPage() {
  const { mint } = useParams({ from: "/token/$mint" });
  const { data, isLoading } = useQuery({
    queryKey: ["token-pairs", mint],
    queryFn: () => getTokenPairs({ data: { mint } }),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const top = data?.[0];

  const { data: trending } = useQuery({
    queryKey: ["trending-solana"],
    queryFn: () => getTrendingSolana(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

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

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[260px_1fr_360px] items-start">
          {/* Left Sidebar: Trending */}
          <div className="flex h-[800px] flex-col overflow-hidden rounded-xl border border-border bg-surface/20 shadow-card">
            <div className="border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hot Pairs
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {trending?.slice(0, 20).map((t) => {
                const isSelected = mint === t.baseToken.address;
                return (
                  <Link
                    key={t.pairAddress}
                    to="/token/$mint"
                    params={{ mint: t.baseToken.address }}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${isSelected ? "bg-surface-2 border border-border/50" : "hover:bg-surface"}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{t.baseToken.symbol}</span>
                      <span className="text-[10px] text-muted-foreground">${compact(t.liquidity?.usd || 0)} Liq</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[12px]">{t.priceUsd ? fmtUsd(parseFloat(t.priceUsd)) : "—"}</span>
                      <span className={"font-mono text-[11px] " + pctClass(t.priceChange?.h24)}>
                        {fmtPct(t.priceChange?.h24)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Center Column: Header + Stats + Chart */}
          <div className="flex flex-col gap-3 h-full">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/40 p-4 shadow-card">
              {top.info?.imageUrl ? (
                <img src={top.info.imageUrl} alt="" className="h-12 w-12 rounded-full bg-surface-2 object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet/20 text-sm font-semibold">
                  {top.baseToken.symbol.slice(0, 3)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-semibold tracking-tight">{top.baseToken.symbol}</h1>
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
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
              <div className="ml-auto flex gap-3 text-right">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Price</div>
                  <div className="font-mono text-lg font-semibold">{price ? fmtUsd(price) : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">24h</div>
                  <div className={"font-mono text-lg " + pctClass(ch24)}>{fmtPct(ch24)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <Cell label="Liquidity" value={top.liquidity?.usd ? "$" + compact(top.liquidity.usd) : "—"} />
              <Cell label="Volume 24h" value={top.volume?.h24 ? "$" + compact(top.volume.h24) : "—"} />
              <Cell label="Market Cap" value={top.marketCap ? "$" + compact(top.marketCap) : "—"} />
              <Cell label="FDV" value={top.fdv ? "$" + compact(top.fdv) : "—"} />
              <Cell label="Trades" value={total ? total.toLocaleString() : "—"} />
            </div>

            <div className="flex h-[400px] flex-col overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
              <iframe
                src={`https://dexscreener.com/solana/${top.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                className="flex-1 w-full bg-background"
                title="chart"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex h-[380px] flex-col overflow-hidden rounded-xl shadow-card">
                <TradeHistory currentPriceUsd={price || 0.005} />
              </div>
              <div className="flex h-[380px] flex-col overflow-hidden rounded-xl shadow-card">
                <SmartMoneyPanel />
              </div>
            </div>
          </div>

          {/* Right Column: SwapTerminal + Wallet + Security */}
          <div className="flex flex-col gap-3">
            <SwapTerminal defaultInput="SOL" defaultOutput={top.baseToken.symbol} />
            
            <WalletHoldings 
              tokenSymbol={top.baseToken.symbol} 
              currentPriceUsd={price || 0} 
            />

            <TokenSecurityPanel tokenSymbol={top.baseToken.symbol} />
            
            {/* Buy/sell pressure compact widget */}
            <div className="rounded-xl border border-border bg-surface/40 p-4 shadow-card">
              <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Buy pressure (24h)</span>
                <span>{buys24.toLocaleString()} / {sells24.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bear/30">
                <div className="h-full bg-bull transition-all" style={{ width: buyPct + "%" }} />
              </div>
            </div>
          </div>
        </div>
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


