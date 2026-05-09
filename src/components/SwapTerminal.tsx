import React, { useState } from "react";
import { ArrowDownUp, Settings, Zap, CheckCircle2, Loader2, ShieldCheck, Flame } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fmtUsd } from "@/lib/format";

export function SwapTerminal({ defaultInput = "SOL", defaultOutput = "BONK" }) {
  const [inputMint, setInputMint] = useState(defaultInput);
  const [outputMint, setOutputMint] = useState(defaultOutput);
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(1.0);
  const [priorityFee, setPriorityFee] = useState<number>(0.001);
  const [jitoTip, setJitoTip] = useState<number>(0.005);
  const [antiMev, setAntiMev] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"snipe" | "limit" | "dca">("snipe");
  const [limitPrice, setLimitPrice] = useState<string>("");

  // Fetch mock quote from Rust backend
  const { data: quote, isLoading: isQuoting } = useQuery({
    queryKey: ["quote", inputMint, outputMint, amount, slippage],
    queryFn: async () => {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return null;
      const res = await fetch("http://127.0.0.1:3000/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_mint: inputMint,
          output_mint: outputMint,
          amount: Number(amount),
          slippage,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
    enabled: Boolean(amount && !isNaN(Number(amount)) && Number(amount) > 0),
    refetchInterval: 5000, // Refetch every 5s for real-time feel
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://127.0.0.1:3000/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_mint: inputMint,
          output_mint: outputMint,
          amount: Number(amount),
          slippage,
        }),
      });
      if (!res.ok) throw new Error("Swap failed");
      return res.json();
    },
  });

  const handleSwapMints = () => {
    setInputMint(outputMint);
    setOutputMint(inputMint);
  };

  return (
    <div className="w-full max-w-md rounded-sm border border-neutral-800 bg-[#0d0d0d] p-5 shadow-none transition-none">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <Zap className="h-5 w-5 text-violet" />
          Terminal
        </h3>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`rounded-md p-2 transition-colors ${showSettings ? "bg-violet/20 text-violet" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex rounded-sm border border-neutral-800 bg-black p-0.5">
        {(["snipe", "limit", "dca"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-sm py-1.5 text-xs font-semibold uppercase tracking-wider transition-none ${
              activeTab === tab ? "bg-[#1a1a1a] text-white" : "text-neutral-500 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Input Box */}
        <div className="rounded-sm border border-neutral-800 bg-black p-4 transition-none focus-within:border-violet/50">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            <span>Pay</span>
            <span>Balance: 0.00 {inputMint}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted-foreground/30"
            />
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-surface px-3 py-1.5 font-semibold shadow-sm">
              <div className="h-5 w-5 rounded-full bg-violet-gradient" />
              {inputMint}
            </div>
          </div>
        </div>

        {/* Swap Divider */}
        <div className="relative flex justify-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
          <button
            onClick={handleSwapMints}
            className="relative rounded-full border border-border bg-surface p-2 text-muted-foreground shadow-sm transition-transform hover:scale-110 hover:text-foreground"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        {/* Output Box */}
        <div className="rounded-sm border border-neutral-800 bg-black p-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            <span>Receive (Estimated)</span>
            <span>Balance: 0.00 {outputMint}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full truncate text-3xl font-semibold text-white">
              {isQuoting ? (
                <span className="flex items-center gap-2 text-lg text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Route...
                </span>
              ) : quote?.expected_output ? (
                quote.expected_output.toFixed(4)
              ) : (
                "0.00"
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-sm bg-[#1a1a1a] px-3 py-1.5 font-semibold border border-neutral-800">
              <div className="h-4 w-4 rounded-full bg-bull" />
              {outputMint}
            </div>
          </div>
        </div>
      </div>

      {activeTab === "limit" && (
        <div className="mt-3 rounded-sm border border-neutral-800 bg-black p-4 transition-none focus-within:border-violet/50">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            <span>Trigger Price (USD)</span>
            <span className="text-violet cursor-pointer hover:underline">Current</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-transparent text-xl font-semibold outline-none placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
      )}

      {activeTab === "dca" && (
        <div className="mt-3 rounded-sm border border-neutral-800 bg-black p-4">
          <div className="text-[10px] uppercase text-center text-neutral-500">
            DCA settings (Interval, Duration)
          </div>
        </div>
      )}

      {/* Quote Details */}
      {quote && !isQuoting && (
        <div className="mt-4 rounded-sm border border-neutral-800 bg-black p-3 text-[10px] uppercase tracking-wider text-neutral-500">
          <div className="flex justify-between py-1">
            <span>Minimum Received</span>
            <span className="font-mono text-white">{quote.minimum_received.toFixed(4)} {outputMint}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Price Impact</span>
            <span className="font-mono text-bull">{"< 0.01%"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Network Fee</span>
            <span className="font-mono text-white">{quote.fee.toFixed(6)} SOL</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Route</span>
            <span className="font-mono text-violet">Axiom Router</span>
          </div>
        </div>
      )}

      {/* Advanced Settings Panel */}
      {showSettings && (
        <div className="mt-3 space-y-3 rounded-sm border border-neutral-800 bg-black p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Max Slippage</span>
              <span className="font-mono text-violet">{slippage}%</span>
            </div>
            <div className="flex gap-2">
              {[0.5, 1.0, 2.5, 5.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${slippage === val ? "bg-violet text-white" : "bg-surface-2 text-muted-foreground hover:bg-surface"}`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-border/20">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-amber-500" /> Jito MEV Tip</span>
              <span className="font-mono text-amber-500">{jitoTip} SOL</span>
            </div>
            <div className="flex gap-2">
              {[0.001, 0.005, 0.01].map((val) => (
                <button
                  key={val}
                  onClick={() => setJitoTip(val)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${jitoTip === val ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" : "bg-surface-2 text-muted-foreground hover:bg-surface"}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className={`h-4 w-4 ${antiMev ? "text-bull" : ""}`} />
              Anti-MEV Protection
            </div>
            <button 
              onClick={() => setAntiMev(!antiMev)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${antiMev ? "bg-bull" : "bg-surface-2"}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${antiMev ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={() => swapMutation.mutate()}
        disabled={!amount || Number(amount) <= 0 || swapMutation.isPending}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-violet/90 py-3 text-[13px] uppercase tracking-wider font-bold text-white transition-none hover:bg-violet disabled:cursor-not-allowed disabled:opacity-50"
      >
        {swapMutation.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Processing...
          </>
        ) : swapMutation.isSuccess ? (
          <>
            <CheckCircle2 className="h-5 w-5" /> Confirmed
          </>
        ) : (
          activeTab === "snipe" ? "Execute Swap" : `Place ${activeTab.toUpperCase()} Order`
        )}
      </button>

      {/* Footer Info Row */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-bull" /> MEV Protected
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-amber-500" /> Jito +{jitoTip}
          </span>
        </div>
        <span className="flex items-center gap-1 text-bull">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-bull"></span>
          </span>
          Mainnet Connected
        </span>
      </div>
    </div>
  );
}
