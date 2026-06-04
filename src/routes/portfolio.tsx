import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { getBackendRebalancePlan, getWalletHoldings, getTokensInfo } from "@/server/solana";
import { compact, fmtUsd, shortAddr } from "@/lib/format";
import { Wallet, Search, AlertTriangle, ShieldCheck, PieChart } from "lucide-react";

export function PortfolioPage() {
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState("");

  const { data: holdings, isFetching } = useQuery({
    queryKey: ["wallet", wallet],
    queryFn: () => getWalletHoldings({ data: { wallet } }),
    enabled: !!wallet,
    staleTime: 30_000,
  });

  const mints = (() => {
    const list = (holdings?.tokens ?? []).slice(0, 30).map((t) => t.mint);
    if (holdings && !list.includes("So11111111111111111111111111111111111111112")) {
      list.push("So11111111111111111111111111111111111111112");
    }
    return list;
  })();

  const { data: pairs } = useQuery({
    queryKey: ["tokens-info", mints.join(",")],
    queryFn: () => getTokensInfo({ data: { mints } }),
    enabled: mints.length > 0,
    staleTime: 30_000,
  });

  const priceMap = new Map<string, { price: number; symbol: string; name: string; img?: string }>();
  for (const p of pairs ?? []) {
    if (!priceMap.has(p.baseToken.address) && p.priceUsd) {
      priceMap.set(p.baseToken.address, {
        price: parseFloat(p.priceUsd),
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        img: p.info?.imageUrl,
      });
    }
  }

  const SOL_PRICE =
    (pairs ?? []).find(
      (p) =>
        p.baseToken.symbol === "SOL" ||
        p.baseToken.address === "So11111111111111111111111111111111111111112",
    )?.priceUsd ?? null;

  const enriched = (holdings?.tokens ?? [])
    .map((t) => {
      const m = priceMap.get(t.mint);
      const value = m ? m.price * t.amount : 0;
      return { ...t, ...m, value };
    })
    .sort((a, b) => b.value - a.value);

  const tokensValue = enriched.reduce((acc, t) => acc + (t.value || 0), 0);
  const solValue = SOL_PRICE && holdings ? parseFloat(SOL_PRICE) * holdings.solBalance : 0;
  const total = tokensValue + solValue;
  const pricedRows = enriched.filter((t) => t.value > 0);
  const topHolding = pricedRows[0];
  const topAllocation = total > 0 && topHolding ? (topHolding.value / total) * 100 : 0;
  const stableValue = enriched
    .filter((t) => ["USDC", "USDT", "USDH", "PYUSD"].includes(t.symbol ?? ""))
    .reduce((acc, t) => acc + (t.value || 0), 0);
  const stableAllocation = total > 0 ? (stableValue / total) * 100 : 0;
  const unknownCount = (holdings?.tokens ?? []).filter((t) => !priceMap.has(t.mint)).length;
  const portfolioScore = Math.max(
    0,
    Math.min(
      100,
      92 -
        Math.max(0, topAllocation - 35) * 0.7 -
        Math.max(0, unknownCount - 3) * 3 -
        (stableAllocation < 5 && total > 500 ? 8 : 0),
    ),
  );
  const riskLabel =
    portfolioScore >= 75 ? "Balanced" : portfolioScore >= 55 ? "Watch" : "Concentrated";

  const { data: rebalancePlan } = useQuery({
    queryKey: [
      "rebalance-plan",
      wallet,
      total,
      topHolding?.symbol,
      topAllocation,
      stableAllocation,
    ],
    queryFn: () =>
      getBackendRebalancePlan({
        wallet,
        total_value_usd: total,
        largest_symbol: topHolding?.symbol,
        largest_allocation_pct: topAllocation,
        stable_allocation_pct: stableAllocation,
      }),
    enabled: Boolean(wallet && holdings && total > 0),
    staleTime: 30_000,
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Look up any Solana wallet's holdings — read-only, no connection.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setWallet(input.trim());
          }}
          className="flex gap-2"
        >
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a Solana wallet address…"
              className="h-11 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-gradient px-5 text-sm font-semibold text-primary-foreground"
          >
            <Search className="h-4 w-4" /> Track
          </button>
        </form>

        {/* Quick examples */}
        {!wallet && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            Try:
            {[
              "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", // Raydium
              "GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrAtiKKvuZ",
            ].map((w) => (
              <button
                key={w}
                onClick={() => {
                  setInput(w);
                  setWallet(w);
                }}
                className="rounded-full border border-border bg-surface/60 px-2.5 py-1 font-mono hover:text-foreground"
              >
                {shortAddr(w, 6)}
              </button>
            ))}
          </div>
        )}

        {wallet && (
          <div className="mt-6">
            {holdings?.error && (
              <div className="rounded-lg border border-bear/40 bg-bear/10 p-4 text-sm text-bear">
                {holdings.error}
              </div>
            )}

            {!holdings?.error && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Stat label="Total Value" value={fmtUsd(total)} big />
                  <Stat
                    label="SOL Balance"
                    value={(holdings?.solBalance ?? 0).toFixed(4) + " SOL"}
                  />
                  <Stat
                    label="SPL Tokens"
                    value={(holdings?.tokens?.length ?? 0).toLocaleString()}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr]">
                  <DiagnosticCard
                    icon={portfolioScore >= 75 ? ShieldCheck : AlertTriangle}
                    label="Portfolio Health"
                    value={riskLabel}
                    tone={portfolioScore >= 75 ? "bull" : portfolioScore >= 55 ? "warn" : "bear"}
                    detail={`${portfolioScore.toFixed(0)}/100 score`}
                  />
                  <DiagnosticCard
                    icon={PieChart}
                    label="Largest Position"
                    value={topHolding?.symbol ?? "—"}
                    tone={topAllocation > 50 ? "bear" : topAllocation > 35 ? "warn" : "bull"}
                    detail={
                      topHolding
                        ? `${topAllocation.toFixed(1)}% of priced value`
                        : "No priced tokens"
                    }
                  />
                  <DiagnosticCard
                    icon={ShieldCheck}
                    label="Stable Buffer"
                    value={`${stableAllocation.toFixed(1)}%`}
                    tone={stableAllocation >= 10 ? "bull" : stableAllocation >= 5 ? "warn" : "bear"}
                    detail={`${unknownCount} unpriced token${unknownCount === 1 ? "" : "s"}`}
                  />
                </div>

                <div className="mt-3 rounded-xl border border-border bg-surface/40 p-4 shadow-card">
                  <div className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Rebalance Notes
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <Note
                      active={topAllocation > 40}
                      text={
                        topAllocation > 40
                          ? `${topHolding?.symbol ?? "Top token"} is above 40% allocation.`
                          : "No single priced token dominates the wallet."
                      }
                    />
                    <Note
                      active={stableAllocation < 5 && total > 500}
                      text={
                        stableAllocation < 5 && total > 500
                          ? "Stable exposure is thin for volatile rotations."
                          : "Stablecoin buffer is within the tracked range."
                      }
                    />
                    <Note
                      active={unknownCount > 3}
                      text={
                        unknownCount > 3
                          ? "Several tokens do not have DexScreener pricing."
                          : "Most tracked holdings have live price data."
                      }
                    />
                  </div>
                </div>

                {rebalancePlan && (
                  <div className="mt-3 rounded-xl border border-border bg-surface/40 p-4 shadow-card">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Backend Rebalance Plan
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        Stable {rebalancePlan.target_stable_pct.toFixed(0)}% · Max{" "}
                        {rebalancePlan.concentration_limit_pct.toFixed(0)}%
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {rebalancePlan.actions.map((action) => (
                        <div
                          key={action.action}
                          className="rounded-lg border border-border/60 bg-background/40 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">{action.action}</span>
                            <span
                              className={
                                "rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase " +
                                (action.priority === "high"
                                  ? "bg-bear/10 text-bear"
                                  : action.priority === "medium"
                                    ? "bg-chart-4/10 text-chart-4"
                                    : "bg-bull/10 text-bull")
                              }
                            >
                              {action.priority}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-sm">
                            {action.amount_usd > 0 ? fmtUsd(action.amount_usd) : "No trade"}
                          </div>
                          <div className="mt-1 text-[12px] text-muted-foreground">
                            {action.rationale}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Holdings table */}
                <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Token</th>
                          <th className="px-4 py-3 text-right font-medium">Price</th>
                          <th className="px-4 py-3 text-right font-medium">Balance</th>
                          <th className="px-4 py-3 text-right font-medium">Value</th>
                          <th className="px-4 py-3 text-right font-medium">Allocation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isFetching && !holdings && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-12 text-center text-sm text-muted-foreground"
                            >
                              Loading wallet…
                            </td>
                          </tr>
                        )}
                        {enriched.map((t) => {
                          const alloc = total > 0 ? (t.value / total) * 100 : 0;
                          return (
                            <tr
                              key={t.mint}
                              className="border-t border-border/40 hover:bg-surface-2"
                            >
                              <td className="px-4 py-3">
                                <Link
                                  to="/token/$mint"
                                  params={{ mint: t.mint }}
                                  className="flex items-center gap-2"
                                >
                                  {t.img ? (
                                    <img
                                      src={t.img}
                                      alt=""
                                      className="h-7 w-7 rounded-full bg-surface-2 object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet/20 text-[10px] font-semibold">
                                      {(t.symbol ?? "?").slice(0, 3)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold">
                                      {t.symbol ?? shortAddr(t.mint)}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {t.name ?? shortAddr(t.mint, 6)}
                                    </div>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {t.price ? fmtUsd(t.price) : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {compact(t.amount)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {t.value > 0 ? fmtUsd(t.value) : "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="ml-auto flex w-32 items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                                    <div
                                      className="h-full bg-violet-gradient"
                                      style={{ width: alloc + "%" }}
                                    />
                                  </div>
                                  <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">
                                    {alloc.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!isFetching && enriched.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-12 text-center text-sm text-muted-foreground"
                            >
                              No SPL tokens with price data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function DiagnosticCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
  tone: "bull" | "warn" | "bear";
}) {
  const toneClass = tone === "bull" ? "text-bull" : tone === "warn" ? "text-chart-4" : "text-bear";
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={"h-4 w-4 " + toneClass} />
      </div>
      <div className={"mt-2 font-mono text-xl font-semibold " + toneClass}>{value}</div>
      <div className="mt-1 text-[12px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function Note({ active, text }: { active: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 p-3">
      <span
        className={"mt-1 h-1.5 w-1.5 shrink-0 rounded-full " + (active ? "bg-chart-4" : "bg-bull")}
      />
      <span>{text}</span>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 shadow-card">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 font-mono font-semibold " + (big ? "text-2xl" : "text-lg")}>
        {value}
      </div>
    </div>
  );
}
