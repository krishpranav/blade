use axum::{
    extract::{Json, Path, Query},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use std::{collections::HashMap, net::SocketAddr, time::{SystemTime, UNIX_EPOCH}};

// ─── Shared Types ────────────────────────────────────────────────────────────

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
}

fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
}

// ─── Quote / Swap ─────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct QuoteRequest {
    input_mint: String,
    output_mint: String,
    amount: f64,
    slippage: f64,
}

#[derive(Serialize)]
struct QuoteResponse {
    expected_output: f64,
    minimum_received: f64,
    price_impact: f64,
    fee: f64,
    route: Vec<String>,
    quoted_at: u64,
}

#[derive(Deserialize)]
struct SwapRequest {
    input_mint: String,
    output_mint: String,
    amount: f64,
    slippage: f64,
    jito_tip_sol: Option<f64>,
    anti_mev: Option<bool>,
}

#[derive(Serialize)]
struct SwapResponse {
    signature: String,
    status: String,
    confirmed_at: u64,
    fee_sol: f64,
    jito_tip_sol: f64,
}

async fn handle_quote(Json(payload): Json<QuoteRequest>) -> Json<QuoteResponse> {
    let simulated_price = 0.005;
    let expected = payload.amount * simulated_price;
    let impact = 0.001;
    let min_rec = expected * (1.0 - (payload.slippage / 100.0) - impact);
    Json(QuoteResponse {
        expected_output: expected,
        minimum_received: min_rec,
        price_impact: impact,
        fee: payload.amount * 0.001,
        route: vec![payload.input_mint, "Raydium".to_string(), payload.output_mint],
        quoted_at: now_ms(),
    })
}

async fn handle_swap(Json(payload): Json<SwapRequest>) -> Json<SwapResponse> {
    let tip = payload.jito_tip_sol.unwrap_or(0.001);
    Json(SwapResponse {
        signature: format!("blade_simulated_tx_{}", now_ms()),
        status: "confirmed".to_string(),
        confirmed_at: now_secs(),
        fee_sol: 0.000005,
        jito_tip_sol: tip,
    })
}

// ─── Price History ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct PriceHistoryQuery {
    interval: Option<String>, // 1m, 5m, 15m, 1h, 4h
    limit: Option<usize>,
}

#[derive(Serialize)]
struct OhlcCandle {
    time: u64,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: f64,
}

async fn handle_price_history(
    Path(mint): Path<String>,
    Query(params): Query<PriceHistoryQuery>,
) -> Json<Vec<OhlcCandle>> {
    let interval_ms: u64 = match params.interval.as_deref().unwrap_or("5m") {
        "1m" => 60_000,
        "15m" => 900_000,
        "1h" => 3_600_000,
        "4h" => 14_400_000,
        _ => 300_000, // 5m default
    };
    let limit = params.limit.unwrap_or(100).min(500);
    let now = now_ms();

    let mut candles = Vec::with_capacity(limit);
    let mut price = 0.005_f64;

    for i in 0..limit {
        let volatility = price * 0.04;
        let open = price;
        let close = open + (fastrand::f64() - 0.48) * volatility;
        let high = f64::max(open, close) + fastrand::f64() * volatility * 0.4;
        let low = f64::min(open, close) - fastrand::f64() * volatility * 0.4;
        let volume = 5000.0 + fastrand::f64() * 95_000.0;

        candles.push(OhlcCandle {
            time: now - ((limit - i) as u64) * interval_ms,
            open,
            high: high.max(0.0),
            low: low.max(0.0),
            close,
            volume,
        });
        price = close.max(0.0001);
    }

    Json(candles)
}

// ─── Token Analytics ──────────────────────────────────────────────────────────

#[derive(Serialize)]
struct TokenAnalytics {
    mint: String,
    risk_score: u8,
    mint_authority_revoked: bool,
    freeze_authority_revoked: bool,
    lp_locked_pct: f64,
    top10_holder_pct: f64,
    is_honeypot: bool,
    bundle_detected: bool,
    bundle_pct: f64,
    holder_count: u32,
    analyzed_at: u64,
}

