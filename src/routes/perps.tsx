import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { compact, fmtUsd, pctClass, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/perps")({
  head: () => ({
    meta: [
      { title: "Perpetuals — Coming Soon | Vertex" },
      {
        name: "description",
        content:
          "Trade leveraged Solana perpetuals from the Vertex terminal. Cross-margin, deep liquidity, sub-second fills. Coming soon.",
      },
      { property: "og:title", content: "Vertex Perpetuals — Coming Soon" },
      {
        property: "og:description",
        content: "Leveraged Solana perpetuals from the Vertex terminal. Coming soon.",
      },
    ],
  }),
  component: Perps,
});

type Market = { sym: string; price: number; change: number };
const MARKETS: Market[] = [
  { sym: "SOL-PERP", price: 178.42, change: 2.31 },
  { sym: "BTC-PERP", price: 71240, change: -0.84 },
  { sym: "ETH-PERP", price: 3640, change: 1.12 },
  { sym: "JUP-PERP", price: 1.18, change: 4.55 },
  { sym: "JTO-PERP", price: 3.21, change: -1.65 },
  { sym: "WIF-PERP", price: 2.84, change: 6.12 },
  { sym: "BONK-PERP", price: 0.0000234, change: 8.4 },
] as const;

function Perps() {
  const [market, setMarket] = useState(MARKETS[0]);
  const [side, setSide] = useState<"long" | "short">("long");
  const [lev, setLev] = useState(10);
  const [size, setSize] = useState("100");

  const orderbook = useMemo(() => {
    const mid = market.price;
    const spread = mid * 0.0005;
    const bids = Array.from({ length: 12 }).map((_, i) => ({
      price: mid - spread - i * mid * 0.0008,
      size: Math.random() * 50 + 5,
    }));
    const asks = Array.from({ length: 12 }).map((_, i) => ({
      price: mid + spread + i * mid * 0.0008,
      size: Math.random() * 50 + 5,
    }));
    return { bids, asks, mid };
  }, [market]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        {/* Coming Soon banner */}
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm">
          <div>
            <span className="font-semibold">Perpetuals — Coming Soon.</span>{" "}
            <span className="text-muted-foreground">
              You're previewing the perps terminal UI. Order entry is disabled.
            </span>
          </div>
          <button className="rounded-md border border-violet/40 bg-violet/15 px-3 py-1 text-[12px] font-semibold text-violet">
            Join waitlist
          </button>
        </div>

        {/* Market selector */}
        <div className="mb-4 flex items-center gap-3 overflow-x-auto rounded-xl border border-border bg-surface/40 p-2">
          {MARKETS.map((m) => {
            const active = m.sym === market.sym;
            return (
              <button
                key={m.sym}
                onClick={() => setMarket(m)}
                className={
                  "shrink-0 rounded-lg px-3 py-2 text-left transition-colors " +
                  (active ? "bg-surface-2" : "hover:bg-surface-2/60")
                }
              >
                <div className="text-[11px] font-semibold">{m.sym}</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px]">{fmtUsd(m.price)}</span>
                  <span className={"font-mono text-[10px] " + pctClass(m.change)}>
                    {fmtPct(m.change)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px_320px]">
          {/* Chart placeholder */}
          <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="font-display text-lg font-semibold">{market.sym}</div>
                <div className="font-mono text-lg">{fmtUsd(market.price)}</div>
                <div className={"font-mono text-sm " + pctClass(market.change)}>
                  {fmtPct(market.change)}
                </div>
              </div>
              <div className="flex gap-1 text-[11px]">
                {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                  <button
                    key={tf}
                    className="rounded-md px-2 py-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <FakeCandles />
            </div>
          </div>

          {/* Orderbook */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Orderbook
            </div>
            <div className="grid grid-cols-2 gap-px bg-border text-[11px]">
              <div className="bg-surface/40 px-2 py-1 text-muted-foreground">Price</div>
              <div className="bg-surface/40 px-2 py-1 text-right text-muted-foreground">Size</div>
            </div>
            <div className="font-mono text-[11px]">
              {orderbook.asks.slice().reverse().map((r, i) => (
                <div key={"a" + i} className="relative grid grid-cols-2 px-2 py-[3px]">
                  <div
                    className="absolute inset-y-0 right-0 bg-bear/15"
                    style={{ width: Math.min(r.size * 1.5, 100) + "%" }}
                  />
                  <span className="relative text-bear">{fmtUsd(r.price)}</span>
                  <span className="relative text-right">{r.size.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-y border-border px-2 py-1.5 text-center text-foreground">
                {fmtUsd(orderbook.mid)}{" "}
                <span className="text-[10px] text-muted-foreground">mid</span>
              </div>
              {orderbook.bids.map((r, i) => (
                <div key={"b" + i} className="relative grid grid-cols-2 px-2 py-[3px]">
                  <div
                    className="absolute inset-y-0 right-0 bg-bull/15"
                    style={{ width: Math.min(r.size * 1.5, 100) + "%" }}
                  />
                  <span className="relative text-bull">{fmtUsd(r.price)}</span>
                  <span className="relative text-right">{r.size.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade panel */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="flex border-b border-border">
              {(["long", "short"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={
                    "flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors " +
                    (side === s
                      ? s === "long"
                        ? "bg-bull/15 text-bull"
                        : "bg-bear/15 text-bear"
                      : "text-muted-foreground hover:bg-surface")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-4 p-4">
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">Size (USD)</div>
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 font-mono outline-none"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Leverage</span>
                  <span className="font-mono text-foreground">{lev}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={lev}
                  onChange={(e) => setLev(parseInt(e.target.value, 10))}
                  className="w-full accent-violet"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>1x</span>
                  <span>10x</span>
                  <span>25x</span>
                  <span>50x</span>
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border border-border bg-surface-2/60 p-3 text-[11px]">
                <Row label="Entry" value={fmtUsd(market.price)} />
                <Row label="Liq. price" value={fmtUsd(market.price * (side === "long" ? 1 - 1 / lev : 1 + 1 / lev))} />
                <Row label="Notional" value={"$" + compact(parseFloat(size || "0") * lev)} />
                <Row label="Fee" value={"$" + (parseFloat(size || "0") * lev * 0.0006).toFixed(2)} />
              </div>
              <button
                disabled
                className={
                  "h-11 w-full cursor-not-allowed rounded-lg text-sm font-semibold opacity-60 " +
                  (side === "long" ? "bg-bull text-background" : "bg-bear text-background")
                }
              >
                {side === "long" ? "Open Long" : "Open Short"} — Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
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

function FakeCandles() {
  // Simple SVG candle silhouette
  const candles = useMemo(() => {
    let prev = 100;
    return Array.from({ length: 60 }).map((_, i) => {
      const change = (Math.random() - 0.48) * 8;
      const open = prev;
      const close = Math.max(20, prev + change);
      prev = close;
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;
      return { i, open, close, high, low };
    });
  }, []);
  const max = Math.max(...candles.map((c) => c.high));
  const min = Math.min(...candles.map((c) => c.low));
  const range = max - min;
  const w = 14;
  return (
    <svg viewBox={`0 0 ${candles.length * w} 200`} className="h-full w-full">
      {candles.map((c) => {
        const x = c.i * w + w / 2;
        const y = (v: number) => 200 - ((v - min) / range) * 180 - 10;
        const up = c.close >= c.open;
        return (
          <g key={c.i} stroke={up ? "oklch(0.78 0.2 145)" : "oklch(0.65 0.24 22)"}>
            <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} strokeWidth={1} />
            <rect
              x={x - 4}
              y={y(Math.max(c.open, c.close))}
              width={8}
              height={Math.max(1, Math.abs(y(c.open) - y(c.close)))}
              fill={up ? "oklch(0.78 0.2 145)" : "oklch(0.65 0.24 22)"}
            />
          </g>
        );
      })}
    </svg>
  );
}
