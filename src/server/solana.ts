const DEX = "https://api.dexscreener.com";
const RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

type TokenSignal = {
  chainId?: string;
  tokenAddress?: string;
};

type RpcTokenAccount = {
  account?: {
    data?: {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: {
            uiAmount?: number;
            decimals?: number;
          };
        };
      };
    };
  };
};

type RpcBatchResponse = Array<{
  result?: {
    value?: number | RpcTokenAccount[];
  };
}>;

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
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
};

async function dsFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`DexScreener ${res.status}`);
  return res.json();
}

export async function getTrendingSolana(): Promise<DSPair[]> {
  try {
    const data = await dsFetch(`/latest/dex/search?q=SOL`);
    const pairs: DSPair[] = (data.pairs ?? []).filter(
      (p: DSPair) => p.chainId === "solana" && (p.liquidity?.usd ?? 0) > 5000,
    );
    pairs.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
    return pairs.slice(0, 60);
  } catch (e) {
    console.error("getTrendingSolana failed", e);
    return [];
  }
}

export async function getMemecoinsSolana(): Promise<DSPair[]> {
  try {
    const data = await dsFetch(`/latest/dex/search?q=pump`);
    const pairs: DSPair[] = (data.pairs ?? []).filter(
      (p: DSPair) =>
        p.chainId === "solana" &&
        (p.liquidity?.usd ?? 0) > 10_000 &&
        p.baseToken?.symbol &&
        p.baseToken.symbol !== "SOL" &&
        p.baseToken.symbol !== "USDC",
    );
    pairs.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
    return pairs.slice(0, 60);
  } catch (e) {
    console.error("getMemecoinsSolana failed", e);
    return [];
  }
}

async function hydrateMints(mints: string[]): Promise<DSPair[]> {
  const list = mints.filter(Boolean).slice(0, 30);
  if (!list.length) return [];
  const response = await dsFetch(`/tokens/v1/solana/${list.join(",")}`);
  return Array.isArray(response) ? (response as DSPair[]) : [];
}

export async function getNewSolana(): Promise<DSPair[]> {
  try {
    const [profiles, boosts] = await Promise.all([
      dsFetch(`/token-profiles/latest/v1`).catch(() => []),
      dsFetch(`/token-boosts/latest/v1`).catch(() => []),
    ]);
    const seen = new Set<string>();
    const mints: string[] = [];
    for (const arr of [boosts, profiles]) {
      for (const p of (Array.isArray(arr) ? arr : []) as TokenSignal[]) {
        if (p.chainId !== "solana") continue;
        const address = p.tokenAddress as string;
        if (!address || seen.has(address)) continue;
        seen.add(address);
        mints.push(address);
        if (mints.length >= 30) break;
      }
      if (mints.length >= 30) break;
    }
    const pairs = await hydrateMints(mints);
    pairs.sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0));
    return pairs;
  } catch (e) {
    console.error("getNewSolana failed", e);
    return [];
  }
}

export async function getFinalStretchSolana(): Promise<DSPair[]> {
  try {
    const boosts = ((await dsFetch(`/token-boosts/top/v1`).catch(() => [])) ?? []) as TokenSignal[];
    const mints = boosts
      .filter((b) => b.chainId === "solana")
      .slice(0, 30)
      .map((b) => b.tokenAddress ?? "")
      .filter(Boolean);
    const pairs = await hydrateMints(mints);
    const stretch = pairs.filter(
      (p) =>
        /pump/i.test(p.dexId) &&
        (p.liquidity?.usd ?? 0) > 20_000 &&
        (p.liquidity?.usd ?? 0) < 200_000,
    );
    stretch.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
    return (stretch.length ? stretch : pairs).slice(0, 20);
  } catch (e) {
    console.error("getFinalStretchSolana failed", e);
    return [];
  }
}

