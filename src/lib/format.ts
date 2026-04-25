export function fmtUsd(n: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  if (opts.compact && Math.abs(n) >= 1000) {
    return "$" + compact(n);
  }
  if (Math.abs(n) >= 1) {
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  // Sub-dollar precision
  const digits = Math.abs(n) >= 0.01 ? 4 : Math.abs(n) >= 0.0001 ? 6 : 8;
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function compact(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

export function pctClass(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "text-muted-foreground";
  if (n > 0) return "text-bull";
  if (n < 0) return "text-bear";
  return "text-muted-foreground";
}

export function ageFromMs(ms: number | null | undefined): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  const d = Math.floor(h / 24);
  return d + "d";
}

export function shortAddr(addr: string, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return addr.slice(0, chars) + "…" + addr.slice(-chars);
}
