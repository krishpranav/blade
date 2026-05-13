import React, { useMemo, useEffect, useState, memo } from "react";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export const NativeChart = memo(function NativeChart({ width = 800, height = 400 }: { width?: number, height?: number }) {
  const [candles, setCandles] = useState<Candle[]>([]);

  // Generate realistic mock OHLC data
  useEffect(() => {
    let currentPrice = 0.005;
    const data: Candle[] = [];
    const now = Date.now();
    
    for (let i = 100; i >= 0; i--) {
      const volatility = currentPrice * 0.05;
      const open = currentPrice;
      const close = open + (Math.random() - 0.48) * volatility; // slight upward drift
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      data.push({
        time: now - i * 60000 * 5, // 5 min candles
        open, high, low, close
      });
      currentPrice = close;
    }
    setCandles(data);

    // Live tick simulation
    const interval = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1];
        const newClose = last.close + (Math.random() - 0.5) * last.close * 0.01;
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);
        
        const updatedLast = { ...last, close: newClose, high: newHigh, low: newLow };
        return [...prev.slice(0, prev.length - 1), updatedLast];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

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

  if (candles.length === 0) return <div className="h-full w-full bg-black flex items-center justify-center text-neutral-500 font-mono text-xs">LOADING CHART...</div>;

  const candleWidth = width / Math.max(candles.length, 50);
  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => height - ((price - minPrice) / priceRange) * height;

  return (
    <div className="relative h-full w-full bg-[#050505] overflow-hidden group">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="rounded-sm border border-neutral-800 bg-black px-2 py-1 text-[10px] font-mono text-white">5M</div>
        <div className="rounded-sm border border-neutral-800 bg-black px-2 py-1 text-[10px] font-mono text-neutral-500">NATIVE ENGINE V1</div>
      </div>
      
      {/* Grid Lines */}
      <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0 z-0">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Candlesticks */}
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 z-10">
        {candles.map((candle, i) => {
          const isBull = candle.close >= candle.open;
          const color = isBull ? "#10b981" : "#ef4444"; // strict hex for performance
          const x = i * candleWidth;
          const yOpen = getY(candle.open);
          const yClose = getY(candle.close);
          const yHigh = getY(candle.high);
          const yLow = getY(candle.low);
          
          const rectY = Math.min(yOpen, yClose);
          const rectHeight = Math.max(Math.abs(yOpen - yClose), 1); // min 1px height
          
          return (
            <g key={candle.time}>
              {/* Wick */}
              <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={color} strokeWidth="1" />
              {/* Body */}
              <rect x={x + 1} y={rectY} width={candleWidth - 2} height={rectHeight} fill={color} />
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
