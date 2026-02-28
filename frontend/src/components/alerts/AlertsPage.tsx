"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, WifiOff, CheckCircle2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { api, type Alert } from "@/lib/api";

function statusBadge(s: string) {
    if (s === "open") return <span className="badge-fraud">OPEN</span>;
    if (s === "investigating") return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-900/50 text-yellow-400 border border-yellow-500/30">INVESTIGATING</span>;
    if (s === "closed_fraud") return <span className="badge-fraud">CLOSED FRAUD</span>;
    return <span className="badge-safe">CLOSED SAFE</span>;
}

function riskColor(level: string) {
    return level === "critical" ? "text-red-400" : level === "high" ? "text-orange-400" : level === "medium" ? "text-yellow-400" : "text-green-400";
}

const FILTERS = ["All", "Open", "Investigating", "Closed Fraud", "Closed Safe"] as const;
const STATUS_MAP: Record<string, string> = { "Open": "open", "Investigating": "investigating", "Closed Fraud": "closed_fraud", "Closed Safe": "closed_safe" };

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [online, setOnline] = useState<boolean | null>(null);
    const [selected, setSelected] = useState<Alert | null>(null);
    const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
    const [loading, setLoading] = useState(false);

    const fetchAlerts = async () => {
        const data = await api.alerts(20);
        if (data) { setAlerts(data.alerts); setOnline(true); }
        else setOnline(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchAlerts().finally(() => setLoading(false));
        const id = setInterval(fetchAlerts, 5000);
        return () => clearInterval(id);
    }, []);

    const filtered = filter === "All" ? alerts : alerts.filter(a => a.status === STATUS_MAP[filter]);

    return (
        <div className="flex flex-col lg:flex-row gap-5 min-h-0">
            {/* Left panel */}
            <div className="flex-1 min-w-0 space-y-3">
                {/* Banner */}
                {online === false && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/20 bg-yellow-900/10">
                        <WifiOff className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <p className="text-xs text-yellow-400">Backend not connected — start FastAPI to receive live alerts</p>
                    </div>
                )}
                {online === true && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/20 bg-green-900/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-400 font-medium">Live alerts — auto-refreshing every 15 seconds</p>
                        <button onClick={fetchAlerts} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Filter bar */}
                <div className="glass-card p-3 flex items-center gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filter === f ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                            {f}
                            {f !== "All" && alerts.length > 0 && (
                                <span className="ml-1.5 text-[9px] opacity-60">
                                    ({alerts.filter(a => a.status === STATUS_MAP[f]).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading && !alerts.length ? (
                    <div className="glass-card p-10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                            <AlertOctagon className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-muted-foreground">{online ? "No alerts match this filter" : "No active alerts"}</p>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filtered.map((alert, i) => (
                                <motion.div key={alert.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    onClick={() => setSelected(alert)}
                                    className={`glass-card p-4 cursor-pointer hover:border-primary/30 transition-all ${selected?.id === alert.id ? "border-primary/40 bg-primary/5" : ""}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.priority === "critical" ? "bg-red-900/30" : alert.priority === "high" ? "bg-orange-900/30" : "bg-yellow-900/30"}`}>
                                            <AlertOctagon className={`w-4 h-4 ${alert.priority === "critical" ? "text-red-400" : alert.priority === "high" ? "text-orange-400" : "text-yellow-400"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-primary font-mono">{alert.id}</span>
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary border border-border text-muted-foreground">{alert.type}</span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground mt-1 truncate">
                                                {alert.transaction.merchant.name} — {alert.transaction.currency} {alert.transaction.amount.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {alert.transaction.maskedPan} · {alert.transaction.device.location} · {new Date(alert.createdAt).toLocaleString("en-US")}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                            {statusBadge(alert.status)}
                                            <span className={`text-xs font-semibold font-mono ${riskColor(alert.transaction.riskLevel)}`}>
                                                Risk: {(alert.riskScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Detail panel */}
            <div className="w-full lg:w-96 flex-shrink-0">
                {selected ? (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} key={selected.id} className="glass-card p-5 space-y-5 sticky top-0">
                        <div className="flex items-center gap-2 border-b border-border pb-4">
                            <ShieldAlert className="w-5 h-5 text-destructive" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{selected.id}</p>
                                <p className="text-xs text-muted-foreground">{selected.type}</p>
                            </div>
                            {statusBadge(selected.status)}
                        </div>

                        <div className="space-y-2">
                            {[
                                ["Merchant", selected.transaction.merchant.name],
                                ["Amount", `${selected.transaction.currency} ${selected.transaction.amount.toFixed(2)}`],
                                ["Card", selected.transaction.maskedPan],
                                ["Location", selected.transaction.device.location],
                                ["IP", selected.transaction.device.ipAddress],
                                ["Time", new Date(selected.transaction.timestamp).toLocaleString("en-US")],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
                                    <span className="text-xs text-muted-foreground flex-shrink-0">{k}</span>
                                    <span className="text-xs text-foreground font-mono text-right truncate">{v}</span>
                                </div>
                            ))}
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Model Scores</p>
                            {Object.entries(selected.modelScores).map(([name, score]) => (
                                <div key={name} className="mb-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                                        <span className={`font-mono font-semibold ${(score as number) >= 0.72 ? "text-red-400" : (score as number) >= 0.45 ? "text-yellow-400" : "text-green-400"}`}>
                                            {((score as number) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(score as number) * 100}%`, backgroundColor: (score as number) >= 0.72 ? "#ef4444" : (score as number) >= 0.45 ? "#f59e0b" : "#22c55e" }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 text-xs font-semibold hover:bg-destructive/20 transition-colors">
                                <ShieldAlert className="w-3.5 h-3.5" /> Confirm Fraud
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-900/10 text-green-400 border border-green-500/30 text-xs font-semibold hover:bg-green-900/20 transition-colors">
                                <ShieldCheck className="w-3.5 h-3.5" /> Mark Safe
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center h-48">
                        <AlertOctagon className="w-10 h-10 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">Select an alert to investigate</p>
                    </div>
                )}
            </div>
        </div>
    );
}