async fn handle_token_analytics(Path(mint): Path<String>) -> Json<TokenAnalytics> {
    // Deterministic mock based on mint length (would be real on-chain call in prod)
    let seed = mint.len() as u8;
    let risk_score = 50u8.saturating_add(seed % 45);
    Json(TokenAnalytics {
        mint: mint.clone(),
        risk_score,
        mint_authority_revoked: seed % 3 != 0,
        freeze_authority_revoked: seed % 2 == 0,
        lp_locked_pct: 85.0 + (seed as f64 % 15.0),
        top10_holder_pct: 12.0 + (seed as f64 % 18.0),
        is_honeypot: false,
        bundle_detected: seed % 5 == 0,
        bundle_pct: if seed % 5 == 0 { 2.1 + (seed as f64 % 5.0) } else { 0.0 },
        holder_count: 1200 + (seed as u32 * 47),
        analyzed_at: now_secs(),
    })
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct PortfolioRequest {
    wallet: String,
}

#[derive(Serialize)]
struct TokenHolding {
    mint: String,
    symbol: String,
    amount: f64,
    value_usd: f64,
    pnl_usd: f64,
    pnl_pct: f64,
    avg_entry_usd: f64,
}

#[derive(Serialize)]
struct PortfolioResponse {
    wallet: String,
    sol_balance: f64,
    total_value_usd: f64,
    total_pnl_usd: f64,
    win_rate: f64,
    holdings: Vec<TokenHolding>,
    fetched_at: u64,
}

async fn handle_portfolio(Json(payload): Json<PortfolioRequest>) -> Json<PortfolioResponse> {
    let seed = payload.wallet.len() as f64;
    Json(PortfolioResponse {
        wallet: payload.wallet,
        sol_balance: 12.45 + seed % 100.0,
        total_value_usd: 8400.0 + seed * 50.0,
        total_pnl_usd: 2100.0 + seed * 10.0,
        win_rate: 62.0 + (seed % 28.0),
        holdings: vec![
            TokenHolding {
                mint: "WiF111111111111111111111111111111111111111".to_string(),
                symbol: "WIF".to_string(),
                amount: 1240.0,
                value_usd: 3040.0,
                pnl_usd: 820.0,
                pnl_pct: 37.1,
                avg_entry_usd: 1.78,
            },
            TokenHolding {
                mint: "BONK111111111111111111111111111111111111111".to_string(),
                symbol: "BONK".to_string(),
                amount: 12_000_000.0,
                value_usd: 1820.0,
                pnl_usd: -240.0,
                pnl_pct: -11.6,
                avg_entry_usd: 0.000018,
            },
        ],
        fetched_at: now_secs(),
    })
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct LeaderboardEntry {
    rank: u8,
    wallet: String,
    total_pnl_usd: f64,
    win_rate: f64,
    trades_30d: u32,
    best_win_usd: f64,
    avg_hold_minutes: f64,
    tags: Vec<String>,
}

async fn handle_leaderboard() -> Json<Vec<LeaderboardEntry>> {
    Json(vec![
        LeaderboardEntry { rank: 1, wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(), total_pnl_usd: 248_000.0, win_rate: 87.5, trades_30d: 312, best_win_usd: 48_000.0, avg_hold_minutes: 4.2, tags: vec!["sniper".to_string(), "micro-cap".to_string()] },
        LeaderboardEntry { rank: 2, wallet: "4fYNw3dojWmQ4dXtSGE9epjRGy9GFyZH9yZ3s8ByX9t".to_string(), total_pnl_usd: 182_500.0, win_rate: 79.2, trades_30d: 205, best_win_usd: 32_000.0, avg_hold_minutes: 12.7, tags: vec!["dca".to_string(), "lp-trader".to_string()] },
        LeaderboardEntry { rank: 3, wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWh".to_string(), total_pnl_usd: 97_200.0, win_rate: 74.8, trades_30d: 178, best_win_usd: 21_500.0, avg_hold_minutes: 8.1, tags: vec!["degen".to_string()] },
        LeaderboardEntry { rank: 4, wallet: "CuieVDEDtLo7FypjyQUsA6oWzRY1p4N7YNjU72pPxAuG".to_string(), total_pnl_usd: 63_400.0, win_rate: 71.1, trades_30d: 490, best_win_usd: 14_000.0, avg_hold_minutes: 1.8, tags: vec!["high-freq".to_string(), "sniper".to_string()] },
        LeaderboardEntry { rank: 5, wallet: "GtE9aGjQ7DXKL5bCMhHgthM2TvmjWz1UzQ6b2ENMxPW".to_string(), total_pnl_usd: 41_200.0, win_rate: 68.9, trades_30d: 143, best_win_usd: 9_800.0, avg_hold_minutes: 22.4, tags: vec!["swing".to_string()] },
    ])
}

// ─── Health / Metrics ─────────────────────────────────────────────────────────

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    uptime_secs: u64,
    endpoints: Vec<String>,
}

static START_TIME: std::sync::OnceLock<u64> = std::sync::OnceLock::new();

async fn handle_health() -> Json<HealthResponse> {
    let start = START_TIME.get_or_init(now_secs);
    Json(HealthResponse {
        status: "ok".to_string(),
        version: "0.4.0".to_string(),
        uptime_secs: now_secs() - start,
        endpoints: vec![
            "/api/health".to_string(),
            "/api/quote".to_string(),
            "/api/swap".to_string(),
            "/api/price-history/:mint".to_string(),
            "/api/analytics/:mint".to_string(),
            "/api/portfolio".to_string(),
            "/api/leaderboard".to_string(),
        ],
    })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Core
        .route("/api/health", get(handle_health))
        // Trading
        .route("/api/quote", post(handle_quote))
        .route("/api/swap", post(handle_swap))
        // Analytics
        .route("/api/price-history/:mint", get(handle_price_history))
        .route("/api/analytics/:mint", get(handle_token_analytics))
        // Portfolio & Social
        .route("/api/portfolio", post(handle_portfolio))
        .route("/api/leaderboard", get(handle_leaderboard))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🔪 Blade Backend v0.4.0 listening on {}", addr);
    println!("   Endpoints: /api/health | /api/quote | /api/swap");
    println!("             /api/price-history/:mint | /api/analytics/:mint");
    println!("             /api/portfolio | /api/leaderboard");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
