
# Axiom-Inspired Solana Trading Platform

A dark, high-density crypto trading dashboard inspired by axiom.trade. Pulls **real Solana market data** from public APIs (DexScreener, Jupiter, Birdeye-style endpoints). No authentication, no real order execution — buy/sell buttons open a simulated confirmation flow.

---

## Visual Direction
- Dark theme: near-black background, subtle blue/violet accents, neon green/red for price moves
- Tight monospaced numbers, dense data tables, sticky headers
- Smooth gradient hero, animated stat counters, glassmorphism cards
- Our own branding ("Vertex" or similar — final name decided in build) — Axiom-inspired, not a copy

---

## Pages & Routes

### `/` — Landing page
- Hero: bold headline ("The fastest gateway to Solana DeFi"), subhead, CTA → "Launch App"
- Animated trending tokens ticker
- Feature grid: Order Execution, Wallet Tracker, Migration Sniper, Auto-Strategies, Yield, Perps
- "Backed by" logo strip
- Live stats band (24h volume, tokens tracked, trades) — pulled from real APIs
- Footer with socials

### `/discover` — Token discovery
- Sortable, filterable table of trending Solana tokens (real data via DexScreener)
- Columns: token, price, 1h/24h change, volume, liquidity, market cap, age
- Search by symbol or contract address
- Filter chips: New, Trending, Top Gainers, High Volume

### `/pulse` — Real-time activity feed
- Live stream of new token launches & migrations on Solana
- Auto-refresh every 10s
- Click a row → token detail

### `/token/$mint` — Token detail page
- Price chart (TradingView lightweight-charts) with real candle data
- Token stats: liquidity, FDV, holders, age
- Buy/Sell panel (simulated): amount input, slippage, "Quick Buy" preset buttons → opens a "Confirm Trade (Demo)" modal
- Recent trades table (real DEX trades)
- Top holders, social links

### `/portfolio` — Mock portfolio
- Paste any Solana wallet address → fetch its real SPL token holdings & USD values
- P&L summary, asset allocation donut chart, holdings table
- No connection required, purely read-only lookup

### `/perps` — Perpetuals (showcase)
- UI shell mimicking a perps trading screen: orderbook, chart, leverage slider, position panel
- Marked "Coming Soon" — interactive but non-functional

### `/yield` — Yield opportunities
- Card grid of Solana yield sources (Kamino, MarginFi, Jito, etc.) with real APYs from public APIs
- Filter by asset / risk / protocol

---

## Data & Backend
- Server functions (TanStack Start) proxy public APIs to avoid CORS and rate-limit issues:
  - DexScreener for token prices, charts, trending
  - Jupiter price API for quotes
  - Public Solana RPC for wallet token balances
- TanStack Query for caching, background refresh, polling
- No database needed (no user accounts, no persisted state)

---

## Shared UI
- Persistent top nav with logo + route links (Discover, Pulse, Perps, Portfolio, Yield)
- Global token search (⌘K) jumping to `/token/$mint`
- Live SOL price pill in the header
- Responsive: mobile-friendly nav drawer, tables become cards on small screens

---

## Out of scope (first build)
- Real wallet connect & signing
- Real order execution / on-chain transactions
- User accounts, watchlists, alerts (can add later with auth)
- Real perps engine

After approval I'll start with the landing page + Discover + Token detail (the core flow), then layer Pulse, Portfolio, Yield, and the Perps shell.
