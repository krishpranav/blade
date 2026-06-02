import React, { useState, useEffect, useCallback, memo } from "react";
import { Bell, BellOff, Plus, Trash2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { fmtUsd } from "@/lib/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBackendAlert, deleteBackendAlert, getBackendAlerts } from "@/server/solana";

type AlertCondition = "above" | "below" | "pct_gain" | "pct_loss";

type PriceAlert = {
  id: string;
  tokenSymbol: string;
  condition: AlertCondition;
  targetValue: number;
  baselinePrice: number;
  triggered: boolean;
  createdAt: number;
  note?: string;
};

type AlertEngineProps = {
  tokenSymbol: string;
  currentPriceUsd: number;
};

const CONDITION_LABELS: Record<AlertCondition, string> = {
  above: "Price Above",
  below: "Price Below",
  pct_gain: "% Gain ≥",
  pct_loss: "% Loss ≥",
};

export const AlertsEngine = memo(function AlertsEngine({
  tokenSymbol,
  currentPriceUsd,
}: AlertEngineProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [condition, setCondition] = useState<AlertCondition>("above");
  const [targetValue, setTargetValue] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setTriggeredIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ["backend-alerts"],
    queryFn: () => getBackendAlerts(),
    refetchInterval: 5_000,
  });

  useEffect(() => {
    if (!alertsQuery.data) return;
    const mapped = alertsQuery.data
      .filter((alert) => alert.token_symbol === tokenSymbol)
      .map((alert) => ({
        id: alert.id,
        tokenSymbol: alert.token_symbol,
        condition: alert.condition,
        targetValue: alert.target_value,
        baselinePrice: alert.baseline_price,
        triggered: alert.triggered,
        createdAt: alert.created_at,
        note: alert.note,
      }));
    setAlerts(mapped);
  }, [alertsQuery.data, tokenSymbol]);

  const createAlertMutation = useMutation({
    mutationFn: (alert: Omit<PriceAlert, "id" | "createdAt" | "triggered">) =>
      createBackendAlert({
        token_symbol: alert.tokenSymbol,
        condition: alert.condition,
        target_value: alert.targetValue,
        baseline_price: alert.baselinePrice,
        note: alert.note,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backend-alerts"] }),
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => deleteBackendAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backend-alerts"] }),
  });

  // Real-time alert evaluation engine
  useEffect(() => {
    if (!currentPriceUsd || alerts.length === 0) return;

    const triggeredNow: string[] = [];

    alerts.forEach((alert) => {
      if (alert.triggered) return;
      let shouldTrigger = false;

      switch (alert.condition) {
        case "above":
          shouldTrigger = currentPriceUsd >= alert.targetValue;
          break;
        case "below":
          shouldTrigger = currentPriceUsd <= alert.targetValue;
          break;
        case "pct_gain":
          shouldTrigger = currentPriceUsd >= alert.baselinePrice * (1 + alert.targetValue / 100);
          break;
        case "pct_loss":
          shouldTrigger = currentPriceUsd <= alert.baselinePrice * (1 - alert.targetValue / 100);
          break;
      }

      if (shouldTrigger) {
        triggeredNow.push(alert.id);
        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`🔔 Blade Alert: ${alert.tokenSymbol}`, {
            body: `${CONDITION_LABELS[alert.condition]} ${
              alert.condition.startsWith("pct")
                ? alert.targetValue + "%"
                : fmtUsd(alert.targetValue)
            }. Current: ${fmtUsd(currentPriceUsd)}. ${alert.note ?? ""}`,
            icon: "/favicon.ico",
          });
        }
      }
    });

    if (triggeredNow.length > 0) {
      setTriggeredIds((prev) => new Set([...prev, ...triggeredNow]));
      setAlerts((prev) =>
        prev.map((a) => ({
          ...a,
          triggered: triggeredNow.includes(a.id) ? true : a.triggered,
        })),
      );
    }
  }, [currentPriceUsd, alerts]);

  const requestNotifPermission = useCallback(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const addAlert = useCallback(() => {
    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) return;

    const newAlert = {
      tokenSymbol,
      condition,
      targetValue: value,
      baselinePrice: currentPriceUsd || value,
      note: note.trim() || undefined,
    };
    createAlertMutation.mutate(newAlert);
    setTargetValue("");
    setNote("");
  }, [condition, createAlertMutation, targetValue, note, tokenSymbol, currentPriceUsd]);

  const removeAlert = useCallback(
    (id: string) => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      deleteAlertMutation.mutate(id);
    },
    [deleteAlertMutation],
  );

  const activeCount = alerts.filter((a) => !a.triggered).length;
  const triggeredCount = alerts.filter((a) => a.triggered).length;

  return (
    <div className="rounded-sm border border-neutral-800 bg-black shadow-none">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between border-b border-neutral-800 px-4 py-2.5 hover:bg-[#0a0a0a] transition-none"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-violet" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Price Alerts
          </span>
          {activeCount > 0 && (
            <span className="rounded-sm bg-violet/20 border border-violet/30 px-1.5 py-0.5 text-[9px] font-bold text-violet">
              {activeCount} ACTIVE
            </span>
          )}
          {triggeredCount > 0 && (
            <span className="rounded-sm bg-bull/20 border border-bull/30 px-1.5 py-0.5 text-[9px] font-bold text-bull">
              {triggeredCount} FIRED
            </span>
          )}
        </div>
        <span className="text-[10px] text-neutral-600">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Create Alert Form */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AlertCondition)}
                  className="mt-1 w-full rounded-sm border border-neutral-800 bg-[#0a0a0a] px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet/50"
                >
                  {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                  Target {condition.startsWith("pct") ? "%" : "USD"}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={
                    condition.startsWith("pct") ? "e.g. 20" : fmtUsd(currentPriceUsd * 1.1)
                  }
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-neutral-800 bg-[#0a0a0a] px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Optional note (e.g. Take profit zone)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-sm border border-neutral-800 bg-[#0a0a0a] px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-neutral-700 focus:border-violet/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addAlert}
                disabled={!targetValue || createAlertMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-violet/20 border border-violet/30 py-2 text-[10px] font-bold uppercase tracking-wider text-violet hover:bg-violet hover:text-white transition-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" /> Set Alert
              </button>
              <button
                onClick={requestNotifPermission}
                className="rounded-sm border border-neutral-800 px-3 py-2 text-[10px] text-neutral-500 hover:text-white hover:border-neutral-600 transition-none"
              >
                Enable Push
              </button>
            </div>
          </div>

          {/* Alert List */}
          {alerts.length > 0 && (
            <div className="space-y-1 border-t border-neutral-900 pt-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between rounded-sm border px-3 py-2 ${
                    alert.triggered ? "border-bull/20 bg-bull/5" : "border-neutral-800 bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.triggered ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-bull shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-violet shrink-0" />
                    )}
                    <div>
                      <div className="text-[10px] font-semibold text-white">
                        {CONDITION_LABELS[alert.condition]}{" "}
                        <span className="font-mono text-violet">
                          {alert.condition.startsWith("pct")
                            ? alert.targetValue + "%"
                            : fmtUsd(alert.targetValue)}
                        </span>
                      </div>
                      {alert.note && (
                        <div className="text-[9px] text-neutral-600">{alert.note}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-neutral-700 hover:text-bear transition-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {alerts.length === 0 && (
            <div className="py-4 text-center text-[10px] uppercase tracking-widest text-neutral-700">
              No alerts set for {tokenSymbol}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
