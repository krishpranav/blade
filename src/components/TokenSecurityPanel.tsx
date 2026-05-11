import React, { memo } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";

export const TokenSecurityPanel = memo(function TokenSecurityPanel({ tokenSymbol = "TOKEN" }: { tokenSymbol?: string }) {
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
    <div className="rounded-sm border border-neutral-800 bg-black p-4 shadow-none">
      <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-2">
        <h3 className="font-display flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          {overallSafe ? <ShieldCheck className="h-3 w-3 text-bull" /> : <ShieldAlert className="h-3 w-3 text-bear" />}
          Security Audit
        </h3>
        <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${overallSafe ? "bg-bull/10 text-bull border-bull/20" : "bg-bear/10 text-bear border-bear/20"}`}>
          {overallSafe ? "Low Risk" : "High Risk"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
        {/* Mint Authority */}
        <div className={`flex items-center justify-between rounded-sm border border-neutral-800 p-2 ${getStatusBg(mockSecurityData.mintAuthorityRevoked)}`}>
          <span className="text-neutral-500">Mint Auth</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.mintAuthorityRevoked)}`}>
            {mockSecurityData.mintAuthorityRevoked ? "Revoked" : "Active"}
          </span>
        </div>

        {/* Freeze Authority */}
        <div className={`flex items-center justify-between rounded-sm border border-neutral-800 p-2 ${getStatusBg(mockSecurityData.freezeAuthorityRevoked)}`}>
          <span className="text-neutral-500">Freeze Auth</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.freezeAuthorityRevoked)}`}>
            {mockSecurityData.freezeAuthorityRevoked ? "Revoked" : "Active"}
          </span>
        </div>

        {/* LP Locked */}
        <div className={`flex items-center justify-between rounded-sm border border-neutral-800 p-2 ${getStatusBg(mockSecurityData.lpLocked)}`}>
          <span className="text-neutral-500">LP Status</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.lpLocked)}`}>
            {mockSecurityData.lpLocked ? `${mockSecurityData.lpLockPercentage}% Locked` : "Unlocked"}
          </span>
        </div>

        {/* Top 10 Holders */}
        <div className={`flex items-center justify-between rounded-sm border border-neutral-800 p-2 ${getStatusBg(mockSecurityData.top10HoldersPercentage < 30)}`}>
          <span className="text-neutral-500">Top 10</span>
          <span className={`font-semibold ${getStatusColor(mockSecurityData.top10HoldersPercentage < 30)}`}>
            {mockSecurityData.top10HoldersPercentage}%
          </span>
        </div>
      </div>

      {/* Warnings */}
      {(!overallSafe || mockSecurityData.top10HoldersPercentage >= 15) && (
        <div className="mt-3 flex items-start gap-2 rounded-sm bg-amber-500/10 p-2.5 text-[10px] text-amber-500 border border-amber-500/20">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <p>
            {mockSecurityData.top10HoldersPercentage >= 15 
              ? `Top 10 wallets hold a significant portion (${mockSecurityData.top10HoldersPercentage}%) of the supply.`
              : "This token has failed one or more critical security checks."}
          </p>
        </div>
      )}
    </div>
  );
});
