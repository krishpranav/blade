import { memo, useEffect, useMemo, useState } from "react";
import { compact, fmtUsd, pctClass } from "@/lib/format";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h";

const TF_MS: Record<Timeframe, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
};

function hashSeed(value: string): number {
  return value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function seeded(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function makeCandles(symbol: string, basePrice: number, timeframe: Timeframe): Candle[] {
  const rand = seeded(hashSeed(symbol + timeframe));
  const now = Date.now();
  const intervalMs = TF_MS[timeframe];
  const count = 96;
  const data: Candle[] = [];
  let close = Math.max(basePrice, 0.00000001) * (0.94 + rand() * 0.1);

  for (let i = count - 1; i >= 0; i--) {
    const trend = Math.sin((count - i) / 9) * 0.004;
    const shock = (rand() - 0.48) * 0.028;
    const open = close;
    close = Math.max(open * (1 + trend + shock), basePrice * 0.55);
    const wick = open * (0.006 + rand() * 0.022);
    const high = Math.max(open, close) + wick;
    const low = Math.max(0, Math.min(open, close) - wick * (0.55 + rand()));
    const volume = 12_000 + rand() * 95_000 + Math.abs(close - open) * 1_000_000;
    data.push({ time: now - i * intervalMs, open, high, low, close, volume });
  }

  const last = data[data.length - 1];
  const adjustment = basePrice / last.close;
  return data.map((candle) => ({
    ...candle,
    open: candle.open * adjustment,
    high: candle.high * adjustment,
    low: candle.low * adjustment,
    close: candle.close * adjustment,
  }));
}

export const NativeChart = memo(function NativeChart({
  symbol = "TOKEN",
  currentPriceUsd = 0.005,
  changePct,
}: {
  symbol?: string;
  currentPriceUsd?: number;
  changePct?: number | null;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [candles, setCandles] = useState<Candle[]>(() =>
    makeCandles(symbol, currentPriceUsd, "5m"),
  );

  useEffect(() => {
    setCandles(makeCandles(symbol, currentPriceUsd, timeframe));
  }, [currentPriceUsd, symbol, timeframe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const nextClose = last.close + (currentPriceUsd - last.close) * 0.35;
        const updated = {
          ...last,
          close: nextClose,
          high: Math.max(last.high, nextClose),
          low: Math.min(last.low, nextClose),
          volume: last.volume * 0.96 + 2_500,
        };
        return [...prev.slice(0, -1), updated];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [currentPriceUsd]);

  const frame = useMemo(() => {
    const min = Math.min(...candles.map((c) => c.low));
    const max = Math.max(...candles.map((c) => c.high));
    const range = max - min || max || 1;
    const pad = range * 0.12;
    const maxVolume = Math.max(...candles.map((c) => c.volume), 1);
    const first = candles[0]?.open ?? currentPriceUsd;
    const last = candles[candles.length - 1]?.close ?? currentPriceUsd;
    return {
      min: Math.max(0, min - pad),
      max: max + pad,
      maxVolume,
      first,
      last,
      movePct: first > 0 ? ((last / first) - 1) * 100 : 0,
    };
  }, [candles, currentPriceUsd]);

  const width = 960;
  const height = 420;
  const rightAxis = 72;
  const topPad = 36;
  const chartHeight = 292;
  const volumeTop = 336;
  const volumeHeight = 62;
  const plotWidth = width - rightAxis - 12;
  const priceRange = frame.max - frame.min || 1;
  const candleSlot = plotWidth / candles.length;
  const candleBody = Math.max(3, Math.min(8, candleSlot * 0.58));
  const y = (price: number) => topPad + (1 - (price - frame.min) / priceRange) * chartHeight;
  const lastY = y(frame.last);
  const axisValues = [frame.max, frame.max - priceRange * 0.25, frame.max - priceRange * 0.5, frame.max - priceRange * 0.75, frame.min];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050505]">
      <div className="absolute left-3 top-2 z-20 flex items-center gap-1.5">
        {(["1m", "5m", "15m", "1h", "4h"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase transition-none ${
              timeframe === tf
                ? "border-violet/50 bg-violet/20 text-violet"
                : "border-neutral-800 bg-black text-neutral-500 hover:text-white"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="absolute right-3 top-2 z-20 text-right">
        <div className="font-mono text-[12px] font-semibold text-white">{fmtUsd(frame.last)}</div>
        <div className={`font-mono text-[10px] ${pctClass(changePct ?? frame.movePct)}`}>
          {(changePct ?? frame.movePct) >= 0 ? "+" : ""}
          {(changePct ?? frame.movePct).toFixed(2)}%
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
        <rect x={0} y={0} width={width} height={height} fill="#050505" />

        {axisValues.map((value) => (
          <g key={value}>
            <line x1={0} x2={plotWidth} y1={y(value)} y2={y(value)} stroke="#151515" strokeWidth={1} />
            <text x={width - 10} y={y(value) + 3} textAnchor="end" fill="#737373" fontSize={10} fontFamily="monospace">
              {fmtUsd(value)}
            </text>
          </g>
        ))}

        {Array.from({ length: 13 }).map((_, i) => {
          const x = (plotWidth / 12) * i;
          return <line key={i} x1={x} x2={x} y1={topPad} y2={volumeTop + volumeHeight} stroke="#111" strokeWidth={1} />;
        })}

        <line x1={0} x2={plotWidth} y1={volumeTop - 12} y2={volumeTop - 12} stroke="#242424" strokeWidth={1} />

        {candles.map((candle, index) => {
          const isBull = candle.close >= candle.open;
          const color = isBull ? "#16c784" : "#ea3943";
          const x = index * candleSlot + candleSlot / 2;
          const openY = y(candle.open);
          const closeY = y(candle.close);
          const highY = y(candle.high);
          const lowY = y(candle.low);
          const bodyY = Math.min(openY, closeY);
          const bodyH = Math.max(2, Math.abs(openY - closeY));
          const volH = (candle.volume / frame.maxVolume) * volumeHeight;
          return (
            <g key={candle.time}>
              <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth={1.2} />
              <rect x={x - candleBody / 2} y={bodyY} width={candleBody} height={bodyH} rx={0.5} fill={color} />
              <rect
                x={x - candleBody / 2}
                y={volumeTop + volumeHeight - volH}
                width={candleBody}
                height={volH}
                fill={isBull ? "rgba(22,199,132,0.38)" : "rgba(234,57,67,0.32)"}
              />
            </g>
          );
        })}

        <line x1={0} x2={plotWidth} y1={lastY} y2={lastY} stroke="#f2d10a" strokeDasharray="4 4" strokeWidth={1} opacity={0.7} />
        <rect x={plotWidth + 4} y={lastY - 9} width={rightAxis - 10} height={18} rx={2} fill="#f2d10a" />
        <text x={width - 9} y={lastY + 4} textAnchor="end" fill="#111" fontSize={10} fontWeight={700} fontFamily="monospace">
          {fmtUsd(frame.last)}
        </text>
      </svg>

      <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[10px] uppercase tracking-wider text-neutral-600">
        <span>{symbol}</span>
        <span>Vol {compact(candles[candles.length - 1]?.volume ?? 0)}</span>
        <span>Native OHLC</span>
      </div>
    </div>
  );
});
