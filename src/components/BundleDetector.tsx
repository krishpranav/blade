import React, { useState, useEffect, memo } from "react";
import { AlertOctagon, Copy, ExternalLink, Clock, Flame, RotateCcw } from "lucide-react";
import { compact, fmtUsd, shortAddr } from "@/lib/format";

type BundleEntry = {
  bundleIdx: number;
  wallets: string[];
  tokensBought: number;
  pctOfSupply: number;
  amountSol: number;
  firstTxTime: number;
  currentHeld: number;
  status: "holding" | "partial_sold" | "dumped";
};

export const BundleDetector = memo(function BundleDetector({
  tokenSymbol = "TOKEN",
}: {
  tokenSymbol?: string;
}) {
  const [bundles, setBundles] = useState<BundleEntry[]>([]);
  const [isBundled, setIsBundled] = useState(false);
  const [totalBundledPct, setTotalBundledPct] = useState(0);

  useEffect(() => {
    // Simulate bundle analysis result (in a real integration, this calls a rug-check or custom indexer API)
    const detected: BundleEntry[] = [
      {
        bundleIdx: 1,
        wallets: [
          "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
          "4fYNw3dojWmQ4dXtSGE9epjRGy9GFyZH9yZ3s8ByX9t",
          "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWh",
        ],
        tokensBought: 12_000_000,
        pctOfSupply: 1.2,
        amountSol: 4.8,
        firstTxTime: Date.now() - 86_400_000 * 3,
        currentHeld: 10_800_000,
        status: "holding",
      },
      {
        bundleIdx: 2,
        wallets: [
          "CuieVDEDtLo7FypjyQUsA6oWzRY1p4N7YNjU72pPxAuG",
          "GtE9aGjQ7DXKL5bCMhHgthM2TvmjWz1UzQ6b2ENMxPW",
        ],
        tokensBought: 8_000_000,
        pctOfSupply: 0.8,
        amountSol: 3.2,
        firstTxTime: Date.now() - 86_400_000 * 3 + 2000,
        currentHeld: 2_000_000,
        status: "partial_sold",
      },
    ];
    setBundles(detected);
    const pct = detected.reduce((a, b) => a + b.pctOfSupply, 0);
    setTotalBundledPct(pct);
    setIsBundled(pct > 1.0);
  }, [tokenSymbol]);

  const statusColor: Record<BundleEntry["status"], string> = {
    holding: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    partial_sold: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    dumped: "text-bear bg-bear/10 border-bear/20",
  };

  const statusLabel: Record<BundleEntry["status"], string> = {
    holding: "HOLDING",
    partial_sold: "SELLING",
    dumped: "DUMPED",
  };

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className={`h-3.5 w-3.5 ${isBundled ? "text-amber-400" : "text-bull"}`} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Bundle Detector
          </span>
        </div>
        <div className={`rounded-sm border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
          isBundled
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-bull/10 border-bull/20 text-bull"
        }`}>
          {isBundled
            ? `⚠ ${totalBundledPct.toFixed(1)}% BUNDLED`
            : "CLEAN LAUNCH"}
        </div>
      </div>

      {bundles.length === 0 ? (
        <div className="py-8 text-center text-[10px] uppercase tracking-widest text-neutral-700">
          No bundles detected at launch
        </div>
      ) : (
        <div className="divide-y divide-neutral-900 p-3 space-y-2">
          {bundles.map((bundle) => (
            <div
              key={bundle.bundleIdx}
              className="rounded-sm border border-neutral-800 bg-black p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Bundle #{bundle.bundleIdx}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-600">
                    {bundle.wallets.length} wallets
                  </span>
                </div>
                <span className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColor[bundle.status]}`}>
                  {statusLabel[bundle.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-neutral-700">Supply %</div>
                  <div className="font-mono text-[11px] font-bold text-amber-400">{bundle.pctOfSupply.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-neutral-700">Cost (SOL)</div>
                  <div className="font-mono text-[11px] font-semibold text-white">{bundle.amountSol.toFixed(1)} SOL</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-neutral-700">Still Held</div>
                  <div className="font-mono text-[11px] font-semibold text-white">
                    {((bundle.currentHeld / bundle.tokensBought) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Held bar */}
              <div className="h-1 rounded-sm overflow-hidden bg-neutral-900 mb-3">
                <div
                  className={`h-full transition-none ${bundle.status === "dumped" ? "bg-bear" : "bg-amber-500"}`}
                  style={{ width: `${(bundle.currentHeld / bundle.tokensBought) * 100}%` }}
                />
              </div>

              {/* Wallets */}
              <div className="space-y-1">
                {bundle.wallets.map((w) => (
                  <div key={w} className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-neutral-600">{shortAddr(w, 6)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(w)}
                      className="text-neutral-800 hover:text-neutral-400"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-neutral-900 px-4 py-2 text-[9px] uppercase tracking-widest text-neutral-700">
        Analyzed launch block transactions • Simulated data
      </div>
    </div>
  );
});
