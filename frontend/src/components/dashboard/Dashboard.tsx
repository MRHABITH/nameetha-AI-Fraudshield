"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Shield, Zap, Activity, DollarSign, AlertTriangle, Clock, Cpu, TrendingUp, WifiOff, CheckCircle2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { api, type DashboardMetrics } from "@/lib/api";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// ── Empty chart configs ───────────────────────────────────────────────────────

const emptyBarOption = {
    backgroundColor: "transparent",
    tooltip: { show: false },
    grid: { top: 32, right: 16, bottom: 24, left: 50 },
    xAxis: { type: "category", data: Array.from({ length: 12 }, (_, i) => `${(i * 2).toString().padStart(2, "0")}:00`), axisLine: { lineStyle: { color: "hsl(220,15%,16%)" } }, axisLabel: { color: "hsl(215,14%,30%)", fontSize: 10 } },
    yAxis: { type: "value", axisLabel: { color: "hsl(215,14%,30%)", fontSize: 10 }, splitLine: { lineStyle: { color: "hsl(220,15%,12%)" } } },
    series: [
        { name: "Safe", type: "bar", stack: "total", data: new Array(12).fill(0), itemStyle: { color: "hsl(195,100%,50%,0.15)" } },
        { name: "Fraud", type: "bar", stack: "total", data: new Array(12).fill(0), itemStyle: { color: "hsl(0,85%,55%,0.15)" } },
    ],
};

const emptyDonutOption = {
    backgroundColor: "transparent",
    series: [{ type: "pie", radius: ["50%", "75%"], center: ["50%", "50%"], data: [{ name: "No Data", value: 1, itemStyle: { color: "hsl(220,15%,14%)" } }], label: { show: false } }],
};

// ── Risk badge ───────────────────────────────────────────────────────────────

