import React, { useState, useEffect, memo } from "react";
import { ShieldCheck, ShieldX, Eye, BarChart, Users, Lock, Percent, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { compact, fmtUsd, shortAddr } from "@/lib/format";

type RiskScore = {
  overall: number; // 0-100, higher = safer
  label: "SAFE" | "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "CRITICAL";
  checks: RiskCheck[];
};

type RiskCheck = {
  id: string;
  label: string;
  passed: boolean | "warn";
  detail: string;
  weight: number;
};

type HolderEntry = {
  rank: number;
  wallet: string;
  pct: number;
  isKnown: boolean;
  label?: string;
};

export const DeepRiskAnalyzer = memo(function DeepRiskAnalyzer({
  tokenSymbol = "TOKEN",
}: {
  tokenSymbol?: string;
}) {
  const [activeTab, setActiveTab] = useState<"risk" | "holders" | "liquidity">("risk");
  const [isExpanded, setIsExpanded] = useState(true);

  // Simulated deep analysis result
  const riskScore: RiskScore = {
    overall: 82,
    label: "LOW_RISK",
    checks: [
      { id: "mint", label: "Mint Authority Revoked", passed: true, detail: "No new tokens can be minted.", weight: 20 },
      { id: "freeze", label: "Freeze Authority Revoked", passed: true, detail: "Wallets cannot be frozen.", weight: 15 },
      { id: "lp_locked", label: "LP Fully Burned", passed: true, detail: "100% of LP tokens burned.", weight: 20 },
      { id: "top10", label: "Top 10 Concentration", passed: "warn", detail: "Top 10 wallets hold 23.4% of supply.", weight: 10 },
      { id: "honeypot", label: "Honeypot Check", passed: true, detail: "Sell function accessible.", weight: 25 },
      { id: "deployer", label: "Deployer Wallet Cleared", passed: true, detail: "Deployer holds 0 tokens.", weight: 10 },
    ],
  };

  const holders: HolderEntry[] = [
    { rank: 1, wallet: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", pct: 5.2, isKnown: true, label: "Raydium LP" },
    { rank: 2, wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", pct: 3.1, isKnown: false },
    { rank: 3, wallet: "4fYNw3dojWmQ4dXtSGE9epjRGy9GFyZH9yZ3s8ByX9t", pct: 2.8, isKnown: false },
    { rank: 4, wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWh", pct: 2.4, isKnown: false },
    { rank: 5, wallet: "11111111111111111111111111111111", pct: 1.9, isKnown: true, label: "Burn Address" },
    { rank: 6, wallet: "CuieVDEDtLo7FypjyQUsA6oWzRY1p4N7YNjU72pPxAuG", pct: 1.7, isKnown: false },
    { rank: 7, wallet: "GtE9aGjQ7DXKL5bCMhHgthM2TvmjWz1UzQ6b2ENMxPW", pct: 1.3, isKnown: false },
    { rank: 8, wallet: "DWUopNiizqbVbkTqkN4oNzFLZPMnFRRKjP7Xs2GtBHNm", pct: 1.1, isKnown: false },
    { rank: 9, wallet: "B62qrBRHsZm7upnvhQn2WE8xAULhJBR7hVSZeevYvfKQ", pct: 0.9, isKnown: false },
    { rank: 10, wallet: "A5jNzFpBqT3fwKqB2RrTq1UeJkDKVamNRQwQQN7zHVTe", pct: 0.7, isKnown: false },
  ];

  const top10Pct = holders.reduce((a, h) => a + h.pct, 0);

  const scoreColor =
    riskScore.overall >= 80
      ? "text-bull"
      : riskScore.overall >= 60
      ? "text-amber-400"
      : "text-bear";

  const scoreBg =
    riskScore.overall >= 80
      ? "bg-bull/10 border-bull/20"
      : riskScore.overall >= 60
      ? "bg-amber-400/10 border-amber-400/20"
      : "bg-bear/10 border-bear/20";

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-bull" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Deep Risk Analyzer
          </span>
        </div>
        <div className={`flex items-center gap-2 rounded-sm border px-2 py-1 ${scoreBg}`}>
          <span className={`font-mono text-lg font-black leading-none ${scoreColor}`}>
            {riskScore.overall}
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${scoreColor}`}>
            {riskScore.label.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-black">
        {(["risk", "holders", "liquidity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-none ${
              activeTab === tab
                ? "border-b-2 border-violet text-white"
                : "text-neutral-500 hover:text-white border-b-2 border-transparent"
            }`}
          >
            {tab === "risk" ? "Checks" : tab === "holders" ? "Top Holders" : "Liquidity"}
          </button>
        ))}
      </div>

      {/* Risk Checks */}
      {activeTab === "risk" && (
        <div className="p-3 space-y-1.5">
          {riskScore.checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-center gap-3 rounded-sm border px-3 py-2 ${
                check.passed === true
                  ? "border-bull/10 bg-bull/5"
                  : check.passed === "warn"
                  ? "border-amber-500/15 bg-amber-500/5"
                  : "border-bear/15 bg-bear/5"
              }`}
            >
              <div className="shrink-0">
                {check.passed === true ? (
                  <CheckCircle2 className="h-4 w-4 text-bull" />
                ) : check.passed === "warn" ? (
                  <MinusCircle className="h-4 w-4 text-amber-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-bear" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-white">{check.label}</div>
                <div className="text-[9px] text-neutral-500 mt-0.5">{check.detail}</div>
              </div>
              <div className="shrink-0 text-[9px] text-neutral-600 font-mono">
                +{check.weight}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Holders */}
      {activeTab === "holders" && (
        <div className="p-3">
          <div className="mb-2 flex justify-between text-[9px] uppercase tracking-widest text-neutral-600">
            <span>Top 10 combined: <span className="font-mono text-white">{top10Pct.toFixed(1)}%</span></span>
          </div>
          <div className="space-y-1">
            {holders.map((h) => (
              <div key={h.rank} className="flex items-center gap-2">
                <span className="w-5 text-right font-mono text-[9px] text-neutral-700">
                  #{h.rank}
                </span>
                <div className="flex-1 h-5 relative rounded-sm overflow-hidden bg-neutral-900">
                  <div
                    className="absolute left-0 top-0 h-full rounded-sm"
                    style={{
                      width: `${(h.pct / (Math.max(...holders.map((x) => x.pct)) || 1)) * 100}%`,
                      background: h.isKnown ? "rgba(139, 92, 246, 0.5)" : "rgba(16, 185, 129, 0.4)",
                    }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 font-mono text-[9px] text-white">
                    {h.label ?? shortAddr(h.wallet, 5)}
                    {h.isKnown && (
                      <span className="ml-1.5 text-violet text-[8px]">✓</span>
                    )}
                  </span>
                </div>
                <span className="w-10 text-right font-mono text-[9px] text-neutral-400">
                  {h.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liquidity Tab */}
      {activeTab === "liquidity" && (
        <div className="p-3 space-y-3">
          {[
            { label: "Total Liquidity", value: "$1.24M", status: "ok" },
            { label: "LP Burned", value: "100%", status: "ok" },
            { label: "Pool Age", value: "14d 3h", status: "ok" },
            { label: "Pool Count", value: "3 pools", status: "ok" },
            { label: "24h LP Delta", value: "+$12,400", status: "ok" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500">{item.label}</span>
              <span className="font-mono text-[11px] text-white font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
