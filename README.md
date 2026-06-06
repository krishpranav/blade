# Blade

Blade is a Solana trading terminal prototype with a React/Vite frontend and a Rust API. The app focuses on market discovery, token inspection, portfolio diagnostics, order simulation, and execution planning.

## Stack

- Frontend: React 19, Vite, TanStack Router, TanStack Query, Tailwind CSS
- Backend: Rust, Axum, Tokio
- Market data: DexScreener and Solana RPC from the client, simulated trading state from the Rust service

## What Is Implemented

- Live Solana discovery pages for trending, meme, launch, and migration views
- Token detail workspace with charting, swap terminal, alerts, risk checks, wallet tools, journal, and execution widgets
- Backend-backed market snapshot, token risk rules, alert persistence, portfolio rebalance planning, perps margin quotes, and execution tracing
- Simulated backend state for orders, positions, arbitrage opportunities, and bot logs

## Running Locally

Install frontend dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Run the Rust backend in another terminal:

```bash
cd backend
cargo run
```

The frontend expects the backend at:

```text
http://127.0.0.1:3000
```

## Useful Commands

```bash
npm run build
npx eslint src
cd backend && cargo check
cd backend && cargo fmt
```

The full frontend lint task may report formatting issues in older files. For focused work, lint the files you touched.

## Backend API Highlights

- `GET /api/health`
- `GET /api/market/snapshot`
- `POST /api/quote`
- `POST /api/swap`
- `POST /api/execution/trace`
- `GET /api/risk-rules/:mint`
- `POST /api/portfolio/rebalance`
- `POST /api/perps/margin`
- `GET|POST /api/alerts`
- `GET|POST /api/orders`
- `GET /api/positions`

## Notes

This is not a production trading system. The backend trading engine is simulated, and UI actions should be treated as product and integration prototypes unless connected to audited execution infrastructure.
