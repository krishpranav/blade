use axum::{
    extract::{Json, Path, Query, State},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use std::{collections::HashMap, net::SocketAddr, sync::{Arc, Mutex}, time::{SystemTime, UNIX_EPOCH}};

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
    Path(_mint): Path<String>,
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
        version: "0.5.0".to_string(),
        uptime_secs: now_secs() - start,
        endpoints: vec![
            "/api/health".to_string(),
            "/api/quote".to_string(),
            "/api/swap".to_string(),
            "/api/price-history/:mint".to_string(),
            "/api/analytics/:mint".to_string(),
            "/api/portfolio".to_string(),
            "/api/leaderboard".to_string(),
            "/api/orders".to_string(),
            "/api/orders/cancel".to_string(),
            "/api/positions".to_string(),
            "/api/positions/close".to_string(),
            "/api/arbitrage".to_string(),
            "/api/bot/logs".to_string(),
        ],
    })
}

// ─── Shared State Definitions ───────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Order {
    id: String,
    token_symbol: String,
    #[serde(rename = "type")]
    order_type: String, // "Limit Buy", "Limit Sell", "Take Profit", "Stop Loss", "DCA Buy"
    trigger_price: f64,
    size_usd: f64,
    status: String, // "Open", "Filled", "Cancelled"
    created_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Position {
    id: String,
    token_symbol: String,
    size_usd: f64,
    entry_price: f64,
    current_price: f64,
    pnl_usd: f64,
    pnl_pct: f64,
    created_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ArbitrageOpp {
    id: String,
    token_symbol: String,
    buy_dex: String,
    sell_dex: String,
    buy_price: f64,
    sell_price: f64,
    profit_pct: f64,
    expected_profit_usd: f64,
    timestamp: u64,
}

struct AppState {
    orders: Mutex<Vec<Order>>,
    positions: Mutex<Vec<Position>>,
    bot_logs: Mutex<Vec<String>>,
    arbitrage_opportunities: Mutex<Vec<ArbitrageOpp>>,
    current_prices: Mutex<HashMap<String, f64>>,
}

impl Default for AppState {
    fn default() -> Self {
        let mut prices = HashMap::new();
        prices.insert("SOL".to_string(), 178.42);
        prices.insert("BTC".to_string(), 71240.0);
        prices.insert("ETH".to_string(), 3640.0);
        prices.insert("WIF".to_string(), 2.84);
        prices.insert("BONK".to_string(), 0.0000234);
        prices.insert("POPCAT".to_string(), 0.42);

        let orders = vec![
            Order {
                id: "o1".to_string(),
                token_symbol: "WIF".to_string(),
                order_type: "Take Profit".to_string(),
                trigger_price: 3.00,
                size_usd: 1250.00,
                status: "Open".to_string(),
                created_at: now_secs(),
            },
            Order {
                id: "o2".to_string(),
                token_symbol: "BONK".to_string(),
                order_type: "Limit Buy".to_string(),
                trigger_price: 0.000015,
                size_usd: 500.00,
                status: "Open".to_string(),
                created_at: now_secs(),
            },
        ];

        let positions = vec![
            Position {
                id: "p1".to_string(),
                token_symbol: "WIF".to_string(),
                size_usd: 1250.00,
                entry_price: 2.10,
                current_price: 2.45,
                pnl_usd: 208.33,
                pnl_pct: 16.66,
                created_at: now_secs(),
            },
            Position {
                id: "p2".to_string(),
                token_symbol: "POPCAT".to_string(),
                size_usd: 840.00,
                entry_price: 0.45,
                current_price: 0.41,
                pnl_usd: -74.66,
                pnl_pct: -8.88,
                created_at: now_secs(),
            },
        ];

        Self {
            orders: Mutex::new(orders),
            positions: Mutex::new(positions),
            bot_logs: Mutex::new(vec![
                format!("[{}] 🤖 System matching engine initialized.", now_secs()),
                format!("[{}] 🔎 Sniper Bot scanning mempool...", now_secs()),
            ]),
            arbitrage_opportunities: Mutex::new(vec![]),
            current_prices: Mutex::new(prices),
        }
    }
}

// ─── API Handlers ───────────────────────────────────────────────────────────

async fn handle_get_orders(State(state): State<Arc<AppState>>) -> Json<Vec<Order>> {
    let orders = state.orders.lock().unwrap();
    Json(orders.clone())
}

#[derive(Deserialize)]
struct CreateOrderRequest {
    token_symbol: String,
    #[serde(rename = "type")]
    order_type: String,
    trigger_price: f64,
    size_usd: f64,
}

async fn handle_create_order(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateOrderRequest>,
) -> Json<Order> {
    let mut orders = state.orders.lock().unwrap();
    let order = Order {
        id: format!("o_{}", now_ms()),
        token_symbol: payload.token_symbol.clone(),
        order_type: payload.order_type.clone(),
        trigger_price: payload.trigger_price,
        size_usd: payload.size_usd,
        status: "Open".to_string(),
        created_at: now_secs(),
    };
    orders.push(order.clone());

    let mut logs = state.bot_logs.lock().unwrap();
    logs.insert(0, format!(
        "[{}] 📥 Order placed: {} {} at trigger ${:.6}",
        now_secs(),
        payload.order_type,
        payload.token_symbol,
        payload.trigger_price
    ));

    Json(order)
}

#[derive(Deserialize)]
struct CancelOrderRequest {
    id: String,
}

async fn handle_cancel_order(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CancelOrderRequest>,
) -> Json<HashMap<String, bool>> {
    let mut orders = state.orders.lock().unwrap();
    let mut success = false;
    
    if let Some(order) = orders.iter_mut().find(|o| o.id == payload.id) {
        order.status = "Cancelled".to_string();
        success = true;

        let mut logs = state.bot_logs.lock().unwrap();
        logs.insert(0, format!(
            "[{}] ✕ Order cancelled: {} for {}",
            now_secs(),
            order.order_type,
            order.token_symbol
        ));
    }
    
    orders.retain(|o| o.id != payload.id);

    let mut res = HashMap::new();
    res.insert("success".to_string(), success);
    Json(res)
}

async fn handle_get_positions(State(state): State<Arc<AppState>>) -> Json<Vec<Position>> {
    let positions = state.positions.lock().unwrap();
    Json(positions.clone())
}

#[derive(Deserialize)]
struct ClosePositionRequest {
    id: String,
}

async fn handle_close_position(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ClosePositionRequest>,
) -> Json<HashMap<String, bool>> {
    let mut positions = state.positions.lock().unwrap();
    let mut success = false;

    if let Some(pos) = positions.iter().find(|p| p.id == payload.id) {
        success = true;
        let pnl_str = if pos.pnl_usd >= 0.0 {
            format!("+${:.2}", pos.pnl_usd)
        } else {
            format!("-${:.2}", pos.pnl_usd.abs())
        };

        let mut logs = state.bot_logs.lock().unwrap();
        logs.insert(0, format!(
            "[{}] 🚪 Closed position: {} (PnL: {})",
            now_secs(),
            pos.token_symbol,
            pnl_str
        ));
    }

    positions.retain(|p| p.id != payload.id);

    let mut res = HashMap::new();
    res.insert("success".to_string(), success);
    Json(res)
}

async fn handle_get_arbitrage(State(state): State<Arc<AppState>>) -> Json<Vec<ArbitrageOpp>> {
    let opps = state.arbitrage_opportunities.lock().unwrap();
    Json(opps.clone())
}

async fn handle_get_bot_logs(State(state): State<Arc<AppState>>) -> Json<Vec<String>> {
    let logs = state.bot_logs.lock().unwrap();
    Json(logs.clone())
}

// ─── Simulation Task ────────────────────────────────────────────────────────

async fn start_background_simulation(state: Arc<AppState>) {
    let mut interval = tokio::time::interval(std::time::Duration::from_millis(2000));
    loop {
        interval.tick().await;

        // 1. Update Prices
        let mut prices = state.current_prices.lock().unwrap();
        for (sym, price) in prices.iter_mut() {
            let volatility = if sym == "SOL" { 0.005 } else if sym == "BTC" { 0.002 } else { 0.03 };
            let change = (fastrand::f64() - 0.49) * volatility * *price;
            *price = (*price + change).max(0.000001);
        }

        let current_prices = prices.clone();
        drop(prices);

        // 2. Update Positions Current Price and PnL
        {
            let mut positions = state.positions.lock().unwrap();
            for pos in positions.iter_mut() {
                if let Some(curr_price) = current_prices.get(&pos.token_symbol) {
                    pos.current_price = *curr_price;
                    let pnl_pct = (pos.current_price / pos.entry_price - 1.0) * 100.0;
                    pos.pnl_pct = pnl_pct;
                    pos.pnl_usd = pos.size_usd * (pnl_pct / 100.0);
                }
            }
        }

        // 3. Match and Fill Limit Orders
        {
            let mut orders = state.orders.lock().unwrap();
            let mut positions = state.positions.lock().unwrap();
            let mut logs = state.bot_logs.lock().unwrap();
            let mut filled_indices = Vec::new();

            for (idx, order) in orders.iter_mut().enumerate() {
                if order.status != "Open" { continue; }

                if let Some(price) = current_prices.get(&order.token_symbol) {
                    let mut should_fill = false;

                    if order.order_type == "Limit Buy" && *price <= order.trigger_price {
                        should_fill = true;
                    } else if order.order_type == "Limit Sell" && *price >= order.trigger_price {
                        should_fill = true;
                    } else if order.order_type == "Take Profit" && *price >= order.trigger_price {
                        should_fill = true;
                    } else if order.order_type == "Stop Loss" && *price <= order.trigger_price {
                        should_fill = true;
                    }

                    if should_fill {
                        order.status = "Filled".to_string();
                        filled_indices.push(idx);

                        positions.push(Position {
                            id: format!("p_{}", now_ms()),
                            token_symbol: order.token_symbol.clone(),
                            size_usd: order.size_usd,
                            entry_price: *price,
                            current_price: *price,
                            pnl_usd: 0.0,
                            pnl_pct: 0.0,
                            created_at: now_secs(),
                        });

                        logs.insert(0, format!(
                            "[{}] 🚀 Filled order: {} {} at ${:.6}",
                            now_secs(),
                            order.order_type,
                            order.token_symbol,
                            price
                        ));
                    }
                }
            }

            for idx in filled_indices.into_iter().rev() {
                orders.remove(idx);
            }
        }

        // 4. Generate Arbitrage Opportunities
        {
            let mut opps = state.arbitrage_opportunities.lock().unwrap();
            opps.clear();

            let dexes = vec!["Raydium", "Orca", "Meteora"];
            let symbols = vec!["WIF", "BONK", "POPCAT", "SOL"];

            for sym in symbols {
                if let Some(base_price) = current_prices.get(sym) {
                    let diff = base_price * (0.005 + fastrand::f64() * 0.02);
                    let is_buy_raydium = fastrand::bool();
                    let (buy_dex, sell_dex, buy_price, sell_price) = if is_buy_raydium {
                        (dexes[0], dexes[1], *base_price - diff/2.0, *base_price + diff/2.0)
                    } else {
                        (dexes[1], dexes[2], *base_price - diff/2.0, *base_price + diff/2.0)
                    };

                    let profit_pct = (sell_price / buy_price - 1.0) * 100.0;
                    let size_usd = 2000.0 + fastrand::f64() * 8000.0;

                    opps.push(ArbitrageOpp {
                        id: format!("arb_{}", now_ms()),
                        token_symbol: sym.to_string(),
                        buy_dex: buy_dex.to_string(),
                        sell_dex: sell_dex.to_string(),
                        buy_price,
                        sell_price,
                        profit_pct,
                        expected_profit_usd: size_usd * (profit_pct / 100.0),
                        timestamp: now_secs(),
                    });
                }
            }
        }

        // 5. Add random scanner bot logs
        {
            let mut logs = state.bot_logs.lock().unwrap();
            let random = fastrand::u8(0..10);
            if random == 0 {
                logs.insert(0, format!("[{}] ⚡ New token pair detected on Raydium. Scanning safety...", now_secs()));
            } else if random == 1 {
                logs.insert(0, format!("[{}] 🛡 Liquidity lock audit: PASS", now_secs()));
            } else if random == 2 {
                logs.insert(0, format!("[{}] 🔎 Scanning Solana mempool for large orders...", now_secs()));
            } else if random == 3 {
                logs.insert(0, format!("[{}] 💎 Whale wallet copy-trade triggered.", now_secs()));
            }
            if logs.len() > 50 {
                logs.truncate(50);
            }
        }
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = Arc::new(AppState::default());

    let state_clone = Arc::clone(&state);
    tokio::spawn(async move {
        start_background_simulation(state_clone).await;
    });

    let app = Router::new()
        .route("/api/health", get(handle_health))
        .route("/api/quote", post(handle_quote))
        .route("/api/swap", post(handle_swap))
        .route("/api/price-history/:mint", get(handle_price_history))
        .route("/api/analytics/:mint", get(handle_token_analytics))
        .route("/api/portfolio", post(handle_portfolio))
        .route("/api/leaderboard", get(handle_leaderboard))
        // Orders API
        .route("/api/orders", get(handle_get_orders).post(handle_create_order))
        .route("/api/orders/cancel", post(handle_cancel_order))
        // Positions API
        .route("/api/positions", get(handle_get_positions))
        .route("/api/positions/close", post(handle_close_position))
        // Arbitrage and Live Logs
        .route("/api/arbitrage", get(handle_get_arbitrage))
        .route("/api/bot/logs", get(handle_get_bot_logs))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🔪 Blade Backend v0.5.0 listening on {}", addr);
    println!("   Endpoints: /api/health | /api/quote | /api/swap");
    println!("             /api/price-history/:mint | /api/analytics/:mint");
    println!("             /api/portfolio | /api/leaderboard");
    println!("             /api/orders | /api/orders/cancel | /api/positions | /api/positions/close");
    println!("             /api/arbitrage | /api/bot/logs");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
