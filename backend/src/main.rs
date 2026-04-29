use axum::{
    extract::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;

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
}

#[derive(Deserialize)]
struct SwapRequest {
    input_mint: String,
    output_mint: String,
    amount: f64,
    slippage: f64,
}

#[derive(Serialize)]
struct SwapResponse {
    signature: String,
    status: String,
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(|| async { "OK" }))
        .route("/api/quote", post(handle_quote))
        .route("/api/swap", post(handle_swap))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Backend listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn handle_quote(Json(payload): Json<QuoteRequest>) -> Json<QuoteResponse> {
    // Simulate a quote calculation
    // In a real app, this would query a DEX like Raydium or Jupiter
    let simulated_price = 0.005; // mock price
    let expected = payload.amount * simulated_price;
    let impact = 0.01; // 1%
    let min_rec = expected * (1.0 - (payload.slippage / 100.0) - impact);
    
    Json(QuoteResponse {
        expected_output: expected,
        minimum_received: min_rec,
        price_impact: impact,
        fee: payload.amount * 0.001,
        route: vec![payload.input_mint, "Raydium".to_string(), payload.output_mint],
    })
}

async fn handle_swap(Json(_payload): Json<SwapRequest>) -> Json<SwapResponse> {
    // Simulate a swap execution
    Json(SwapResponse {
        signature: "4x...simulated_tx_signature...".to_string(),
        status: "confirmed".to_string(),
    })
}
