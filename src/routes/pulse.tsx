import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { getNewSolana } from "@/server/solana";
import { ageFromMs, compact, fmtPct, fmtUsd, pctClass } from "@/lib/format";

export const Route = createFileRoute("/pulse")({
  head: () => ({
    meta: [
      { title: "Pulse — Live Solana Token Launches | Vertex" },
      {
        name: "description",
        content:
          "Live feed of newly launched Solana tokens. Catch migrations and new pairs the moment they go live.",
      },
      { property: "og:title", content: "Pulse — Live Solana launches" },
      {
        property: "og:description",
        content: "A real-time feed of new Solana token launches and migrations.",
      },
    ],
  }),
  component: Pulse,
});

function Pulse() {
  const { data, isLoading } = useQuery({
    queryKey: ["new-solana"],
    queryFn: () => getNewSolana(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const rows = data ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Pulse</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-bull pulse-dot" />
            Live · refreshes every 15s
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isLoading &&
            Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-border bg-surface/40"
              />
            ))}
          {rows.map((p) => {
            const ch = p.priceChange?.h24 ?? 0;
            return (
              <Link
                to="/token/$mint"
                params={{ mint: p.baseToken.address }}
                key={p.pairAddress}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface/40 p-4 transition-colors hover:bg-surface"
              >
                <div className="flex items-start gap-3">
                  {p.info?.imageUrl ? (
                    <img
                      src={p.info.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-full bg-surface-2 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet/20 text-[11px] font-semibold">
                      {p.baseToken.symbol.slice(0, 3)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-semibold">
                        {p.baseToken.symbol}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {p.baseToken.name}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {ageFromMs(p.pairCreatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-3">
                      <span className="font-mono text-sm font-semibold">
                        {p.priceUsd ? fmtUsd(parseFloat(p.priceUsd)) : "—"}
                      </span>
                      <span className={"font-mono text-xs " + pctClass(ch)}>
                        {fmtPct(ch)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <Stat label="Liq" value={p.liquidity?.usd ? "$" + compact(p.liquidity.usd) : "—"} />
                      <Stat label="Vol 24h" value={p.volume?.h24 ? "$" + compact(p.volume.h24) : "—"} />
                      <Stat label="MCap" value={p.marketCap ? "$" + compact(p.marketCap) : "—"} />
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-violet-gradient opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2/60 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-[11px]">{value}</div>
    </div>
  );
}
