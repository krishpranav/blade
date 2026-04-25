import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { getMarketStats, searchTokens } from "@/server/solana";
import { fmtUsd } from "@/lib/format";
import { Search } from "lucide-react";

const navItems = [
  { to: "/discover", label: "Discover" },
  { to: "/pulse", label: "Pulse" },
  { to: "/perps", label: "Perps" },
  { to: "/yield", label: "Yield" },
  { to: "/portfolio", label: "Portfolio" },
] as const;

export function AppHeader() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["market-stats"],
    queryFn: () => getMarketStats(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const { data: results } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchTokens({ data: { q } }),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-[13px] font-medium bg-surface text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface/60 px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search token or address</span>
            <kbd className="ml-6 rounded border border-border bg-background/80 px-1.5 py-[1px] font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>

          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-bull pulse-dot" />
            <span className="text-[12px] text-muted-foreground">SOL</span>
            <span className="font-mono text-[12px] font-semibold">
              {stats?.solUsd ? fmtUsd(stats.solUsd) : "—"}
            </span>
          </div>

          <WalletButton />
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-4 pt-24 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by symbol, name, or mint address…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border bg-background/80 px-1.5 py-[1px] font-mono text-[10px]">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(results ?? []).slice(0, 10).map((p) => (
                <button
                  key={p.pairAddress}
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    navigate({ to: "/token/$mint", params: { mint: p.baseToken.address } });
                  }}
                  className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet/20 text-[10px] font-semibold">
                    {p.baseToken.symbol.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {p.baseToken.symbol}{" "}
                      <span className="text-muted-foreground">{p.baseToken.name}</span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {p.baseToken.address.slice(0, 12)}…
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                  </div>
                </button>
              ))}
              {q.length >= 2 && (results ?? []).length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results
                </div>
              )}
              {q.length < 2 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Start typing to search Solana tokens…
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
