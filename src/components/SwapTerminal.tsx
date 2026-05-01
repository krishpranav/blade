import React, { useState } from "react";
import { ArrowDownUp, Settings, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fmtUsd } from "@/lib/format";

export function SwapTerminal({ defaultInput = "SOL", defaultOutput = "BONK" }) {
  const [inputMint, setInputMint] = useState(defaultInput);
  const [outputMint, setOutputMint] = useState(defaultOutput);
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(1.0);
  const [priorityFee, setPriorityFee] = useState<number>(0.001);

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
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface/80 p-5 shadow-glow backdrop-blur-xl transition-all">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <Zap className="h-5 w-5 text-violet" />
          Sniper Terminal
        </h3>
        <button className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Input Box */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 transition-colors focus-within:border-violet/50">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
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
        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Receive (Estimated)</span>
            <span>Balance: 0.00 {outputMint}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full truncate text-3xl font-semibold text-foreground/80">
              {isQuoting ? (
                <span className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Fetching route...
                </span>
              ) : quote?.expected_output ? (
                quote.expected_output.toFixed(4)
              ) : (
                "0.00"
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-surface px-3 py-1.5 font-semibold shadow-sm">
              <div className="h-5 w-5 rounded-full bg-bull" />
              {outputMint}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && !isQuoting && (
        <div className="mt-4 rounded-xl border border-border/40 bg-surface/30 p-3 text-xs text-muted-foreground">
          <div className="flex justify-between py-1">
            <span>Minimum Received</span>
            <span className="font-mono text-foreground">{quote.minimum_received.toFixed(4)} {outputMint}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Price Impact</span>
            <span className="font-mono text-bull">{"< 0.01%"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Network Fee</span>
            <span className="font-mono text-foreground">{quote.fee.toFixed(6)} SOL</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Route</span>
            <span className="font-mono text-violet">Axiom Router</span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={() => swapMutation.mutate()}
        disabled={!amount || Number(amount) <= 0 || swapMutation.isPending}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-gradient py-4 font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.01] hover:shadow-violet/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {swapMutation.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Executing Swap...
          </>
        ) : swapMutation.isSuccess ? (
          <>
            <CheckCircle2 className="h-5 w-5" /> Swap Confirmed
          </>
        ) : (
          "Execute Swap"
        )}
      </button>

      {/* Settings Row */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 cursor-pointer hover:text-foreground">
            Slippage: <span className="text-violet">{slippage}%</span>
          </span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-foreground">
            Priority: <span className="text-violet">{priorityFee} SOL</span>
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
