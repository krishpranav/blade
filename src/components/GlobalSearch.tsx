import React, { useState, useCallback, memo } from "react";
import { Search, X, TrendingUp, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTrendingSolana } from "@/server/solana";
import { compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle };
}

export const GlobalSearchOverlay = memo(function GlobalSearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const { data: trending, isLoading } = useQuery({
    queryKey: ["trending-solana"],
    queryFn: () => getTrendingSolana(),
    staleTime: 30_000,
    enabled: isOpen,
  });

  const filtered = query.trim().length >= 1
    ? (trending ?? []).filter(
        (t) =>
          t.baseToken.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.baseToken.name?.toLowerCase().includes(query.toLowerCase()) ||
          t.baseToken.address.toLowerCase().includes(query.toLowerCase())
      )
    : trending ?? [];

  const results = filtered.slice(0, 12);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl rounded-sm border border-neutral-700 bg-[#0d0d0d] shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-neutral-500" />
          <input
            autoFocus
            type="text"
            placeholder="Search tokens by name, symbol, or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            className="flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-neutral-600"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-neutral-600 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {!query && (
            <div className="flex items-center gap-2 border-b border-neutral-900 px-4 py-2">
              <TrendingUp className="h-3 w-3 text-violet" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">
                Trending Pairs
              </span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
            </div>
          )}

          {!isLoading && results.length === 0 && query && (
            <div className="py-10 text-center text-[11px] uppercase tracking-widest text-neutral-700">
              No tokens found for "{query}"
            </div>
          )}

          {results.map((token) => {
            const ch24 = token.priceChange?.h24 ?? null;
            const price = token.priceUsd ? parseFloat(token.priceUsd) : null;
            return (
              <Link
                key={token.pairAddress}
                to="/token/$mint"
                params={{ mint: token.baseToken.address }}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#161616] transition-none border-b border-neutral-900/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-violet/10 text-xs font-bold text-violet border border-violet/20">
                    {token.baseToken.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-white">
                      {token.baseToken.symbol}
                      <span className="ml-2 text-[10px] text-neutral-600 font-normal">
                        {token.baseToken.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[10px] text-neutral-600">
                      <span>Liq ${compact(token.liquidity?.usd ?? 0)}</span>
                      <span>Vol ${compact(token.volume?.h24 ?? 0)}</span>
                      <span className="font-mono text-[9px] text-neutral-700">
                        {token.dexId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[12px] font-semibold text-white">
                    {price ? fmtUsd(price) : "—"}
                  </div>
                  <div className={"font-mono text-[11px] " + pctClass(ch24)}>
                    {fmtPct(ch24)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-900 px-4 py-2 flex items-center gap-4 text-[9px] text-neutral-700">
          <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="font-mono">Enter</kbd> Open</span>
          <span><kbd className="font-mono">Esc</kbd> Close</span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
});