export async function getMigratedSolana(): Promise<DSPair[]> {
  try {
    const boosts = ((await dsFetch(`/token-boosts/top/v1`).catch(() => [])) ?? []) as TokenSignal[];
    const mints = boosts
      .filter((b) => b.chainId === "solana")
      .slice(0, 30)
      .map((b) => b.tokenAddress ?? "")
      .filter(Boolean);
    const pairs = await hydrateMints(mints);
    const migrated = pairs.filter(
      (p) => !/pump/i.test(p.dexId) && (p.liquidity?.usd ?? 0) > 50_000,
    );
    migrated.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
    return (migrated.length ? migrated : pairs).slice(0, 20);
  } catch (e) {
    console.error("getMigratedSolana failed", e);
    return [];
  }
}

export async function getTokenPairs({ data }: { data: { mint: string } }): Promise<DSPair[]> {
  try {
    const response = await dsFetch(`/tokens/v1/solana/${data.mint}`);
    const pairs: DSPair[] = Array.isArray(response) ? response : [];
    pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    return pairs;
  } catch (e) {
    console.error("getTokenPairs failed", e);
    return [];
  }
}

export async function searchTokens({ data }: { data: { q: string } }): Promise<DSPair[]> {
  if (!data.q || data.q.length < 2) return [];
  try {
    const response = await dsFetch(`/latest/dex/search?q=${encodeURIComponent(data.q)}`);
    const pairs: DSPair[] = (response.pairs ?? []).filter((p: DSPair) => p.chainId === "solana");
    return pairs.slice(0, 20);
  } catch (e) {
    console.error("searchTokens failed", e);
    return [];
  }
}

export async function getMarketStats(): Promise<{
  solUsd: number | null;
  pairs24h: number;
  vol24h: number;
}> {
  try {
    const response = await dsFetch(`/latest/dex/search?q=SOL%2FUSDC`);
    const pairs: DSPair[] = (response.pairs ?? []).filter(
      (p: DSPair) => p.chainId === "solana" && p.baseToken.symbol === "SOL",
    );
    const top = pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    const sol = top?.priceUsd ? parseFloat(top.priceUsd) : null;
    const trending = await dsFetch(`/latest/dex/search?q=SOL`);
    const tp: DSPair[] = (trending.pairs ?? []).filter((p: DSPair) => p.chainId === "solana");
    const vol24h = tp.reduce((acc, p) => acc + (p.volume?.h24 ?? 0), 0);
    return { solUsd: sol, pairs24h: tp.length, vol24h };
  } catch (e) {
    console.error("getMarketStats failed", e);
    return { solUsd: null, pairs24h: 0, vol24h: 0 };
  }
}

export async function getWalletHoldings({ data }: { data: { wallet: string } }): Promise<{
  solBalance: number;
  tokens: { mint: string; amount: number; decimals: number }[];
  error: string | null;
}> {
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

    const json = (await res.json()) as RpcBatchResponse;
    const sol = (json[0]?.result?.value ?? 0) / 1e9;
    const accounts = (json[1]?.result?.value as RpcTokenAccount[] | undefined) ?? [];
    const tokens = accounts
      .map((account) => {
        const info = account.account?.data?.parsed?.info;
        const tokenAmount = info?.tokenAmount;
        return {
          mint: info?.mint as string,
          amount: tokenAmount?.uiAmount ?? 0,
          decimals: tokenAmount?.decimals ?? 0,
        };
      })
      .filter((t: { amount: number }) => t.amount > 0)
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

    return { solBalance: sol, tokens, error: null };
  } catch (e) {
    console.error("getWalletHoldings failed", e);
    return { solBalance: 0, tokens: [], error: "Failed to fetch wallet" };
  }
}

export async function getTokensInfo({ data }: { data: { mints: string[] } }): Promise<DSPair[]> {
  const list = (data.mints || []).filter(Boolean).slice(0, 30);
  if (!list.length) return [];
  try {
    const response = await dsFetch(`/tokens/v1/solana/${list.join(",")}`);
    return Array.isArray(response) ? response : [];
  } catch (e) {
    console.error("getTokensInfo failed", e);
    return [];
  }
}
