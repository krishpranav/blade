import React, { useState, useEffect, memo } from "react";
import { Twitter, MessageCircle, TrendingUp, Flame, BarChart2, RefreshCw } from "lucide-react";

type SentimentSource = "twitter" | "telegram" | "reddit";

type SentimentPost = {
  id: string;
  source: SentimentSource;
  author: string;
  content: string;
  likes: number;
  reposts: number;
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: number;
};

type SentimentMetrics = {
  bullishPct: number;
  bearishPct: number;
  neutralPct: number;
  mentionsLast1h: number;
  mentionsLast24h: number;
  trendDirection: "up" | "down" | "flat";
};

const SOURCE_ICON: Record<SentimentSource, React.ReactNode> = {
  twitter: <Twitter className="h-3 w-3" />,
  telegram: <MessageCircle className="h-3 w-3" />,
  reddit: <BarChart2 className="h-3 w-3" />,
};

const SOURCE_COLOR: Record<SentimentSource, string> = {
  twitter: "text-sky-400",
  telegram: "text-blue-400",
  reddit: "text-orange-400",
};

function ago(ms: number) {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h`;
}

function mockPosts(symbol: string): SentimentPost[] {
  return [
    {
      id: "1",
      source: "twitter",
      author: "@solana_degen",
      content: `${symbol} just broke out of a massive accumulation zone. Next stop 3x easy. LFG 🚀`,
      likes: 412,
      reposts: 87,
      sentiment: "bullish",
      timestamp: Date.now() - 120_000,
    },
    {
      id: "2",
      source: "telegram",
      author: "CryptoWhale99",
      content: `${symbol} looks overbought on the 5m. I see heavy resistance above. Might see a pullback before continuation.`,
      likes: 38,
      reposts: 12,
      sentiment: "bearish",
      timestamp: Date.now() - 480_000,
    },
    {
      id: "3",
      source: "twitter",
      author: "@memecointrader",
      content: `Loaded more ${symbol} on this dip. Devs are based, LP locked, team is communicating daily. Diamond hands only 💎`,
      likes: 219,
      reposts: 44,
      sentiment: "bullish",
      timestamp: Date.now() - 900_000,
    },
    {
      id: "4",
      source: "reddit",
      author: "u/solana_apes",
      content: `${symbol} thread: Fundamentals look solid. Top holders are accumulating. Just stay patient.`,
      likes: 156,
      reposts: 21,
      sentiment: "neutral",
      timestamp: Date.now() - 1_800_000,
    },
    {
      id: "5",
      source: "twitter",
      author: "@rugpullalert",
      content: `${symbol} — deployer wallet still has 2% supply. Not a confirmed rug but be careful out there.`,
      likes: 88,
      reposts: 34,
      sentiment: "bearish",
      timestamp: Date.now() - 3_200_000,
    },
  ];
}

export const SocialSentimentFeed = memo(function SocialSentimentFeed({
  tokenSymbol = "TOKEN",
}: {
  tokenSymbol?: string;
}) {
  const [posts, setPosts] = useState<SentimentPost[]>([]);
  const [metrics, setMetrics] = useState<SentimentMetrics>({
    bullishPct: 62,
    bearishPct: 24,
    neutralPct: 14,
    mentionsLast1h: 847,
    mentionsLast24h: 9420,
    trendDirection: "up",
  });
  const [filter, setFilter] = useState<SentimentSource | "all">("all");
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    setPosts(mockPosts(tokenSymbol));
  }, [tokenSymbol]);

  // Simulate periodic metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        mentionsLast1h: prev.mentionsLast1h + Math.floor(Math.random() * 10),
        bullishPct: Math.min(90, Math.max(10, prev.bullishPct + (Math.random() - 0.5) * 3)),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setPosts(mockPosts(tokenSymbol));
    setLastRefresh(Date.now());
  };

  const visiblePosts =
    filter === "all" ? posts : posts.filter((p) => p.source === filter);

  const sentimentColor =
    metrics.bullishPct > 60
      ? "text-bull"
      : metrics.bullishPct < 40
      ? "text-bear"
      : "text-amber-400";

  return (
    <div className="rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Social Sentiment
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-neutral-700">{ago(lastRefresh)} ago</span>
          <button onClick={refresh} className="text-neutral-700 hover:text-white transition-none">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800">
        <div className="px-3 py-2.5 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Sentiment</div>
          <div className={`mt-0.5 font-mono text-[12px] font-bold ${sentimentColor}`}>
            {metrics.bullishPct.toFixed(0)}% 🐂
          </div>
        </div>
        <div className="px-3 py-2.5 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Mentions 1h</div>
          <div className="mt-0.5 font-mono text-[12px] font-semibold text-white">
            {metrics.mentionsLast1h.toLocaleString()}
          </div>
        </div>
        <div className="px-3 py-2.5 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Mentions 24h</div>
          <div className="mt-0.5 font-mono text-[12px] font-semibold text-white">
            {metrics.mentionsLast24h.toLocaleString()}
          </div>
        </div>
        <div className="px-3 py-2.5 bg-[#0a0a0a]">
          <div className="text-[9px] uppercase tracking-widest text-neutral-600">Trend</div>
          <div className={`mt-0.5 font-mono text-[12px] font-bold ${metrics.trendDirection === "up" ? "text-bull" : metrics.trendDirection === "down" ? "text-bear" : "text-neutral-400"}`}>
            {metrics.trendDirection === "up" ? "↑ Rising" : metrics.trendDirection === "down" ? "↓ Falling" : "→ Flat"}
          </div>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex overflow-hidden rounded-sm h-2">
          <div className="bg-bull transition-none" style={{ width: `${metrics.bullishPct}%` }} />
          <div className="bg-neutral-600 transition-none" style={{ width: `${metrics.neutralPct}%` }} />
          <div className="bg-bear transition-none" style={{ width: `${metrics.bearishPct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-mono">
          <span className="text-bull">{metrics.bullishPct.toFixed(0)}% Bullish</span>
          <span className="text-neutral-600">{metrics.neutralPct.toFixed(0)}% Neutral</span>
          <span className="text-bear">{metrics.bearishPct.toFixed(0)}% Bearish</span>
        </div>
      </div>

      {/* Source Filters */}
      <div className="flex border-b border-neutral-900 bg-black">
        {(["all", "twitter", "telegram", "reddit"] as const).map((src) => (
          <button
            key={src}
            onClick={() => setFilter(src)}
            className={`flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-widest border-b-2 transition-none capitalize ${
              filter === src
                ? "border-violet text-white"
                : "border-transparent text-neutral-600 hover:text-white"
            }`}
          >
            {src}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="divide-y divide-neutral-900">
        {visiblePosts.map((post) => (
          <div key={post.id} className="px-4 py-3 hover:bg-[#111] transition-none">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={SOURCE_COLOR[post.source]}>{SOURCE_ICON[post.source]}</span>
                <span className="font-mono text-[10px] font-semibold text-white">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-sm border px-1 py-0.5 text-[8px] font-bold uppercase ${
                    post.sentiment === "bullish"
                      ? "border-bull/20 bg-bull/10 text-bull"
                      : post.sentiment === "bearish"
                      ? "border-bear/20 bg-bear/10 text-bear"
                      : "border-neutral-800 bg-neutral-900 text-neutral-500"
                  }`}
                >
                  {post.sentiment}
                </span>
                <span className="text-[9px] text-neutral-700 font-mono">{ago(post.timestamp)}</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">{post.content}</p>
            <div className="mt-1.5 flex items-center gap-3 text-[9px] text-neutral-700">
              <span>♥ {post.likes}</span>
              <span>↻ {post.reposts}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
