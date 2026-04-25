import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { getTokenPairs } from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass, shortAddr } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { buildSwapTx, getQuote, SOL_MINT, type JupiterQuote } from "@/lib/jupiter";
import { ExternalLink, Copy, ArrowLeft, Loader2, CheckCircle2, X, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/token/$mint")({
  head: ({ params }) => ({
    meta: [
      { title: `Token ${params.mint.slice(0, 6)}… | Vertex` },
      {
        name: "description",
        content: `Live price, chart, liquidity and trades for Solana token ${params.mint}.`,
      },
    ],
  }),
  component: TokenPage,
});

function TokenPage() {
  const { mint } = Route.useParams();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["token-pairs", mint],
    queryFn: () => getTokenPairs({ data: { mint } }),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const top = data?.[0];
  const wallet = useWallet();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0.1");
  const [submitting, setSubmitting] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [pendingQuote, setPendingQuote] = useState<JupiterQuote | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const SLIPPAGE_BPS = 100;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <div className="h-64 animate-pulse rounded-xl bg-surface" />
        </div>
      </AppLayout>
    );
  }

  if (!top) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-[1200px] px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold">Token not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find any Solana pairs for this mint.
          </p>
          <Link
            to="/discover"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-gradient px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Browse Discover
          </Link>
        </div>
      </AppLayout>
    );
  }

  const ch24 = top.priceChange?.h24 ?? null;
  const price = top.priceUsd ? parseFloat(top.priceUsd) : null;
  const buys24 = top.txns?.h24?.buys ?? 0;
  const sells24 = top.txns?.h24?.sells ?? 0;
  const total = buys24 + sells24;
  const buyPct = total > 0 ? (buys24 / total) * 100 : 50;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <button
          onClick={() => router.history.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/40 p-5 shadow-card">
          {top.info?.imageUrl ? (
            <img
              src={top.info.imageUrl}
              alt=""
              className="h-14 w-14 rounded-full bg-surface-2 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet/20 text-sm font-semibold">
              {top.baseToken.symbol.slice(0, 3)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {top.baseToken.symbol}
              </h1>
              <span className="text-sm text-muted-foreground">{top.baseToken.name}</span>
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] uppercase text-muted-foreground">
                {top.dexId}
              </span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(mint)}
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              {shortAddr(mint, 8)} <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono text-2xl font-semibold">
              {price ? fmtUsd(price) : "—"}
            </div>
            <div className={"font-mono text-sm " + pctClass(ch24)}>
              {fmtPct(ch24)} <span className="text-muted-foreground">24h</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
          <Cell label="Liquidity" value={top.liquidity?.usd ? "$" + compact(top.liquidity.usd) : "—"} />
          <Cell label="Volume 24h" value={top.volume?.h24 ? "$" + compact(top.volume.h24) : "—"} />
          <Cell label="Market Cap" value={top.marketCap ? "$" + compact(top.marketCap) : "—"} />
          <Cell label="FDV" value={top.fdv ? "$" + compact(top.fdv) : "—"} />
          <Cell label="Pair Age" value={ageFromMs(top.pairCreatedAt)} />
          <Cell
            label="Trades 24h"
            value={total ? total.toLocaleString() : "—"}
          />
        </div>

        {/* Chart + trade panel */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-semibold">{top.baseToken.symbol}/{top.quoteToken.symbol}</span>
                <span className="text-muted-foreground">on {top.dexId}</span>
              </div>
              {top.url && (
                <a
                  href={top.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Open chart <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {/* Embed DexScreener chart for real candles */}
            <iframe
              src={`https://dexscreener.com/solana/${top.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
              className="flex-1 w-full bg-background"
              title="chart"
            />
          </div>

          {/* Trade panel */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface/40 shadow-card">
            <div className="flex border-b border-border">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={
                    "flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors " +
                    (side === s
                      ? s === "buy"
                        ? "bg-bull/15 text-bull"
                        : "bg-bear/15 text-bear"
                      : "text-muted-foreground hover:bg-surface")
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-3 p-4">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Amount ({side === "buy" ? "SOL" : top.baseToken.symbol})</span>
                  <span>
                    Balance:{" "}
                    {wallet.publicKey
                      ? side === "buy"
                        ? (wallet.solBalance ?? 0).toFixed(3) + " SOL"
                        : "—"
                      : "—"}
                  </span>
                </div>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="h-12 w-full rounded-lg border border-border bg-surface-2 px-3 font-mono text-lg outline-none focus:border-violet"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(side === "buy" ? ["0.1", "0.5", "1", "5"] : ["25%", "50%", "75%", "100%"]).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => side === "buy" && setAmount(p)}
                      className="rounded-md border border-border bg-surface-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>

              <div className="space-y-1.5 rounded-lg border border-border bg-surface-2/60 p-3 text-[11px]">
                <Row label="Slippage" value="1.0%" />
                <Row label="Route" value="Jupiter v6 (best price)" />
                <Row
                  label="Est. received"
                  value={
                    price && parseFloat(amount) > 0
                      ? compact(parseFloat(amount) * (price ? 1 / price : 0) * 0.99) +
                        " " +
                        top.baseToken.symbol
                      : "—"
                  }
                />
              </div>

              {error && (
                <div className="rounded-md border border-bear/40 bg-bear/10 px-3 py-2 text-[11px] text-bear">
                  {error}
                </div>
              )}

              {!wallet.publicKey ? (
                <button
                  onClick={() => wallet.connect()}
                  className="h-11 w-full rounded-lg bg-violet-gradient text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Connect wallet to trade
                </button>
              ) : (
                <button
                  disabled={quoting || submitting || side === "sell" || !parseFloat(amount)}
                  onClick={async () => {
                    setError(null);
                    setTxSig(null);
                    try {
                      setQuoting(true);
                      const lamports = Math.floor(parseFloat(amount) * 1e9);
                      if (lamports < 1000) throw new Error("Amount too small");
                      const quote = await getQuote({
                        inputMint: SOL_MINT,
                        outputMint: top.baseToken.address,
                        amount: String(lamports),
                        slippageBps: SLIPPAGE_BPS,
                      });
                      setPendingQuote(quote);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Quote failed");
                    } finally {
                      setQuoting(false);
                    }
                  }}
                  className={
                    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.01] disabled:opacity-50 " +
                    (side === "buy" ? "bg-bull text-background" : "bg-bear text-background")
                  }
                >
                  {quoting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {side === "buy"
                    ? `Review buy ${top.baseToken.symbol}`
                    : `Sell (coming soon)`}
                </button>
              )}

              <p className="text-center text-[10px] text-muted-foreground">
                Real swaps signed in your Phantom wallet via Jupiter v6. You pay network fees.
              </p>
            </div>

            {/* Buy/sell pressure */}
            <div className="border-t border-border p-4">
              <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Buy pressure 24h</span>
                <span>{buys24.toLocaleString()} / {sells24.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bear/30">
                <div className="h-full bg-bull" style={{ width: buyPct + "%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Other pools */}
        {data && data.length > 1 && (
          <div className="mt-6">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Other pools
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
              <table className="w-full text-sm">
                <thead className="bg-surface/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Pool</th>
                    <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th className="px-4 py-2.5 text-right font-medium">Liquidity</th>
                    <th className="px-4 py-2.5 text-right font-medium">Vol 24h</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(1, 8).map((p) => (
                    <tr key={p.pairAddress} className="border-t border-border/40 hover:bg-surface-2">
                      <td className="px-4 py-2.5">
                        {p.dexId} · {p.baseToken.symbol}/{p.quoteToken.symbol}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {p.liquidity?.usd ? "$" + compact(p.liquidity.usd) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {p.volume?.h24 ? "$" + compact(p.volume.h24) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {pendingQuote && (
        <ConfirmSwapModal
          quote={pendingQuote}
          tokenSymbol={top.baseToken.symbol}
          tokenDecimals={top.baseToken.address === SOL_MINT ? 9 : (top.info?.imageUrl ? 0 : 0) || 6}
          slippageBps={SLIPPAGE_BPS}
          submitting={submitting}
          error={error}
          onCancel={() => {
            if (submitting) return;
            setPendingQuote(null);
            setError(null);
          }}
          onConfirm={async () => {
            setError(null);
            try {
              setSubmitting(true);
              const tx = await buildSwapTx({
                quote: pendingQuote,
                userPublicKey: wallet.publicKey!,
              });
              const sig = await wallet.signAndSend(tx);
              setTxSig(sig);
              setPendingQuote(null);
              wallet.refreshBalance();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Swap failed");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {txSig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
          onClick={() => setTxSig(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bull/20 text-bull">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-semibold">Swap submitted</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bought {top.baseToken.symbol} with {amount} SOL via Jupiter.
            </p>
            <a
              href={`https://solscan.io/tx/${txSig}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[12px] text-violet hover:underline"
            >
              View on Solscan <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => setTxSig(null)}
              className="mt-5 h-10 w-full rounded-lg bg-violet-gradient text-sm font-semibold text-primary-foreground"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
