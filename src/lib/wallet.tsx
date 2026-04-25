import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey: { toString(): string } | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    tx: VersionedTransaction,
  ) => Promise<{ signature: string }>;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: { solana?: PhantomProvider };
  }
}

function getProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const p = window.phantom?.solana ?? window.solana;
  if (p?.isPhantom) return p;
  return null;
}

// Public Solana RPC. Helius/QuickNode would be faster — swap via env later.
export const RPC_URL = "https://solana-rpc.publicnode.com";

type WalletState = {
  ready: boolean;
  connecting: boolean;
  publicKey: string | null;
  solBalance: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signAndSend: (tx: VersionedTransaction) => Promise<string>;
};

const WalletCtx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [ready, setReady] = useState(false);

  const connection = useMemo(
    () => new Connection(RPC_URL, "confirmed"),
    [],
  );

  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(new PublicKey(publicKey));
      setSolBalance(lamports / 1e9);
    } catch (e) {
      console.error("balance fetch failed", e);
    }
  }, [publicKey, connection]);

  // Auto-reconnect on mount
  useEffect(() => {
    setReady(true);
    const p = getProvider();
    if (!p) return;
    p.connect({ onlyIfTrusted: true })
      .then((r) => setPublicKey(r.publicKey.toString()))
      .catch(() => {});
    const handleAccount = (...args: unknown[]) => {
      const pk = args[0] as { toString(): string } | null;
      setPublicKey(pk ? pk.toString() : null);
    };
    const handleDisconnect = () => setPublicKey(null);
    p.on("accountChanged", handleAccount);
    p.on("disconnect", handleDisconnect);
    return () => {
      p.removeListener?.("accountChanged", handleAccount);
      p.removeListener?.("disconnect", handleDisconnect);
    };
  }, []);

  // Refresh balance when key changes & every 20s
  useEffect(() => {
    if (!publicKey) return;
    refreshBalance();
    const i = setInterval(refreshBalance, 20_000);
    return () => clearInterval(i);
  }, [publicKey, refreshBalance]);

  const connect = useCallback(async () => {
    const p = getProvider();
    if (!p) {
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
      return;
    }
    setConnecting(true);
    try {
      const r = await p.connect();
      setPublicKey(r.publicKey.toString());
    } catch (e) {
      console.error("connect failed", e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = getProvider();
    try {
      await p?.disconnect();
    } catch {
      /* noop */
    }
    setPublicKey(null);
    setSolBalance(null);
  }, []);

  const signAndSend = useCallback(
    async (tx: VersionedTransaction): Promise<string> => {
      const p = getProvider();
      if (!p) throw new Error("Phantom wallet not detected");
      const { signature } = await p.signAndSendTransaction(tx);
      // Poll for confirmation in the background; don't block the UI long
      connection
        .confirmTransaction(signature, "confirmed")
        .catch((e) => console.warn("confirm error", e));
      return signature;
    },
    [connection],
  );

  const value = useMemo<WalletState>(
    () => ({
      ready,
      connecting,
      publicKey,
      solBalance,
      connect,
      disconnect,
      refreshBalance,
      signAndSend,
    }),
    [ready, connecting, publicKey, solBalance, connect, disconnect, refreshBalance, signAndSend],
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletCtx);
  if (!ctx) {
    // Provide an inert default so SSR doesn't crash if a child renders before provider mounts
    return {
      ready: false,
      connecting: false,
      publicKey: null,
      solBalance: null,
      connect: async () => {},
      disconnect: async () => {},
      refreshBalance: async () => {},
      signAndSend: async () => {
        throw new Error("Wallet not ready");
      },
    };
  }
  return ctx;
}