function getRiskBadge(level: string) {
    const cls =
        level === "critical" ? "badge-fraud" :
            level === "high" ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-900/50 text-orange-400 border border-orange-500/30" :
                level === "medium" ? "badge-warning" : "badge-safe";
    return <span className={cls}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [online, setOnline] = useState<boolean | null>(null); // null = checking
    const [mounted, setMounted] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchMetrics = async () => {
        const data = await api.metrics();
        if (data) {
            setMetrics(data);
            setOnline(true);
            setUpdatedAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
        } else {
            setOnline(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        timerRef.current = setInterval(fetchMetrics, 2000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const m = metrics;

    const statCards = [
        { label: "Total Transactions", value: m ? m.totalTransactions.toLocaleString("en-US") : "—", sub: "Last 24 hours", icon: Activity, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
        { label: "Fraud Blocked", value: m ? m.fraudBlocked.toLocaleString("en-US") : "—", sub: m ? `${m.fraudRate}% fraud rate` : "Awaiting data", icon: Shield, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
        { label: "Avg Latency", value: m ? `${m.avgLatencyMs}ms` : "—", sub: "< 200ms target", icon: Clock, color: "text-safe-500", bg: "bg-safe-600/10 border-safe-500/20" },
        { label: "Volume Processed", value: m ? `$${m.totalVolumeUsd}M` : "—", sub: "USD equivalent", icon: DollarSign, color: "text-accent", bg: "bg-accent/10 border-accent/20" },
        { label: "Active Alerts", value: m ? m.activeAlerts.toString() : "0", sub: m ? "Require review" : "No open alerts", icon: AlertTriangle, color: "text-warning-500", bg: "bg-warning-50/10 border-warning-500/20" },
        { label: "Stream Throughput", value: m ? `${m.streamingThroughput.toLocaleString("en-US")}/s` : "—", sub: "Transactions/sec", icon: Zap, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
        { label: "Models Online", value: m ? `${m.modelsOnline}/4` : "—", sub: "XGB, LGB, ISO, AE", icon: Cpu, color: "text-accent", bg: "bg-accent/10 border-accent/20" },
        { label: "Fraud Savings", value: m ? `$${m.fraudSavingsM}M` : "—", sub: "Estimated today", icon: TrendingUp, color: "text-safe-500", bg: "bg-safe-600/10 border-safe-500/20" },
    ];

    const barOption = m ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", backgroundColor: "hsl(220,18%,10%)", borderColor: "hsl(220,15%,16%)", textStyle: { color: "hsl(210,20%,92%)", fontSize: 12 } },
        legend: { data: ["Safe", "Fraud"], textStyle: { color: "hsl(215,14%,50%)", fontSize: 11 }, top: 0 },
        grid: { top: 32, right: 16, bottom: 24, left: 50 },
        xAxis: { type: "category", data: m.hourlyData.map(d => d.hour), axisLine: { lineStyle: { color: "hsl(220,15%,16%)" } }, axisLabel: { color: "hsl(215,14%,50%)", fontSize: 10 } },
        yAxis: { type: "value", axisLabel: { color: "hsl(215,14%,50%)", fontSize: 10 }, splitLine: { lineStyle: { color: "hsl(220,15%,14%)" } } },
        series: [
            { name: "Safe", type: "bar", stack: "total", data: m.hourlyData.map(d => d.safe), itemStyle: { color: "hsl(195,100%,50%,0.6)" }, emphasis: { focus: "series" } },
            { name: "Fraud", type: "bar", stack: "total", data: m.hourlyData.map(d => d.fraud), itemStyle: { color: "hsl(0,85%,55%)" }, emphasis: { focus: "series" } },
        ],
    } : emptyBarOption;

    const donutOption = m ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "item", backgroundColor: "hsl(220,18%,10%)", borderColor: "hsl(220,15%,16%)", textStyle: { color: "hsl(210,20%,92%)", fontSize: 12 }, formatter: "{b}: {c} ({d}%)" },
        legend: { orient: "vertical", right: 0, top: "center", textStyle: { color: "hsl(215,14%,50%)", fontSize: 11 } },
        series: [{ type: "pie", radius: ["50%", "75%"], center: ["38%", "50%"], data: m.riskDistribution, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 15, shadowColor: "rgba(0,0,0,0.5)" } } }],
    } : emptyDonutOption;

    const isLive = online === true;
    const isOffline = online === false;

    return (
        <div className="space-y-5">
            {/* Status Banner */}
            {isOffline && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-yellow-500/20 bg-yellow-900/10">
                    <WifiOff className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-yellow-400">Backend not connected</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Start the FastAPI backend — charts will populate automatically.
                        </p>
                    </div>
                    <code className="hidden sm:block text-[10px] font-mono bg-secondary px-2 py-1 rounded border border-border text-muted-foreground flex-shrink-0">
                        cd backend && python main.py
                    </code>
                </div>
            )}
            {isLive && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/20 bg-green-900/10">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-400 font-medium">Live data streaming — auto-refreshing every 5 seconds</p>
                    {updatedAt && <span className="ml-auto text-[10px] font-mono text-muted-foreground">Updated {updatedAt}</span>}
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`glass-card-hover p-4 border ${card.bg}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${card.color}`} style={{ background: "rgba(255,255,255,0.04)" }}>
                                    <Icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                                <span className={`text-[10px] font-mono ${card.color} ${isLive ? "opacity-80" : "opacity-40"}`}>
                                    {isLive ? "LIVE" : "IDLE"}
                                </span>
                            </div>
                            <p className={`text-xl sm:text-2xl font-bold ${card.color} ${!m ? "opacity-40" : ""}`}>{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{card.sub}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Hourly Transaction Volume</p>
                            <p className="text-xs text-muted-foreground">Safe vs Fraud (last 24h)</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isLive ? "badge-safe" : "bg-secondary border border-border text-muted-foreground"}`}>
                            {isLive ? <><span className="status-dot live" /> Live</> : "No Data"}
                        </span>
                    </div>
                    {mounted && <ReactECharts option={barOption} style={{ height: "200px" }} notMerge />}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
                    <p className="text-sm font-semibold text-foreground mb-1">Risk Distribution</p>
                    <p className="text-xs text-muted-foreground mb-4">{isLive ? "Transaction risk levels today" : "Awaiting live transactions"}</p>
                    {mounted && <ReactECharts option={donutOption} style={{ height: "200px" }} notMerge />}
                    {!m && <p className="text-xs text-muted-foreground/50 text-center mt-2">No transactions processed yet</p>}
                </motion.div>
            </div>

            {/* Live Transaction Feed */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Live Transaction Feed</p>
                        <p className="text-xs text-muted-foreground">Real-time AI-scored transactions</p>
                    </div>
                    {updatedAt ? (
                        <span className="text-[10px] font-mono text-muted-foreground">Updated: {updatedAt}</span>
                    ) : (
                        <span className="text-[10px] font-mono text-muted-foreground/60">No data</span>
                    )}
                </div>

                {m ? (
                    <div className="overflow-x-auto">
                        <LiveTransactionTable />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                            <Activity className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-muted-foreground">No transactions in stream</p>
                        <p className="text-xs text-muted-foreground/50 text-center max-w-xs">Connect the backend to see real-time fraud-scored transactions here.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ── Live Transaction sub-component ─────────────────────────────────────────────
function LiveTransactionTable() {
    const [txns, setTxns] = useState<import("@/lib/api").Transaction[]>([]);

    useEffect(() => {
        const load = async () => {
            const data = await api.transactions(10);
            if (data) setTxns(data.transactions);
        };
        load();
        const id = setInterval(load, 3000);
        return () => clearInterval(id);
    }, []);

    if (!txns.length) return (
        <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">Loading transactions…</div>
    );

    return (
        <table className="w-full data-table">
            <thead>
                <tr>
                    <th>Transaction ID</th><th>Card</th><th>Merchant</th>
                    <th>Amount</th><th>Location</th><th>Risk Score</th><th>Risk</th><th>Status</th>
                </tr>
            </thead>
            <tbody>
                {txns.map((tx) => (
                    <tr key={tx.id}>
                        <td className="font-mono text-xs text-primary">{tx.id}</td>
                        <td className="font-mono text-xs">{tx.maskedPan}</td>
                        <td>
                            <p className="text-xs font-medium">{tx.merchant.name}</p>
                            <p className="text-[10px] text-muted-foreground">{tx.merchant.category}</p>
                        </td>
                        <td className="font-mono text-xs font-semibold">{tx.currency} {tx.amount.toFixed(2)}</td>
                        <td className="text-xs text-muted-foreground">{tx.device.location}</td>
                        <td>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden w-14">
                                    <div className="h-full rounded-full" style={{ width: `${tx.riskScore * 100}%`, backgroundColor: tx.riskScore > 0.75 ? "hsl(0,85%,55%)" : tx.riskScore > 0.45 ? "hsl(38,95%,55%)" : "hsl(195,100%,50%)" }} />
                                </div>
                                <span className="font-mono text-xs">{(tx.riskScore * 100).toFixed(0)}%</span>
                            </div>
                        </td>
                        <td>
                            <span className={`text-xs font-semibold capitalize ${tx.riskLevel === "critical" ? "text-red-400" : tx.riskLevel === "high" ? "text-orange-400" : tx.riskLevel === "medium" ? "text-yellow-400" : "text-green-400"}`}>
                                {tx.riskLevel}
                            </span>
                        </td>
                        <td>
                            <span className={`text-xs font-medium capitalize ${tx.status === "blocked" ? "text-destructive" : tx.status === "reviewing" ? "text-warning-500" : "text-safe-500"}`}>
                                {tx.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
