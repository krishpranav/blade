import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import {
  getNewSolana,
  getFinalStretchSolana,
  getMigratedSolana,
  type DSPair,
} from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";
import { Rocket, Zap, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PulsePage() {
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-semibold tracking-tight">Pulse</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-bull pulse-dot" />
              Live · pump.fun & DexScreener
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">Auto-refresh 12–20s</div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Column
            title="New Pairs"
            subtitle="Just launched"
            accent="text-violet"
            icon={Rocket}
            data={newQ.data}
            loading={newQ.isLoading}
          />
          <Column
            title="Final Stretch"
            subtitle="About to migrate"
            accent="text-amber-400"
            icon={Zap}
            data={stretchQ.data}
            loading={stretchQ.isLoading}
          />
          <Column
            title="Migrated"
            subtitle="Graduated to Raydium"
            accent="text-bull"
            icon={CheckCircle2}
            data={migQ.data}
            loading={migQ.isLoading}
          />
        </div>
      </div>
    </AppLayout>
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
