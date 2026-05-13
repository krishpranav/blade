import React, { useState } from "react";
import { XCircle, ExternalLink, ShieldAlert } from "lucide-react";
import { fmtUsd, shortAddr } from "@/lib/format";

type Position = {
  id: string;
  tokenSymbol: string;
  sizeUsd: number;
  entryPrice: number;
  currentPrice: number;
  pnlUsd: number;
  pnlPct: number;
};

type Order = {
  id: string;
  tokenSymbol: string;
  type: "Limit Buy" | "Limit Sell" | "Take Profit" | "Stop Loss";
  triggerPrice: number;
  sizeUsd: number;
  status: "Open" | "Filled" | "Cancelled";
};

export function PositionManager() {
  const [activeTab, setActiveTab] = useState<"positions" | "orders">("positions");

  // Mock data
  const [positions, setPositions] = useState<Position[]>([
    { id: "1", tokenSymbol: "WIF", sizeUsd: 1250.00, entryPrice: 2.10, currentPrice: 2.45, pnlUsd: 208.33, pnlPct: 16.66 },
    { id: "2", tokenSymbol: "POPCAT", sizeUsd: 840.00, entryPrice: 0.45, currentPrice: 0.41, pnlUsd: -74.66, pnlPct: -8.88 }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: "o1", tokenSymbol: "WIF", type: "Take Profit", triggerPrice: 3.00, sizeUsd: 1250.00, status: "Open" },
    { id: "o2", tokenSymbol: "BONK", type: "Limit Buy", triggerPrice: 0.000015, sizeUsd: 500.00, status: "Open" }
  ]);

  const closePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const cancelOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  return (
    <div className="mt-4 flex flex-col rounded-sm border border-neutral-800 bg-[#0d0d0d] shadow-none contain-strict w-full">
      <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0a0a0a] px-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab("positions")}
            className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-widest transition-none border-b-2 ${
              activeTab === "positions" ? "border-violet text-white" : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            Open Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-widest transition-none border-b-2 ${
              activeTab === "orders" ? "border-violet text-white" : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            Active Orders ({orders.length})
          </button>
        </div>
        <button 
          onClick={() => setPositions([])}
          className="flex items-center gap-1.5 rounded-sm bg-bear/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-bear border border-bear/20 hover:bg-bear/20"
        >
          <ShieldAlert className="h-3 w-3" /> Panic Sell All
        </button>
      </div>

      <div className="overflow-x-auto min-h-[150px]">
        {activeTab === "positions" && (
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-[#050505] uppercase tracking-wider text-neutral-600 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium text-right">Size (USD)</th>
                <th className="px-4 py-2 font-medium text-right">Entry Price</th>
                <th className="px-4 py-2 font-medium text-right">Mark Price</th>
                <th className="px-4 py-2 font-medium text-right">Unrealized PnL</th>
                <th className="px-4 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {positions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-600">No open positions</td></tr>
              ) : (
                positions.map(p => (
                  <tr key={p.id} className="border-b border-neutral-900/50 hover:bg-[#111]">
                    <td className="px-4 py-2 font-semibold text-white">{p.tokenSymbol}</td>
                    <td className="px-4 py-2 text-right text-white">{fmtUsd(p.sizeUsd)}</td>
                    <td className="px-4 py-2 text-right text-neutral-400">{fmtUsd(p.entryPrice)}</td>
                    <td className="px-4 py-2 text-right text-neutral-400">{fmtUsd(p.currentPrice)}</td>
                    <td className={`px-4 py-2 text-right font-bold ${p.pnlUsd >= 0 ? "text-bull" : "text-bear"}`}>
                      {p.pnlUsd >= 0 ? "+" : ""}{fmtUsd(p.pnlUsd)} ({p.pnlPct.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => closePosition(p.id)} className="text-bear hover:text-white transition-colors">
                        <XCircle className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "orders" && (
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-[#050505] uppercase tracking-wider text-neutral-600 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium text-right">Trigger</th>
                <th className="px-4 py-2 font-medium text-right">Size (USD)</th>
                <th className="px-4 py-2 font-medium text-right">Status</th>
                <th className="px-4 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-600">No active orders</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} className="border-b border-neutral-900/50 hover:bg-[#111]">
                    <td className="px-4 py-2 font-semibold text-white">{o.tokenSymbol}</td>
                    <td className="px-4 py-2 text-violet">{o.type}</td>
                    <td className="px-4 py-2 text-right text-white">{fmtUsd(o.triggerPrice)}</td>
                    <td className="px-4 py-2 text-right text-neutral-400">{fmtUsd(o.sizeUsd)}</td>
                    <td className="px-4 py-2 text-right text-neutral-500">{o.status}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => cancelOrder(o.id)} className="text-neutral-500 hover:text-white transition-colors">
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
