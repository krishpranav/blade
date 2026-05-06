import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";

export function TokenSecurityPanel({ tokenSymbol = "TOKEN" }) {
  // In a real app, this data would come from a security API like RugCheck or GoPlus
  const mockSecurityData = {
    mintAuthorityRevoked: true,
    freezeAuthorityRevoked: true,
    lpLocked: true,
    lpLockPercentage: 98.5,
    top10HoldersPercentage: 12.4,
    isHoneypot: false,
    taxes: { buy: 0, sell: 0 },
  };

  const getStatusColor = (isSafe: boolean) => (isSafe ? "text-bull" : "text-bear");
  const getStatusBg = (isSafe: boolean) => (isSafe ? "bg-bull/10" : "bg-bear/10");

  const overallSafe = 
    mockSecurityData.mintAuthorityRevoked && 
    mockSecurityData.freezeAuthorityRevoked && 
    mockSecurityData.lpLocked &&
    mockSecurityData.top10HoldersPercentage < 30 &&
    !mockSecurityData.isHoneypot;

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
        <h3 className="font-display flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {overallSafe ? <ShieldCheck className="h-4 w-4 text-bull" /> : <ShieldAlert className="h-4 w-4 text-bear" />}
          Security Audit
        </h3>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${overallSafe ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
          {overallSafe ? "Low Risk" : "High Risk"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Mint Authority */}
        <div className={`flex items-center justify-between rounded-lg border border-border/50 p-2 ${getStatusBg(mockSecurityData.mintAuthorityRevoked)}`}>
          <span className="text-muted-foreground">Mint Auth</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.mintAuthorityRevoked)}`}>
            {mockSecurityData.mintAuthorityRevoked ? "Revoked" : "Active"}
          </span>
        </div>

        {/* Freeze Authority */}
        <div className={`flex items-center justify-between rounded-lg border border-border/50 p-2 ${getStatusBg(mockSecurityData.freezeAuthorityRevoked)}`}>
          <span className="text-muted-foreground">Freeze Auth</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.freezeAuthorityRevoked)}`}>
            {mockSecurityData.freezeAuthorityRevoked ? "Revoked" : "Active"}
          </span>
        </div>

        {/* LP Locked */}
        <div className={`flex items-center justify-between rounded-lg border border-border/50 p-2 ${getStatusBg(mockSecurityData.lpLocked)}`}>
          <span className="text-muted-foreground">LP Status</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.lpLocked)}`}>
            {mockSecurityData.lpLocked ? `${mockSecurityData.lpLockPercentage}% Locked` : "Unlocked"}
          </span>
        </div>

        {/* Top 10 Holders */}
        <div className={`flex items-center justify-between rounded-lg border border-border/50 p-2 ${getStatusBg(mockSecurityData.top10HoldersPercentage < 30)}`}>
          <span className="text-muted-foreground">Top 10 Held</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.top10HoldersPercentage < 30)}`}>
            {mockSecurityData.top10HoldersPercentage}%
          </span>
        </div>
      </div>

      {/* Warnings */}
      {(!overallSafe || mockSecurityData.top10HoldersPercentage >= 15) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-[10px] text-amber-500">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <p>
            {mockSecurityData.top10HoldersPercentage >= 15 
              ? `Top 10 wallets hold a significant portion (${mockSecurityData.top10HoldersPercentage}%) of the supply. Trade with caution.`
              : "This token has failed one or more critical security checks. Sniping or trading this token carries high risk."}
          </p>
        </div>
      )}
    </div>
  );
}
