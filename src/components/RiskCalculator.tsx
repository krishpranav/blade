import React, { useState, useCallback, memo } from "react";
import { Calculator, DollarSign, Percent, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { fmtUsd } from "@/lib/format";

type CalcResult = {
  positionSizeUsd: number;
  tokenAmount: number;
  riskAmountUsd: number;
  targetPnlUsd: number;
  riskRewardRatio: number;
  stopLossPrice: number;
  takeProfitPrice: number;
};

export const RiskCalculator = memo(function RiskCalculator({
  currentPriceUsd = 0,
}: {
  currentPriceUsd?: number;
}) {
  const [portfolioUsd, setPortfolioUsd] = useState("10000");
  const [riskPct, setRiskPct] = useState("2");
  const [stopLossPct, setStopLossPct] = useState("15");
  const [takeProfitPct, setTakeProfitPct] = useState("45");
  const [entryPrice, setEntryPrice] = useState(currentPriceUsd > 0 ? currentPriceUsd.toFixed(8) : "0.005");
  const [isExpanded, setIsExpanded] = useState(true);

  React.useEffect(() => {
    if (currentPriceUsd > 0) {
      setEntryPrice(currentPriceUsd.toFixed(8));
    }
  }, [currentPriceUsd]);

  const result: CalcResult | null = (() => {
    const port = parseFloat(portfolioUsd);
    const rPct = parseFloat(riskPct) / 100;
    const slPct = parseFloat(stopLossPct) / 100;
    const tpPct = parseFloat(takeProfitPct) / 100;
    const entry = parseFloat(entryPrice);

    if (!port || !rPct || !slPct || !tpPct || !entry) return null;

    const riskAmountUsd = port * rPct;
    const positionSizeUsd = riskAmountUsd / slPct;
    const tokenAmount = positionSizeUsd / entry;
    const targetPnlUsd = positionSizeUsd * tpPct;
    const riskRewardRatio = tpPct / slPct;
    const stopLossPrice = entry * (1 - slPct);
    const takeProfitPrice = entry * (1 + tpPct);

    return {
      positionSizeUsd,
      tokenAmount,
      riskAmountUsd,
      targetPnlUsd,
      riskRewardRatio,
      stopLossPrice,
      takeProfitPrice,
    };
  })();

  const rrClass =
    result
      ? result.riskRewardRatio >= 3
        ? "text-bull"
        : result.riskRewardRatio >= 1.5
        ? "text-amber-400"
        : "text-bear"
      : "text-neutral-500";

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 hover:bg-[#0f0f0f] transition-none"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-3.5 w-3.5 text-violet" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Risk Calculator
          </span>
        </div>
        {result && (
          <span className={`font-mono text-[11px] font-bold ${rrClass}`}>
            R:R {result.riskRewardRatio.toFixed(2)}x
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                Portfolio (USD)
              </label>
              <div className="mt-1 flex items-center rounded-sm border border-neutral-800 bg-black focus-within:border-violet/50">
                <DollarSign className="ml-2 h-3 w-3 shrink-0 text-neutral-700" />
                <input
                  type="number"
                  value={portfolioUsd}
                  onChange={(e) => setPortfolioUsd(e.target.value)}
                  className="w-full bg-transparent px-2 py-1.5 font-mono text-[11px] text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                Risk Per Trade %
              </label>
              <div className="mt-1 flex items-center rounded-sm border border-neutral-800 bg-black focus-within:border-violet/50">
                <Percent className="ml-2 h-3 w-3 shrink-0 text-neutral-700" />
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="20"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                  className="w-full bg-transparent px-2 py-1.5 font-mono text-[11px] text-white outline-none"
                />
              </div>
              <div className="mt-1 flex gap-1">
                {["0.5", "1", "2", "5"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setRiskPct(v)}
                    className={`flex-1 rounded-sm border py-0.5 text-[8px] font-bold transition-none ${riskPct === v ? "border-violet/40 bg-violet/10 text-violet" : "border-neutral-800 text-neutral-700 hover:text-white"}`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                Stop Loss %
              </label>
              <div className="mt-1 flex items-center rounded-sm border border-neutral-800 bg-black focus-within:border-bear/50">
                <TrendingDown className="ml-2 h-3 w-3 shrink-0 text-bear/60" />
                <input
                  type="number"
                  step="1"
                  value={stopLossPct}
                  onChange={(e) => setStopLossPct(e.target.value)}
                  className="w-full bg-transparent px-2 py-1.5 font-mono text-[11px] text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                Take Profit %
              </label>
              <div className="mt-1 flex items-center rounded-sm border border-neutral-800 bg-black focus-within:border-bull/50">
                <TrendingUp className="ml-2 h-3 w-3 shrink-0 text-bull/60" />
                <input
                  type="number"
                  step="5"
                  value={takeProfitPct}
                  onChange={(e) => setTakeProfitPct(e.target.value)}
                  className="w-full bg-transparent px-2 py-1.5 font-mono text-[11px] text-white outline-none"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                Entry Price (USD)
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="mt-1 w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-violet/50"
              />
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-2 border-t border-neutral-900 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Position Size", value: fmtUsd(result.positionSizeUsd), color: "text-white" },
                  { label: "Max Risk", value: fmtUsd(result.riskAmountUsd), color: "text-bear" },
                  { label: "Target Profit", value: "+" + fmtUsd(result.targetPnlUsd), color: "text-bull" },
                  { label: "Risk : Reward", value: `1 : ${result.riskRewardRatio.toFixed(2)}`, color: rrClass },
                  { label: "Stop Loss Price", value: fmtUsd(result.stopLossPrice), color: "text-bear" },
                  { label: "Take Profit Price", value: fmtUsd(result.takeProfitPrice), color: "text-bull" },
                ].map((row) => (
                  <div key={row.label} className="rounded-sm border border-neutral-900 bg-black px-3 py-2">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-600">{row.label}</div>
                    <div className={`mt-0.5 font-mono text-[12px] font-semibold ${row.color}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk verdict */}
              <div className={`rounded-sm border p-2.5 ${
                result.riskRewardRatio >= 3
                  ? "border-bull/20 bg-bull/5"
                  : result.riskRewardRatio >= 1.5
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-bear/20 bg-bear/5"
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`h-3.5 w-3.5 ${rrClass}`} />
                  <span className={`text-[10px] font-bold ${rrClass}`}>
                    {result.riskRewardRatio >= 3
                      ? "Excellent setup. Strong edge."
                      : result.riskRewardRatio >= 1.5
                      ? "Acceptable risk/reward. Proceed with discipline."
                      : "Poor R:R. Widen TP or tighten SL."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
