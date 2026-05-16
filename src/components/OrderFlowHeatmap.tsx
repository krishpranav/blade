import React, { useState, useEffect, useRef, memo } from "react";
import { BarChart2, Activity, Zap } from "lucide-react";
import { compact, fmtUsd } from "@/lib/format";

type BubbleData = {
  id: string;
  wallet: string;
  size: number; // USD
  type: "buy" | "sell";
  x: number;
  y: number;
  r: number; // radius
  opacity: number;
  age: number;
};

type HeatZone = {
  priceMin: number;
  priceMax: number;
  intensity: number; // 0-1
};

export const OrderFlowHeatmap = memo(function OrderFlowHeatmap({
  currentPriceUsd = 0.005,
}: {
  currentPriceUsd?: number;
}) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [heatZones, setHeatZones] = useState<HeatZone[]>([]);
  const [totalBuyFlow, setTotalBuyFlow] = useState(0);
  const [totalSellFlow, setTotalSellFlow] = useState(0);
  const [deltaFlow, setDeltaFlow] = useState(0);
  const animRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate mock heat zones around current price
  useEffect(() => {
    const zones: HeatZone[] = [];
    for (let i = 0; i < 10; i++) {
      const spread = currentPriceUsd * 0.3;
      const min = currentPriceUsd - spread + (i * spread * 2) / 10;
      const max = min + spread / 5;
      const intensity =
        i === 4 || i === 5 ? 0.9 : Math.random() * 0.7 + 0.1;
      zones.push({ priceMin: min, priceMax: max, intensity });
    }
    setHeatZones(zones);
  }, [currentPriceUsd]);

  // Simulate order flow bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.42;
      const size = Math.random() > 0.9
        ? 50000 + Math.random() * 100000 // whale
        : 500 + Math.random() * 8000;
      const r = Math.min(Math.max(Math.sqrt(size / 100), 6), 40);

      const newBubble: BubbleData = {
        id: Math.random().toString(36).substring(7),
        wallet: "mock",
        size,
        type: isBuy ? "buy" : "sell",
        x: 20 + Math.random() * 60, // percentage
        y: 20 + Math.random() * 60,
        r,
        opacity: 1,
        age: 0,
      };

      setBubbles((prev) => {
        const updated = prev
          .map((b) => ({ ...b, age: b.age + 1, opacity: Math.max(0, 1 - b.age / 12) }))
          .filter((b) => b.opacity > 0.05);
        return [...updated, newBubble].slice(-40);
      });

      if (isBuy) {
        setTotalBuyFlow((v) => v + size);
        setDeltaFlow((v) => v + size);
      } else {
        setTotalSellFlow((v) => v + size);
        setDeltaFlow((v) => v - size);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const totalFlow = totalBuyFlow + totalSellFlow;
  const buyDominance = totalFlow > 0 ? (totalBuyFlow / totalFlow) * 100 : 50;

  return (
    <div className="rounded-sm border border-neutral-800 bg-black shadow-none">
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-violet" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Order Flow Heatmap
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="text-bull">+{compact(totalBuyFlow)}</span>
          <span className="text-neutral-700">/</span>
          <span className="text-bear">-{compact(totalSellFlow)}</span>
          <span className={`font-bold ${deltaFlow >= 0 ? "text-bull" : "text-bear"}`}>
            Δ{deltaFlow >= 0 ? "+" : ""}{compact(deltaFlow)}
          </span>
        </div>
      </div>

      {/* Bubble visualizer */}
      <div className="relative h-[220px] overflow-hidden bg-[#050505]">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Buy / Sell zone labels */}
        <div className="absolute left-2 top-2 text-[9px] uppercase tracking-widest text-neutral-700">
          Bid Zone
        </div>
        <div className="absolute right-2 top-2 text-[9px] uppercase tracking-widest text-neutral-700">
          Ask Zone
        </div>

        {/* Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-white pointer-events-none select-none"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.r * 2,
              height: b.r * 2,
              transform: "translate(-50%, -50%)",
              background: b.type === "buy"
                ? `rgba(16, 185, 129, ${b.opacity * 0.6})`
                : `rgba(239, 68, 68, ${b.opacity * 0.6})`,
              border: `1px solid ${b.type === "buy" ? `rgba(16,185,129,${b.opacity})` : `rgba(239,68,68,${b.opacity})`}`,
              opacity: b.opacity,
              transition: "opacity 0.3s",
            }}
          >
            {b.r > 16 && `$${compact(b.size)}`}
          </div>
        ))}
      </div>

      {/* Heat zones */}
      <div className="border-t border-neutral-800 px-4 py-3">
        <div className="text-[9px] uppercase tracking-widest text-neutral-600 mb-2">
          Liquidity Heat Map
        </div>
        <div className="flex gap-1 items-end h-10">
          {heatZones.map((zone, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${zone.intensity * 100}%`,
                background:
                  zone.intensity > 0.7
                    ? "rgba(16, 185, 129, 0.8)"
                    : zone.intensity > 0.4
                    ? "rgba(139, 92, 246, 0.6)"
                    : "rgba(100, 100, 100, 0.3)",
              }}
              title={`$${fmtUsd(zone.priceMin)} – $${fmtUsd(zone.priceMax)}`}
            />
          ))}
        </div>
      </div>

      {/* Buy Dominance Bar */}
      <div className="border-t border-neutral-800 px-4 py-2.5">
        <div className="flex justify-between text-[9px] uppercase tracking-widest text-neutral-600 mb-1">
          <span className="text-bull">Buy {buyDominance.toFixed(1)}%</span>
          <span className="text-neutral-500">Dominance</span>
          <span className="text-bear">Sell {(100 - buyDominance).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-sm overflow-hidden bg-bear/30">
          <div
            className="h-full bg-bull transition-none"
            style={{ width: `${buyDominance}%` }}
          />
        </div>
      </div>
    </div>
  );
});
