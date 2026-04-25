import { VersionedTransaction } from "@solana/web3.js";

const JUP_QUOTE = "https://quote-api.jup.ag/v6/quote";
const JUP_SWAP = "https://quote-api.jup.ag/v6/swap";

export const SOL_MINT = "So11111111111111111111111111111111111111112";

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: { label: string; inputMint: string; outputMint: string };
  }>;
};

export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string; // raw lamports/units (string to preserve precision)
  slippageBps?: number;
}): Promise<JupiterQuote> {
  const url = new URL(JUP_QUOTE);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", params.amount);
  url.searchParams.set("slippageBps", String(params.slippageBps ?? 100));
  url.searchParams.set("restrictIntermediateTokens", "true");
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`Jupiter quote failed: ${r.status}`);
  return (await r.json()) as JupiterQuote;
}

export async function buildSwapTx(params: {
  quote: JupiterQuote;
  userPublicKey: string;
  priorityLamports?: number;
}): Promise<VersionedTransaction> {
  const r = await fetch(JUP_SWAP, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quote,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: params.priorityLamports ?? 200_000,
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Jupiter swap failed: ${r.status} ${t}`);
  }
  const { swapTransaction } = (await r.json()) as { swapTransaction: string };
  const buf = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0));
  return VersionedTransaction.deserialize(buf);
}
