import React, { useState, useEffect, useCallback, memo } from "react";
import { Bot, Play, Pause, Settings2, Zap, Target, Shield } from "lucide-react";

type SniperStrategy = {
  id: string;
  name: string;
  maxBuyUsd: number;
  minLiquidityUsd: number;
  minScore: number;
  antiHoneypot: boolean;
  maxTopHolderPct: number;
  jitoTipSol: number;
  slippagePct: number;
  enabled: boolean;
};

export const SniperBot = memo(function SniperBot({
  tokenSymbol = "TOKEN",
  currentPriceUsd = 0,
}: {
  tokenSymbol?: string;
  currentPriceUsd?: number;
}) {
  const [strategies, setStrategies] = useState<SniperStrategy[]>([
    {
      id: "default",
      name: "Conservative Snipe",
      maxBuyUsd: 100,
      minLiquidityUsd: 50000,
      minScore: 75,
      antiHoneypot: true,
      maxTopHolderPct: 20,
      jitoTipSol: 0.005,
      slippagePct: 2.0,
      enabled: false,
    },
    {
      id: "degen",
      name: "Degen Mode",
      maxBuyUsd: 500,
      minLiquidityUsd: 10000,
      minScore: 40,
      antiHoneypot: false,
      maxTopHolderPct: 40,
      jitoTipSol: 0.02,
      slippagePct: 10.0,
      enabled: false,
    },
  ]);
  const [activeStrategyId, setActiveStrategyId] = useState("default");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [botStatus, setBotStatus] = useState<"idle" | "scanning" | "executing">("idle");

  const activeStrategy = strategies.find((s) => s.id === activeStrategyId)!;

  const toggleBot = useCallback(() => {
    const strat = strategies.find((s) => s.id === activeStrategyId)!;
    const nextEnabled = !strat.enabled;

    setStrategies((prev) =>
      prev.map((s) =>
        s.id === activeStrategyId ? { ...s, enabled: nextEnabled } : s
      )
    );
    setBotStatus(nextEnabled ? "scanning" : "idle");

    if (nextEnabled) {
      setLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ✅ Bot activated: ${strat.name}`,
        `[${new Date().toLocaleTimeString()}] 🔎 Scanning mempool for ${tokenSymbol}...`,
        ...prev,
      ]);
    } else {
      setLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ⛔ Bot deactivated.`,
        ...prev,
      ]);
    }
  }, [strategies, activeStrategyId, tokenSymbol]);

  // Simulate scanner log entries
  useEffect(() => {
    if (botStatus !== "scanning") return;
    const interval = setInterval(() => {
      const events = [
        `[${new Date().toLocaleTimeString()}] ⚡ New pair detected. Checking safety...`,
        `[${new Date().toLocaleTimeString()}] 🔒 Liquidity locked check: PASS`,
        `[${new Date().toLocaleTimeString()}] 🛡 Honeypot simulation: PASS`,
        `[${new Date().toLocaleTimeString()}] 📊 Score: ${65 + Math.round(Math.random() * 30)}/100 — below threshold, skipping.`,
        `[${new Date().toLocaleTimeString()}] 🔎 Mempool scan continuing...`,
      ];
      setLog((prev) =>
        [events[Math.floor(Math.random() * events.length)], ...prev].slice(0, 30)
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [botStatus]);

  const updateStrategy = useCallback(
    (id: string, field: keyof SniperStrategy, value: any) => {
      setStrategies((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-violet" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Sniper Bot
          </span>
          <span
            className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
              botStatus === "scanning"
                ? "bg-bull/10 border-bull/20 text-bull"
                : botStatus === "executing"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                : "bg-neutral-900 border-neutral-700 text-neutral-500"
            }`}
          >
            {botStatus === "scanning" ? (
              <span className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull" />
                </span>
                SCANNING
              </span>
            ) : botStatus === "executing" ? (
              "EXECUTING"
            ) : (
              "OFFLINE"
            )}
          </span>
        </div>
        <button
          onClick={toggleBot}
          className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-none ${
            activeStrategy?.enabled
              ? "bg-bear/10 border-bear/20 text-bear hover:bg-bear/20"
              : "bg-bull/10 border-bull/20 text-bull hover:bg-bull/20"
          }`}
        >
          {activeStrategy?.enabled ? (
            <>
              <Pause className="h-3 w-3" /> Stop
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> Start
            </>
          )}
        </button>
      </div>

      {/* Strategy Selector */}
      <div className="border-b border-neutral-800 px-4 py-3">
        <div className="text-[9px] uppercase tracking-widest text-neutral-600 mb-2">
          Strategy
        </div>
        <div className="flex gap-2">
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStrategyId(s.id)}
              className={`flex-1 rounded-sm border py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-none ${
                activeStrategyId === s.id
                  ? "border-violet/40 bg-violet/10 text-violet"
                  : "border-neutral-800 bg-[#0a0a0a] text-neutral-500 hover:text-white"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Config */}
      {activeStrategy && (
        <div className="border-b border-neutral-800 p-4">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600 mb-3 flex items-center gap-1">
            <Settings2 className="h-2.5 w-2.5" /> Parameters
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">Max Buy (USD)</label>
              <input
                type="number"
                value={activeStrategy.maxBuyUsd}
                onChange={(e) => updateStrategy(activeStrategy.id, "maxBuyUsd", parseFloat(e.target.value))}
                className="mt-1 w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-violet/50"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">Min Liquidity</label>
              <input
                type="number"
                value={activeStrategy.minLiquidityUsd}
                onChange={(e) => updateStrategy(activeStrategy.id, "minLiquidityUsd", parseFloat(e.target.value))}
                className="mt-1 w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-violet/50"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">Min Safety Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={activeStrategy.minScore}
                onChange={(e) => updateStrategy(activeStrategy.id, "minScore", parseFloat(e.target.value))}
                className="mt-1 w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-violet/50"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">Jito Tip (SOL)</label>
              <input
                type="number"
                step="0.001"
                value={activeStrategy.jitoTipSol}
                onChange={(e) => updateStrategy(activeStrategy.id, "jitoTipSol", parseFloat(e.target.value))}
                className="mt-1 w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-violet/50"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">Slippage %</label>
              <input
                type="number"
                step="0.5"
                value={activeStrategy.slippagePct}
                onChange={(e) => updateStrategy(activeStrategy.id, "slippagePct", parseFloat(e.target.value))}
                className="mt-1 w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-violet/50"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600 mb-1">Anti-Honeypot</label>
              <button
                onClick={() => updateStrategy(activeStrategy.id, "antiHoneypot", !activeStrategy.antiHoneypot)}
                className={`mt-1 flex items-center gap-1.5 rounded-sm border px-2 py-1.5 text-[10px] font-bold uppercase transition-none ${
                  activeStrategy.antiHoneypot
                    ? "border-bull/30 bg-bull/10 text-bull"
                    : "border-neutral-800 bg-neutral-900 text-neutral-500"
                }`}
              >
                <Shield className="h-3 w-3" />
                {activeStrategy.antiHoneypot ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bot Log */}
      <div className="p-3">
        <div className="text-[9px] uppercase tracking-widest text-neutral-600 mb-2">Bot Log</div>
        <div className="h-[120px] overflow-y-auto rounded-sm border border-neutral-900 bg-[#050505] p-2 space-y-0.5 font-mono">
          {log.length === 0 ? (
            <div className="text-[9px] text-neutral-700 italic">Start the bot to begin scanning...</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="text-[9px] text-neutral-400 leading-relaxed">
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
