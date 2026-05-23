import React, { useMemo, useEffect, useState, memo } from "react";

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

export const NativeChart = memo(function NativeChart({ width = 800, height = 400 }: { width?: number, height?: number }) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");

  // Generate realistic mock OHLC data
  useEffect(() => {
    let currentPrice = 0.005;
    const data: Candle[] = [];
    const now = Date.now();
    const intervalMs = TF_MS[timeframe];
    
    for (let i = 100; i >= 0; i--) {
      const volatility = currentPrice * 0.05;
      const open = currentPrice;
      const close = open + (Math.random() - 0.48) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = 10000 + Math.random() * 90000;
      
      data.push({
        time: now - i * intervalMs,
        open, high, low, close, volume
      });
      currentPrice = close;
    }
    setCandles(data);

    // Live tick simulation
    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const newClose = last.close + (Math.random() - 0.5) * last.close * 0.01;
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);
        
        const updatedLast = { ...last, close: newClose, high: newHigh, low: newLow };
        return [...prev.slice(0, prev.length - 1), updatedLast];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [timeframe]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 1 };
    let min = Infinity, max = -Infinity;
    candles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    // Add 10% padding
    const padding = (max - min) * 0.1;
    return { minPrice: min - padding, maxPrice: max + padding };
  }, [candles]);

  const maxVolume = useMemo(() => candles.reduce((m, c) => Math.max(m, c.volume), 0), [candles]);

  if (candles.length === 0) return <div className="h-full w-full bg-black flex items-center justify-center text-neutral-500 font-mono text-xs">LOADING CHART...</div>;

  const candleWidth = width / Math.max(candles.length, 50);
  // Reserve bottom 20% for volume
  const chartHeight = height * 0.78;
  const volHeight = height * 0.18;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  return (
    <div className="relative h-full w-full bg-[#050505] overflow-hidden group">
      <div className="absolute top-2 left-3 z-10 flex gap-1.5">
        {(["1m", "5m", "15m", "1h", "4h"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase transition-none ${
              timeframe === tf
                ? "bg-violet/20 border-violet/40 text-violet"
                : "border-neutral-800 bg-black text-neutral-600 hover:text-white"
            }`}
          >
            {tf}
          </button>
        ))}
        <div className="ml-2 rounded-sm border border-neutral-800 bg-black px-2 py-0.5 text-[9px] font-mono text-neutral-700">BLADE ENGINE</div>
      </div>
      
      {/* Grid Lines */}
      <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0 z-0">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Candlesticks + Volume Bars */}
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 z-10">
        {/* Separator */}
        <line x1={0} y1={chartHeight + 4} x2={width} y2={chartHeight + 4} stroke="#222" strokeWidth="1" />
        {candles.map((candle, i) => {
          const isBull = candle.close >= candle.open;
          const color = isBull ? "#10b981" : "#ef4444";
          const x = i * candleWidth;
          const yOpen = getY(candle.open);
          const yClose = getY(candle.close);
          const yHigh = getY(candle.high);
          const yLow = getY(candle.low);
          const rectY = Math.min(yOpen, yClose);
          const rectH = Math.max(Math.abs(yOpen - yClose), 1);
          // Volume bar
          const volBarH = maxVolume > 0 ? (candle.volume / maxVolume) * volHeight : 0;
          const volY = height - volBarH;
          return (
            <g key={candle.time}>
              <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={color} strokeWidth="1" />
              <rect x={x + 1} y={rectY} width={candleWidth - 2} height={rectH} fill={color} />
              {/* Volume */}
              <rect x={x + 1} y={volY} width={candleWidth - 2} height={volBarH} fill={isBull ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"} />
            </g>
          );
        })}
      </svg>
      
      {/* Price Axis Overlay (Mock) */}
      <div className="absolute right-0 top-0 bottom-0 w-16 border-l border-neutral-800 bg-black/80 z-20 flex flex-col justify-between py-4 text-[9px] font-mono text-neutral-500">
        <div className="text-right pr-2">{maxPrice.toFixed(5)}</div>
        <div className="text-right pr-2">{((maxPrice + minPrice) / 2).toFixed(5)}</div>
        <div className="text-right pr-2">{minPrice.toFixed(5)}</div>
      </div>
    </div>
  );
});
