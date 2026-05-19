import React, { useState, useCallback, memo } from "react";
import { BookOpen, Plus, Tag, Trash2, CheckSquare, Edit3, Save, TrendingUp, TrendingDown } from "lucide-react";
import { fmtUsd } from "@/lib/format";

type TradeTag = "momentum" | "breakout" | "dca" | "snipe" | "reversal" | "degen";

type JournalEntry = {
  id: string;
  tokenSymbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice?: number;
  sizeUsd: number;
  pnlUsd?: number;
  tags: TradeTag[];
  notes: string;
  timestamp: number;
  closed: boolean;
};

const TAG_COLORS: Record<TradeTag, string> = {
  momentum: "bg-violet/10 border-violet/20 text-violet",
  breakout: "bg-sky-500/10 border-sky-500/20 text-sky-400",
  dca: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  snipe: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  reversal: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  degen: "bg-pink-500/10 border-pink-500/20 text-pink-400",
};

const ALL_TAGS: TradeTag[] = ["momentum", "breakout", "dca", "snipe", "reversal", "degen"];

function ago(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86400000);
  const h = Math.floor(((Date.now() - ms) % 86400000) / 3600000);
  if (d > 0) return `${d}d ago`;
  return `${h}h ago`;
}

export const TradingJournal = memo(function TradingJournal({
  currentSymbol = "TOKEN",
}: {
  currentSymbol?: string;
}) {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "j1",
      tokenSymbol: "WIF",
      direction: "long",
      entryPrice: 2.1,
      exitPrice: 2.48,
      sizeUsd: 500,
      pnlUsd: 90.5,
      tags: ["momentum", "breakout"],
      notes: "Clean breakout above 2.1 resistance. Held for 40 min. Should have held longer.",
      timestamp: Date.now() - 86_400_000,
      closed: true,
    },
    {
      id: "j2",
      tokenSymbol: "BONK",
      direction: "long",
      entryPrice: 0.000018,
      exitPrice: 0.0000152,
      sizeUsd: 300,
      pnlUsd: -46.7,
      tags: ["degen", "snipe"],
      notes: "Sniped too early. Didn't wait for proper liquidity confirmation.",
      timestamp: Date.now() - 172_800_000,
      closed: true,
    },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [filterTag, setFilterTag] = useState<TradeTag | "all">("all");

  // New entry form state
  const [form, setForm] = useState({
    tokenSymbol: currentSymbol,
    entryPrice: "",
    sizeUsd: "",
    tags: [] as TradeTag[],
    notes: "",
    direction: "long" as "long" | "short",
  });

  const addEntry = useCallback(() => {
    if (!form.entryPrice || !form.sizeUsd) return;
    const entry: JournalEntry = {
      id: Math.random().toString(36).substring(7),
      tokenSymbol: form.tokenSymbol,
      direction: form.direction,
      entryPrice: parseFloat(form.entryPrice),
      sizeUsd: parseFloat(form.sizeUsd),
      tags: form.tags,
      notes: form.notes,
      timestamp: Date.now(),
      closed: false,
    };
    setEntries((prev) => [entry, ...prev]);
    setIsAdding(false);
    setForm({ tokenSymbol: currentSymbol, entryPrice: "", sizeUsd: "", tags: [], notes: "", direction: "long" });
  }, [form, currentSymbol]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleTag = useCallback((tag: TradeTag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const visible = filterTag === "all" ? entries : entries.filter((e) => e.tags.includes(filterTag));

  const totalPnl = entries.reduce((a, e) => a + (e.pnlUsd ?? 0), 0);
  const wins = entries.filter((e) => (e.pnlUsd ?? 0) > 0).length;
  const closed = entries.filter((e) => e.closed).length;

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-violet" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Trade Journal
          </span>
        </div>
        <button
          onClick={() => setIsAdding((v) => !v)}
          className="flex items-center gap-1 rounded-sm border border-violet/30 bg-violet/10 px-2 py-1 text-[9px] font-bold uppercase text-violet hover:bg-violet hover:text-white transition-none"
        >
          <Plus className="h-3 w-3" /> Log Trade
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-neutral-800 border-b border-neutral-800">
        <div className="px-3 py-2 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Net PnL</div>
          <div className={`mt-0.5 font-mono text-[12px] font-bold ${totalPnl >= 0 ? "text-bull" : "text-bear"}`}>
            {totalPnl >= 0 ? "+" : ""}{fmtUsd(totalPnl)}
          </div>
        </div>
        <div className="px-3 py-2 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Win Rate</div>
          <div className="mt-0.5 font-mono text-[12px] font-semibold text-white">
            {closed > 0 ? ((wins / closed) * 100).toFixed(0) : "—"}%
          </div>
        </div>
        <div className="px-3 py-2 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Entries</div>
          <div className="mt-0.5 font-mono text-[12px] font-semibold text-white">{entries.length}</div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="border-b border-neutral-800 p-4 space-y-3 bg-[#0a0a0a]">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Symbol"
              value={form.tokenSymbol}
              onChange={(e) => setForm((p) => ({ ...p, tokenSymbol: e.target.value }))}
              className="col-span-1 rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50"
            />
            <input
              type="number"
              placeholder="Entry Price"
              value={form.entryPrice}
              onChange={(e) => setForm((p) => ({ ...p, entryPrice: e.target.value }))}
              className="rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50"
            />
            <input
              type="number"
              placeholder="Size (USD)"
              value={form.sizeUsd}
              onChange={(e) => setForm((p) => ({ ...p, sizeUsd: e.target.value }))}
              className="rounded-sm border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase transition-none ${
                  form.tags.includes(tag) ? TAG_COLORS[tag] : "border-neutral-800 text-neutral-700 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Notes (what worked, what didn't)..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            className="w-full rounded-sm border border-neutral-800 bg-black px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50 resize-none"
          />
          <button
            onClick={addEntry}
            disabled={!form.entryPrice || !form.sizeUsd}
            className="flex items-center gap-1.5 rounded-sm border border-violet/30 bg-violet/10 px-3 py-1.5 text-[10px] font-bold uppercase text-violet hover:bg-violet hover:text-white transition-none disabled:opacity-40"
          >
            <Save className="h-3 w-3" /> Save Entry
          </button>
        </div>
      )}

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-900 bg-black px-3 py-2">
        <button
          onClick={() => setFilterTag("all")}
          className={`rounded-sm border px-1.5 py-0.5 text-[8px] font-bold uppercase transition-none ${filterTag === "all" ? "border-neutral-600 bg-neutral-800 text-white" : "border-neutral-800 text-neutral-700 hover:text-white"}`}
        >
          All
        </button>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`rounded-sm border px-1.5 py-0.5 text-[8px] font-bold uppercase transition-none ${filterTag === tag ? TAG_COLORS[tag] : "border-neutral-800 text-neutral-700 hover:text-white"}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="divide-y divide-neutral-900">
        {visible.length === 0 && (
          <div className="py-8 text-center text-[10px] uppercase tracking-widest text-neutral-700">
            No entries. Start logging your trades!
          </div>
        )}
        {visible.map((entry) => (
          <div key={entry.id} className="px-4 py-3 hover:bg-[#111] transition-none">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-white">{entry.tokenSymbol}</span>
                  <span className={`flex items-center gap-0.5 rounded-sm border px-1 py-0.5 text-[8px] font-bold ${entry.direction === "long" ? "border-bull/20 bg-bull/10 text-bull" : "border-bear/20 bg-bear/10 text-bear"}`}>
                    {entry.direction === "long" ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {entry.direction.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-neutral-700 font-mono">{ago(entry.timestamp)}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-neutral-500">
                  <span>Entry: ${entry.entryPrice.toFixed(6)}</span>
                  {entry.exitPrice && <span>Exit: ${entry.exitPrice.toFixed(6)}</span>}
                  <span>Size: {fmtUsd(entry.sizeUsd)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {entry.pnlUsd !== undefined && (
                  <span className={`font-mono text-[12px] font-bold ${entry.pnlUsd >= 0 ? "text-bull" : "text-bear"}`}>
                    {entry.pnlUsd >= 0 ? "+" : ""}{fmtUsd(entry.pnlUsd)}
                  </span>
                )}
                <button onClick={() => removeEntry(entry.id)} className="text-neutral-800 hover:text-bear transition-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {entry.notes && (
              <p className="mt-2 text-[10px] italic text-neutral-600 leading-relaxed">{entry.notes}</p>
            )}
            {entry.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <span key={tag} className={`rounded-sm border px-1.5 py-0.5 text-[8px] font-bold uppercase ${TAG_COLORS[tag]}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
