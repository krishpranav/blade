import { createServerFn } from "@tanstack/react-start";

const DEX = "https://api.dexscreener.com";

export type DSPair = {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  priceNative?: string;
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  txns?: { h24?: { buys: number; sells: number }; h1?: { buys: number; sells: number } };
  url?: string;
  info?: { imageUrl?: string; websites?: { url: string }[]; socials?: { type: string; url: string }[] };
};

async function dsFetch(path: string): Promise<any> {
  const res = await fetch(`${DEX}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`DexScreener ${res.status}`);
  return res.json();
}

/** Trending Solana tokens via the search endpoint with high-signal queries */
export const getTrendingSolana = createServerFn({ method: "GET" }).handler(
  async (): Promise<DSPair[]> => {
    try {
      // SOL is paired into nearly every Solana pool — gives us a broad set sorted by activity
      const data = await dsFetch(`/latest/dex/search?q=SOL`);
      const pairs: DSPair[] = (data.pairs ?? []).filter(
        (p: DSPair) => p.chainId === "solana" && (p.liquidity?.usd ?? 0) > 5000,
      );
      // Sort by 24h volume desc
      pairs.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
      return pairs.slice(0, 60);
    } catch (e) {
      console.error("getTrendingSolana failed", e);
      return [];
    }
  },
);

/** Newly created Solana pairs — proxy for "Pulse" / new launches */
export const getNewSolana = createServerFn({ method: "GET" }).handler(
  async (): Promise<DSPair[]> => {
    try {
      const data = await dsFetch(`/token-profiles/latest/v1`);
      const profiles = (Array.isArray(data) ? data : []).filter(
        (p: any) => p.chainId === "solana",
      );
      const addresses = profiles.slice(0, 30).map((p: any) => p.tokenAddress).filter(Boolean);
      if (!addresses.length) return [];
      const detail = await dsFetch(`/tokens/v1/solana/${addresses.join(",")}`);
      const pairs: DSPair[] = (Array.isArray(detail) ? detail : []).filter(
        (p: DSPair) => p?.chainId === "solana",
      );
      pairs.sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0));
      return pairs.slice(0, 40);
    } catch (e) {
      console.error("getNewSolana failed", e);
      return [];
    }
  },
);

/** All pairs for a token (mint address) */
export const getTokenPairs = createServerFn({ method: "GET" })
  .inputValidator((d: { mint: string }) => d)
  .handler(async ({ data }): Promise<DSPair[]> => {
    try {
      const r = await dsFetch(`/tokens/v1/solana/${data.mint}`);
      const pairs: DSPair[] = Array.isArray(r) ? r : [];
      pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
      return pairs;
    } catch (e) {
      console.error("getTokenPairs failed", e);
      return [];
    }
  });

/** Search tokens across Solana */
export const searchTokens = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data }): Promise<DSPair[]> => {
    if (!data.q || data.q.length < 2) return [];
    try {
      const r = await dsFetch(`/latest/dex/search?q=${encodeURIComponent(data.q)}`);
      const pairs: DSPair[] = (r.pairs ?? []).filter((p: DSPair) => p.chainId === "solana");
      return pairs.slice(0, 20);
    } catch (e) {
      console.error("searchTokens failed", e);
      return [];
    }
  });

/** Live SOL price + market stats — used in nav and stats band */
export const getMarketStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ solUsd: number | null; pairs24h: number; vol24h: number }> => {
    try {
      const r = await dsFetch(`/latest/dex/search?q=SOL%2FUSDC`);
      const pairs: DSPair[] = (r.pairs ?? []).filter(
        (p: DSPair) => p.chainId === "solana" && p.baseToken.symbol === "SOL",
      );
      const top = pairs.sort(
        (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
      )[0];
      const sol = top?.priceUsd ? parseFloat(top.priceUsd) : null;

      // Aggregate from trending list as a quick stat (not exact, illustrative)
      const trending = await dsFetch(`/latest/dex/search?q=SOL`);
      const tp: DSPair[] = (trending.pairs ?? []).filter((p: DSPair) => p.chainId === "solana");
      const vol24h = tp.reduce((acc, p) => acc + (p.volume?.h24 ?? 0), 0);
      return { solUsd: sol, pairs24h: tp.length, vol24h };
    } catch (e) {
      console.error("getMarketStats failed", e);
      return { solUsd: null, pairs24h: 0, vol24h: 0 };
    }
  },
);

/** Wallet token holdings via public Solana RPC */
const RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export const getWalletHoldings = createServerFn({ method: "GET" })
  .inputValidator((d: { wallet: string }) => d)
  .handler(
    async ({
      data,
    }): Promise<{
      solBalance: number;
      tokens: { mint: string; amount: number; decimals: number }[];
      error: string | null;
    }> => {
      const { wallet } = data;
      if (!wallet || wallet.length < 32 || wallet.length > 44) {
        return { solBalance: 0, tokens: [], error: "Invalid Solana address" };
      }
      try {
        const body = (id: number, method: string, params: unknown[]) => ({
          jsonrpc: "2.0",
          id,
          method,
          params,
        });
        const res = await fetch(RPC, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([
            body(1, "getBalance", [wallet]),
            body(2, "getTokenAccountsByOwner", [
              wallet,
              { programId: TOKEN_PROGRAM },
              { encoding: "jsonParsed" },
            ]),
          ]),
        });
        if (!res.ok) return { solBalance: 0, tokens: [], error: `RPC ${res.status}` };
        const json = (await res.json()) as Array<{ result: any; error?: any }>;
        const sol = (json[0]?.result?.value ?? 0) / 1e9;
        const accounts = json[1]?.result?.value ?? [];
        const tokens = accounts
          .map((a: any) => {
            const info = a.account?.data?.parsed?.info;
            const ta = info?.tokenAmount;
            return {
              mint: info?.mint as string,
              amount: ta?.uiAmount ?? 0,
              decimals: ta?.decimals ?? 0,
            };
          })
          .filter((t: { amount: number }) => t.amount > 0)
          .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);
        return { solBalance: sol, tokens, error: null };
      } catch (e) {
        console.error("getWalletHoldings failed", e);
        return { solBalance: 0, tokens: [], error: "Failed to fetch wallet" };
      }
    },
  );

/** Hydrate a list of mints into pair info for portfolio valuation */
export const getTokensInfo = createServerFn({ method: "GET" })
  .inputValidator((d: { mints: string[] }) => d)
  .handler(async ({ data }): Promise<DSPair[]> => {
    const list = (data.mints || []).filter(Boolean).slice(0, 30);
    if (!list.length) return [];
    try {
      const r = await dsFetch(`/tokens/v1/solana/${list.join(",")}`);
      return Array.isArray(r) ? r : [];
    } catch (e) {
      console.error("getTokensInfo failed", e);
      return [];
    }
  });
