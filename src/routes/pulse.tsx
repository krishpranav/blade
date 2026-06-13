import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  getNewSolana,
  getFinalStretchSolana,
  getMigratedSolana,
  type DSPair,
} from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";
import { Activity, CheckCircle2, Filter, Rocket, ShieldAlert, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PulseFilter = "all" | "liquid" | "momentum" | "fresh";

function launchScore(p: DSPair): number {
  const liquidity = p.liquidity?.usd ?? 0;
  const volume = p.volume?.h24 ?? 0;
  const txns = (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0);
  const ageHours = p.pairCreatedAt ? Math.max(0, (Date.now() - p.pairCreatedAt) / 3_600_000) : 24;
  const liquidityScore = Math.min(35, liquidity / 4_000);
  const volumeScore = Math.min(30, volume / 12_000);
  const txnScore = Math.min(20, txns / 8);
  const freshnessScore = Math.max(0, 15 - ageHours * 1.5);
  return Math.round(Math.min(100, liquidityScore + volumeScore + txnScore + freshnessScore));
}

function applyPulseFilter(rows: DSPair[], filter: PulseFilter): DSPair[] {
  switch (filter) {
    case "liquid":
      return rows.filter((p) => (p.liquidity?.usd ?? 0) >= 50_000);
    case "momentum":
      return rows.filter((p) => (p.volume?.h24 ?? 0) >= 100_000 || launchScore(p) >= 65);
    case "fresh":
      return rows.filter((p) => {
        if (!p.pairCreatedAt) return false;
        return Date.now() - p.pairCreatedAt <= 2 * 60 * 60 * 1000;
      });
    default:
      return rows;
  }
}

export function PulsePage() {
  const [filter, setFilter] = useState<PulseFilter>("all");
  const newQ = useQuery({
    queryKey: ["pulse-new"],
    queryFn: () => getNewSolana(),
    refetchInterval: 12_000,
    staleTime: 8_000,
  });
  const stretchQ = useQuery({
    queryKey: ["pulse-stretch"],
    queryFn: () => getFinalStretchSolana(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const migQ = useQuery({
    queryKey: ["pulse-migrated"],
    queryFn: () => getMigratedSolana(),
    refetchInterval: 20_000,
    staleTime: 15_000,
  });

  const filtered = useMemo(
    () => ({
      newRows: applyPulseFilter(newQ.data ?? [], filter),
      stretchRows: applyPulseFilter(stretchQ.data ?? [], filter),
      migratedRows: applyPulseFilter(migQ.data ?? [], filter),
    }),
    [filter, migQ.data, newQ.data, stretchQ.data],
  );

  const radar = useMemo(() => {
    const allRows = [filtered.newRows, filtered.stretchRows, filtered.migratedRows].flat();
    const unique = Array.from(new Map(allRows.map((p) => [p.baseToken.address, p])).values());
    const hot = unique.filter((p) => launchScore(p) >= 70).length;
    const volume = unique.reduce((acc, p) => acc + (p.volume?.h24 ?? 0), 0);
    const liquidity = unique.reduce((acc, p) => acc + (p.liquidity?.usd ?? 0), 0);
    const best = [...unique].sort((a, b) => launchScore(b) - launchScore(a))[0];
    return { total: unique.length, hot, volume, liquidity, best };
  }, [filtered]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-semibold tracking-tight">Pulse</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-bull pulse-dot" />
              Live · pump.fun & DexScreener
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-[11px] text-muted-foreground sm:block">
              Auto-refresh 12–20s
            </div>
            <div className="flex overflow-hidden rounded-md border border-border bg-surface/60">
              {[
                { id: "all", label: "All" },
                { id: "liquid", label: "Liquid" },
                { id: "momentum", label: "Momentum" },
                { id: "fresh", label: "Fresh" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as PulseFilter)}
                  className={
                    "px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors " +
                    (filter === item.id
                      ? "bg-violet/20 text-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <RadarStat icon={Filter} label="Filtered" value={radar.total.toString()} />
          <RadarStat
            icon={Zap}
            label="Hot Scores"
            value={radar.hot.toString()}
            tone="text-chart-4"
          />
          <RadarStat icon={Activity} label="24h Volume" value={"$" + compact(radar.volume)} />
          <RadarStat icon={ShieldAlert} label="Liquidity" value={"$" + compact(radar.liquidity)} />
          <RadarStat
            icon={Rocket}
            label="Top Signal"
            value={radar.best?.baseToken.symbol ?? "—"}
            tone="text-violet"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Column
            title="New Pairs"
            subtitle="Just launched"
            accent="text-violet"
            icon={Rocket}
            data={filtered.newRows}
            loading={newQ.isLoading}
          />
          <Column
            title="Final Stretch"
            subtitle="About to migrate"
            accent="text-amber-400"
            icon={Zap}
            data={filtered.stretchRows}
            loading={stretchQ.isLoading}
          />
          <Column
            title="Migrated"
            subtitle="Graduated to Raydium"
            accent="text-bull"
            icon={CheckCircle2}
            data={filtered.migratedRows}
            loading={migQ.isLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function RadarStat({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={"h-3.5 w-3.5 " + tone} />
      </div>
      <div className={"mt-1 font-mono text-sm font-semibold " + tone}>{value}</div>
    </div>
  );
}

function Column({
  title,
  subtitle,
  accent,
  icon: Icon,
  data,
  loading,
}: {
  title: string;
  subtitle: string;
  accent: string;
  icon: LucideIcon;
  data: DSPair[] | undefined;
  loading: boolean;
}) {
  const rows = data ?? [];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
      <div className="flex items-center justify-between border-b border-border bg-surface/80 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className={"h-4 w-4 " + accent} />
          <div>
            <div className="text-[13px] font-semibold leading-tight">{title}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </div>
          </div>
        </div>
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {rows.length}
        </span>
      </div>
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="m-2 h-16 animate-pulse rounded-md bg-surface-2/60" />
          ))}
        {!loading && rows.length === 0 && (
          <div className="px-4 py-12 text-center text-xs text-muted-foreground">No tokens.</div>
        )}
        {rows.map((p) => (
          <PulseRow key={p.pairAddress} p={p} />
        ))}
      </div>
    </div>
  );
}

function PulseRow({ p }: { p: DSPair }) {
  const ch = p.priceChange?.h24 ?? p.priceChange?.h1 ?? 0;
  const score = launchScore(p);
  return (
    <Link
      to="/token/$mint"
      params={{ mint: p.baseToken.address }}
      className="block border-b border-border/40 px-3 py-2.5 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-start gap-2.5">
        {p.info?.imageUrl ? (
          <img
            src={p.info.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full bg-surface-2 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet/20 text-[10px] font-semibold">
            {p.baseToken.symbol.slice(0, 3)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 truncate text-[13px] font-semibold">
              {p.baseToken.symbol}
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                {p.baseToken.name}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {ageFromMs(p.pairCreatedAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className={
                  "h-full " +
                  (score >= 70 ? "bg-bull" : score >= 45 ? "bg-chart-4" : "bg-muted-foreground")
                }
                style={{ width: score + "%" }}
              />
            </div>
            <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
              {score}/100
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[12px]">
              {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
            </span>
            <span className={"font-mono text-[11px] " + pctClass(ch)}>{fmtPct(ch)}</span>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
            <Stat label="V" value={p.volume?.h24 ? "$" + compact(p.volume.h24) : "—"} />
            <Stat label="L" value={p.liquidity?.usd ? "$" + compact(p.liquidity.usd) : "—"} />
            <Stat label="MC" value={p.marketCap ? "$" + compact(p.marketCap) : "—"} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
