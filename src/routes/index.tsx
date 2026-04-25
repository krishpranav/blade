import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { getTrendingSolana, getMarketStats } from "@/server/solana";
import { compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";
import {
  Zap,
  Eye,
  Crosshair,
  Workflow,
  TrendingUp,
  Coins,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vertex — The Gateway to Solana DeFi" },
      {
        name: "description",
        content:
          "The fastest trading terminal for Solana. Discover trending tokens, snipe new launches, track wallets, trade perps, and earn yield.",
      },
      { property: "og:title", content: "Vertex — The Gateway to Solana DeFi" },
      {
        property: "og:description",
        content:
          "Trade Solana with a single, ultra-fast terminal. Real-time market data, wallet tracking, and yield in one place.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: trending } = useQuery({
    queryKey: ["trending-solana"],
    queryFn: () => getTrendingSolana(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["market-stats"],
    queryFn: () => getMarketStats(),
    refetchInterval: 30_000,
  });

  const ticker = (trending ?? []).slice(0, 24);

  return (
    <AppLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.5]" />
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto max-w-[1200px] px-4 pb-24 pt-24 text-center md:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[12px] text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-bull pulse-dot" />
            Live on Solana mainnet
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            The Gateway to{" "}
            <span className="text-violet-gradient">Solana DeFi</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Vertex is the only trading terminal you'll ever need. Real-time data,
            sub-block execution, and every Solana market in one screen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/discover"
              className="group inline-flex items-center gap-2 rounded-full bg-violet-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              Launch App
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/pulse"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-surface"
            >
              See live launches
            </Link>
          </div>

          {/* Stats band */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3">
            {[
              { label: "SOL Price", value: stats?.solUsd ? fmtUsd(stats.solUsd) : "—" },
              {
                label: "24h Volume",
                value: stats?.vol24h ? "$" + compact(stats.vol24h) : "—",
              },
              { label: "Pairs Tracked", value: stats?.pairs24h?.toLocaleString() ?? "—" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-surface/40 p-4 backdrop-blur"
              >
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 font-mono text-xl font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker */}
        {ticker.length > 0 && (
          <div className="relative border-y border-border bg-surface/40 py-3 backdrop-blur">
            <div className="flex w-max ticker gap-8 whitespace-nowrap">
              {[...ticker, ...ticker].map((p, i) => {
                const ch = p.priceChange?.h24 ?? 0;
                return (
                  <Link
                    to="/token/$mint"
                    params={{ mint: p.baseToken.address }}
                    key={p.pairAddress + i}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <span className="font-semibold">{p.baseToken.symbol}</span>
                    <span className="font-mono text-muted-foreground">
                      {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                    </span>
                    <span className={"font-mono " + pctClass(ch)}>{fmtPct(ch)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1200px] px-4 py-24">
        <div className="mb-12 text-center">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-violet">
            Built for Solana traders
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            Every edge, in one terminal
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From wallet tracking to real-time analytics — Vertex puts every
            advantage at your fingertips.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-6 transition-colors hover:bg-surface"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet/15 text-violet">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <div className="absolute inset-x-0 bottom-0 h-px bg-violet-gradient opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/40 p-12 text-center shadow-card">
          <div className="absolute inset-0 bg-hero opacity-60" />
          <div className="relative">
            <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to trade smarter?
            </h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Open the terminal — no signup, no wallet connect required.
            </p>
            <Link
              to="/discover"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Start exploring
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-4 text-[12px] text-muted-foreground md:flex-row">
          <div>© 2025 Vertex. Demo project — not financial advice.</div>
          <div className="flex gap-4">
            <Link to="/discover" className="hover:text-foreground">Discover</Link>
            <Link to="/pulse" className="hover:text-foreground">Pulse</Link>
            <Link to="/yield" className="hover:text-foreground">Yield</Link>
          </div>
        </div>
      </footer>
    </AppLayout>
  );
}

const features = [
  {
    icon: Zap,
    title: "Sub-block Execution",
    desc: "Limit orders land in ≤ 1 block via colocated nodes and a proprietary order engine.",
  },
  {
    icon: Eye,
    title: "Wallet & Social Tracker",
    desc: "Follow whales, mirror smart money, and watch on-chain alpha as it happens.",
  },
  {
    icon: Crosshair,
    title: "Migration Sniper",
    desc: "Buy migrating tokens the moment they list — never miss the open.",
  },
  {
    icon: ShieldCheck,
    title: "MEV Protected",
    desc: "Frontrunning and sandwich protection on every order, by default.",
  },
  {
    icon: Workflow,
    title: "Auto-Strategies",
    desc: "Set entries, ladders, and stop-losses in one click. We handle the rest.",
  },
  {
    icon: Coins,
    title: "Yield, Built-in",
    desc: "Park idle SOL and stables across the best Solana yield sources.",
  },
  {
    icon: TrendingUp,
    title: "Hyperliquid Perps",
    desc: "Trade leveraged perpetuals from the same screen as spot. Coming soon.",
  },
  {
    icon: Eye,
    title: "Real-time Pulse",
    desc: "Every new launch, migration, and trending token streamed live.",
  },
  {
    icon: ShieldCheck,
    title: "Self-custodial",
    desc: "Non-custodial by design. Your keys, your coins, always.",
  },
];
