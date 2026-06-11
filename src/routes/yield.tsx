import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { compact, fmtUsd } from "@/lib/format";

type Opp = {
  protocol: string;
  asset: string;
  apy: number;
  tvl: number;
  type: "Lending" | "LST" | "LP" | "Vault";
  risk: "Low" | "Medium" | "High";
  color: string;
};

type RiskFilter = "All" | Opp["risk"];
type TypeFilter = "All" | Opp["type"];

const OPPS: Opp[] = [
  {
    protocol: "Marinade",
    asset: "mSOL",
    apy: 7.21,
    tvl: 1_650_000_000,
    type: "LST",
    risk: "Low",
    color: "oklch(0.7 0.18 195)",
  },
  {
    protocol: "Jito",
    asset: "JitoSOL",
    apy: 7.84,
    tvl: 2_100_000_000,
    type: "LST",
    risk: "Low",
    color: "oklch(0.78 0.2 145)",
  },
  {
    protocol: "Kamino",
    asset: "USDC",
    apy: 12.45,
    tvl: 980_000_000,
    type: "Lending",
    risk: "Medium",
    color: "oklch(0.7 0.2 280)",
  },
  {
    protocol: "Kamino",
    asset: "SOL",
    apy: 6.92,
    tvl: 720_000_000,
    type: "Lending",
    risk: "Low",
    color: "oklch(0.7 0.2 280)",
  },
  {
    protocol: "MarginFi",
    asset: "USDC",
    apy: 9.31,
    tvl: 540_000_000,
    type: "Lending",
    risk: "Medium",
    color: "oklch(0.78 0.18 60)",
  },
  {
    protocol: "MarginFi",
    asset: "SOL",
    apy: 5.84,
    tvl: 410_000_000,
    type: "Lending",
    risk: "Low",
    color: "oklch(0.78 0.18 60)",
  },
  {
    protocol: "Drift",
    asset: "USDC",
    apy: 14.28,
    tvl: 320_000_000,
    type: "Lending",
    risk: "Medium",
    color: "oklch(0.65 0.22 310)",
  },
  {
    protocol: "Sanctum",
    asset: "INF",
    apy: 8.45,
    tvl: 280_000_000,
    type: "LST",
    risk: "Low",
    color: "oklch(0.65 0.24 22)",
  },
  {
    protocol: "Meteora",
    asset: "SOL/USDC",
    apy: 28.4,
    tvl: 180_000_000,
    type: "LP",
    risk: "High",
    color: "oklch(0.78 0.2 145)",
  },
  {
    protocol: "Orca",
    asset: "SOL/USDC",
    apy: 22.1,
    tvl: 150_000_000,
    type: "LP",
    risk: "High",
    color: "oklch(0.7 0.18 195)",
  },
  {
    protocol: "Raydium",
    asset: "SOL/USDT",
    apy: 19.6,
    tvl: 120_000_000,
    type: "LP",
    risk: "High",
    color: "oklch(0.65 0.22 285)",
  },
  {
    protocol: "Lulo",
    asset: "USDC",
    apy: 11.2,
    tvl: 95_000_000,
    type: "Vault",
    risk: "Medium",
    color: "oklch(0.78 0.18 60)",
  },
];

export function YieldPage() {
  const [risk, setRisk] = useState<RiskFilter>("All");
  const [type, setType] = useState<TypeFilter>("All");
  const [amount, setAmount] = useState(10_000);
  const [days, setDays] = useState(30);

  const list = OPPS.filter(
    (o) => (risk === "All" || o.risk === risk) && (type === "All" || o.type === type),
  ).sort((a, b) => b.apy - a.apy);
  const best = list[0];
  const conservative = [...list].filter((o) => o.risk !== "High").sort((a, b) => b.apy - a.apy)[0];
  const plannerRows = [
    best,
    conservative,
    ...list.filter((o) => o.protocol !== best?.protocol).slice(0, 2),
  ]
    .filter(Boolean)
    .filter(
      (o, index, arr) =>
        arr.findIndex((item) => item?.protocol === o?.protocol && item?.asset === o?.asset) ===
        index,
    ) as Opp[];

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Yield</h1>
          <p className="text-sm text-muted-foreground">
            The best Solana yield sources, ranked by APY. Indicative rates.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <Group
            label="Risk"
            options={["All", "Low", "Medium", "High"]}
            value={risk}
            onChange={(v) => setRisk(v as RiskFilter)}
          />
          <Group
            label="Type"
            options={["All", "Lending", "LST", "LP", "Vault"]}
            value={type}
            onChange={(v) => setType(v as TypeFilter)}
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[360px_1fr]">
          <div className="rounded-xl border border-border bg-surface/40 p-4 shadow-card">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              Earnings Planner
            </div>
            <label className="block text-[12px] text-muted-foreground">
              Deposit amount
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-violet"
              />
            </label>
            <label className="mt-3 block text-[12px] text-muted-foreground">
              Time horizon
              <div className="mt-1 flex overflow-hidden rounded-lg border border-border bg-background">
                {[7, 30, 90, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={
                      "h-10 flex-1 font-mono text-[12px] transition-colors " +
                      (days === d
                        ? "bg-violet/20 text-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-b border-border bg-surface/80 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>Strategy</span>
              <span className="text-right">APY</span>
              <span className="text-right">Projected</span>
              <span className="text-right">TVL</span>
            </div>
            {plannerRows.map((o) => {
              const projected = projectedYield(amount, o.apy, days);
              return (
                <div
                  key={o.protocol + o.asset + "planner"}
                  className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] items-center border-b border-border/40 px-4 py-3 text-sm last:border-b-0"
                >
                  <div>
                    <div className="font-semibold">{o.protocol}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {o.asset} · {o.risk} risk
                    </div>
                  </div>
                  <div className="text-right font-mono text-bull">{o.apy.toFixed(2)}%</div>
                  <div className="text-right font-mono">{fmtUsd(projected)}</div>
                  <div className="text-right font-mono text-muted-foreground">
                    ${compact(o.tvl)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((o) => (
            <div
              key={o.protocol + o.asset}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface/40 p-5 transition-colors hover:bg-surface"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {o.protocol}
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold">{o.asset}</div>
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: o.color + "26", color: o.color }}
                >
                  {o.type}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold text-bull">
                  {o.apy.toFixed(2)}%
                </span>
                <span className="text-[11px] text-muted-foreground">APY</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  TVL{" "}
                  <span className="font-mono text-foreground">${(o.tvl / 1e6).toFixed(0)}M</span>
                </span>
                <span>
                  Risk{" "}
                  <span
                    className={
                      o.risk === "Low"
                        ? "text-bull"
                        : o.risk === "Medium"
                          ? "text-chart-4"
                          : "text-bear"
                    }
                  >
                    {o.risk}
                  </span>
                </span>
              </div>
              <button className="mt-4 h-9 w-full rounded-lg border border-border bg-surface-2 text-[12px] font-semibold transition-colors hover:bg-violet/15 hover:text-foreground">
                Deposit · {fmtUsd(projectedYield(amount, o.apy, days))}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function projectedYield(amount: number, apy: number, days: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const periods = Math.max(1, days / 30);
  const monthlyRate = apy / 100 / 12;
  return amount * Math.pow(1 + monthlyRate, periods) - amount;
}

function Group({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/60 p-1">
      <span className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={
            "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors " +
            (value === o
              ? "bg-violet/20 text-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}
