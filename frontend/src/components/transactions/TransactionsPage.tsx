"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, WifiOff, Zap } from "lucide-react";
import { useLiveStream } from "@/hooks/useLiveStream";
import { api, type Transaction } from "@/lib/api";

export default function TransactionsPage() {
    const { transactions: streamTxns, connected } = useLiveStream(40);
    const [fallbackTxns, setFallbackTxns] = useState<Transaction[]>([]);
    const [fallbackLoaded, setFallbackLoaded] = useState(false);

    // While SSE isn't connected, fall back to polling
    useEffect(() => {
        if (connected) return;
        const load = async () => {
            const data = await api.transactions(20);
            if (data) { setFallbackTxns(data.transactions); setFallbackLoaded(true); }
        };
        load();
        const id = setInterval(load, 6000);
        return () => clearInterval(id);
    }, [connected]);

    const txns = connected ? streamTxns : fallbackTxns;
    const online = connected || fallbackLoaded;

    return (
        <div className="space-y-4">
            {/* Status banner */}
            {connected ? (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-green-500/25 bg-green-900/10">
                    <div className="relative flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" />
                    </div>
                    <p className="text-xs text-green-400 font-medium flex-1">
                        <span className="font-bold">SSE Stream Active</span> — new transactions arriving every 2 seconds in real time
                    </p>
                    <span className="text-[10px] font-mono text-green-400/60 flex-shrink-0">
                        {streamTxns.length} loaded
                    </span>
                </div>
            ) : online ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <p className="text-xs text-primary font-medium">Polling mode — refreshing every 6s (SSE connecting...)</p>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/20 bg-yellow-900/10">
                    <WifiOff className="w-3.5 h-3.5 text-yellow-500" />
                    <p className="text-xs text-yellow-400">Backend not connected — start FastAPI to stream transactions</p>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Transaction Stream</p>
                        <p className="text-xs text-muted-foreground">
                            {connected ? "Live SSE — new rows appear in real time" : "AI-scored transactions"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {connected && <Zap className="w-3.5 h-3.5 text-green-400" />}
                        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : online ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                        <span className="text-xs text-muted-foreground font-medium">
                            {connected ? "Live" : online ? "Polling" : "Offline"}
                        </span>
                    </div>
                </div>

                {txns.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full data-table">
                            <thead>
                                <tr>
                                    {["Transaction ID", "Card", "Merchant", "Amount", "Location", "MCC", "Risk Score", "Risk", "Status", "Time"].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence initial={false}>
                                    {txns.map((tx, i) => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0, backgroundColor: "hsl(142,76%,20%,0.4)" }}
                                            animate={{ opacity: 1, backgroundColor: "transparent" }}
                                            transition={{ duration: 0.6 }}
                                            className={i === 0 && connected ? "new-row" : ""}
                                        >
                                            <td className="font-mono text-xs text-primary">{tx.id}</td>
                                            <td className="font-mono text-xs">
                                                {"maskedPan" in tx
                                                    ? (tx as Transaction).maskedPan
                                                    : `**** **** **** ${String((tx as { id: string }).id).slice(-4)}`}
                                            </td>
                                            <td>
                                                <p className="text-xs font-medium truncate max-w-[120px]">
                                                    {"merchant" in tx
                                                        ? typeof tx.merchant === "string" ? tx.merchant : (tx as Transaction).merchant.name
                                                        : "—"}
                                                </p>
                                            </td>
                                            <td className="font-mono text-xs font-semibold">{tx.currency} {tx.amount.toFixed(2)}</td>
                                            <td className="text-xs text-muted-foreground">
                                                {"location" in tx ? (tx as { location: string }).location : "--"}
                                            </td>
                                            <td className="font-mono text-xs text-muted-foreground">
                                                {"merchant" in tx && typeof tx.merchant !== "string"
                                                    ? (tx as Transaction).merchant.mcc : "—"}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden w-12">
                                                        <div className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${tx.riskScore * 100}%`, backgroundColor: tx.riskScore > 0.75 ? "#ef4444" : tx.riskScore > 0.45 ? "#f59e0b" : "#22c55e" }} />
                                                    </div>
                                                    <span className={`font-mono text-xs font-semibold ${tx.riskScore > 0.75 ? "text-red-400" : tx.riskScore > 0.45 ? "text-yellow-400" : "text-green-400"}`}>
                                                        {(tx.riskScore * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`text-xs font-semibold capitalize ${tx.riskLevel === "critical" ? "text-red-400" : tx.riskLevel === "high" ? "text-orange-400" : tx.riskLevel === "medium" ? "text-yellow-400" : "text-green-400"}`}>
                                                    {tx.riskLevel}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`text-xs font-medium capitalize ${tx.status === "blocked" ? "text-destructive" : tx.status === "reviewing" ? "text-yellow-400" : "text-green-400"}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="font-mono text-[10px] text-muted-foreground">
                                                {new Date(tx.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                            <ArrowLeftRight className="w-7 h-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-muted-foreground">Connecting to transaction stream…</p>
                    </div>
                )}
            </div>
        </div>
    );
}
