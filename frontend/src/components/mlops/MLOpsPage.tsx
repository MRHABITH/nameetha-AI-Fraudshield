"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, RefreshCw, CheckCircle, AlertTriangle, TrendingUp, WifiOff, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import { api, type MLOpsData, type ModelInfo, type DagInfo } from "@/lib/api";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const emptyLine = {
    backgroundColor: "transparent",
    tooltip: { show: false },
    grid: { top: 32, right: 16, bottom: 24, left: 50 },
    xAxis: { type: "category", data: Array.from({ length: 9 }, (_, i) => `Day ${i + 1}`), axisLabel: { color: "hsl(215,14%,30%)", fontSize: 10 }, axisLine: { lineStyle: { color: "hsl(220,15%,16%)" } } },
    yAxis: { type: "value", min: 0.8, max: 1, axisLabel: { color: "hsl(215,14%,30%)", fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + "%" }, splitLine: { lineStyle: { color: "hsl(220,15%,12%)" } } },
    series: [
        { name: "AUC", type: "line", data: new Array(9).fill(null), lineStyle: { color: "hsl(195,100%,50%,0.2)", width: 2 } },
        { name: "Precision", type: "line", data: new Array(9).fill(null), lineStyle: { color: "hsl(265,85%,65%,0.2)", width: 2 } },
    ],
};

export default function MLOpsPage() {
    const [data, setData] = useState<MLOpsData | null>(null);
    const [online, setOnline] = useState<boolean | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const load = async () => {
        const d = await api.models();
        if (d) { setData(d); setOnline(true); }
        else setOnline(false);
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    const perfOption = data ? {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", backgroundColor: "hsl(220,18%,10%)", borderColor: "hsl(220,15%,16%)", textStyle: { color: "hsl(210,20%,92%)", fontSize: 12 } },
        legend: { data: ["AUC", "Precision", "Recall"], textStyle: { color: "hsl(215,14%,50%)", fontSize: 11 }, top: 0 },
        grid: { top: 32, right: 16, bottom: 24, left: 50 },
        xAxis: { type: "category", data: data.models[0].perfTrend.map(p => p.day), axisLabel: { color: "hsl(215,14%,50%)", fontSize: 10 }, axisLine: { lineStyle: { color: "hsl(220,15%,16%)" } } },
        yAxis: { type: "value", min: 0.85, max: 1, axisLabel: { color: "hsl(215,14%,50%)", fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + "%" }, splitLine: { lineStyle: { color: "hsl(220,15%,14%)" } } },
        series: [
            { name: "AUC", type: "line", smooth: true, data: data.models[0].perfTrend.map(p => p.auc), lineStyle: { color: "hsl(195,100%,50%)", width: 2 }, itemStyle: { color: "hsl(195,100%,50%)" }, areaStyle: { color: "hsl(195,100%,50%,0.08)" } },
            { name: "Precision", type: "line", smooth: true, data: data.models[0].perfTrend.map(p => p.precision), lineStyle: { color: "hsl(265,85%,65%)", width: 2 }, itemStyle: { color: "hsl(265,85%,65%)" } },
            { name: "Recall", type: "line", smooth: true, data: data.models[0].perfTrend.map(p => p.recall), lineStyle: { color: "hsl(38,95%,55%)", width: 2 }, itemStyle: { color: "hsl(38,95%,55%)" } },
        ],
    } : emptyLine;

    const dagColor = (s: string) =>
        s === "success" ? "bg-green-900/20 border-green-500/20 text-green-400" :
            s === "running" ? "bg-blue-900/20 border-blue-500/20 text-blue-400" :
                s === "failed" ? "bg-red-900/20 border-red-500/20 text-red-400" :
                    "bg-secondary border-border text-muted-foreground";

    return (
        <div className="space-y-5">
            {/* Banner */}
            {online === false && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/20 bg-yellow-900/10">
                    <WifiOff className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <p className="text-xs text-yellow-400">MLflow & backend not connected — model metrics will appear once running</p>
                </div>
            )}
            {online === true && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/20 bg-green-900/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <p className="text-xs text-green-400 font-medium">Model metrics live — refreshing every 30 seconds</p>
                    <button onClick={load} className="ml-auto text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-3 h-3" /></button>
                </div>
            )}

            {/* Model Registry */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Model Registry</p>
                        <p className="text-xs text-muted-foreground">{data ? `${data.models.length} models serving` : "Awaiting connection"}</p>
                    </div>
                    <button onClick={load} disabled={!online} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground text-xs hover:text-foreground transition-colors disabled:opacity-40">
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full data-table">
                        <thead>
                            <tr>
                                <th>Model</th><th>Version</th><th>AUC-ROC</th><th>Precision</th>
                                <th>Recall</th><th>F1</th><th>Drift</th><th>Predictions</th><th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.models ?? ([
                                { name: "XGBoost Classifier", version: "v3.2.1" },
                                { name: "LightGBM Classifier", version: "v2.8.0" },
                                { name: "Isolation Forest", version: "v1.5.3" },
                                { name: "Deep Autoencoder", version: "v1.1.0" },
                            ] as Partial<ModelInfo>[])).map((m: Partial<ModelInfo>, i: number) => (
                                <motion.tr key={m.name as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-secondary border border-border flex-shrink-0"><Cpu className="w-3 h-3 text-muted-foreground" /></div>
                                            <span className="text-sm font-medium text-foreground">{m.name as string}</span>
                                        </div>
                                    </td>
                                    <td className="font-mono text-xs text-muted-foreground">{m.version as string}</td>
                                    <td className="font-mono text-xs font-semibold text-primary">{m.auc != null ? (m.auc * 100).toFixed(2) + "%" : "—"}</td>
                                    <td className="font-mono text-xs">{m.precision != null ? (m.precision * 100).toFixed(2) + "%" : "—"}</td>
                                    <td className="font-mono text-xs">{m.recall != null ? (m.recall * 100).toFixed(2) + "%" : "—"}</td>
                                    <td className="font-mono text-xs">{m.f1 != null ? (m.f1 * 100).toFixed(2) + "%" : "—"}</td>
                                    <td>
                                        {m.driftScore != null ? (
                                            <span className={`font-mono text-xs font-semibold ${m.driftScore > 0.05 ? "text-orange-400" : "text-green-400"}`}>
                                                {(m.driftScore * 100).toFixed(1)}%
                                            </span>
                                        ) : <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="font-mono text-xs">{m.predictions != null ? m.predictions.toLocaleString("en-US") : "—"}</td>
                                    <td>
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${data ? "text-green-400" : "text-muted-foreground"}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${data ? "bg-green-400" : "bg-muted-foreground/30"}`} />
                                            {data ? "serving" : "offline"}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Charts + DAGs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
                    <p className="text-sm font-semibold text-foreground mb-1">Ensemble Performance (XGBoost)</p>
                    <p className="text-xs text-muted-foreground mb-4">{data ? "Last 9 days" : "Awaiting connection"}</p>
                    {mounted && <ReactECharts option={perfOption} style={{ height: "200px" }} notMerge />}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
                    <p className="text-sm font-semibold text-foreground mb-4">Airflow Pipeline Status</p>
                    <div className="space-y-2">
                        {(data?.dags ?? ([
                            { name: "feature_engineering_dag" },
                            { name: "model_retraining_dag" },
                            { name: "model_evaluation_dag" },
                            { name: "data_drift_detection_dag" },
                            { name: "feast_feature_sync_dag" },
                        ] as Partial<DagInfo>[])).map((dag: Partial<DagInfo>) => (
                            <div key={dag.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs ${dag.status ? dagColor(dag.status) : "bg-secondary border-border text-muted-foreground/50"}`}>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dag.status ? (dag.status === "success" ? "bg-green-400" : dag.status === "running" ? "bg-blue-400 animate-pulse" : "bg-red-400") : "bg-muted-foreground/30"}`} />
                                <span className="font-mono flex-1 truncate">{dag.name}</span>
                                {dag.duration && <span className="text-[10px] opacity-70 flex-shrink-0">{dag.duration}</span>}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Monitoring metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Avg Inference Latency", value: data ? `${data.monitoring.avgLatencyMs}ms` : "—", icon: TrendingUp },
                    { label: "Daily Predictions", value: data ? data.monitoring.dailyPredictions.toLocaleString("en-US") : "—", icon: Cpu },
                    { label: "Drift Alerts", value: data ? data.monitoring.driftAlerts.toString() : "—", icon: AlertTriangle },
                    { label: "Feature Store Lag", value: data ? `${data.monitoring.featureStoreLagMs}ms` : "—", icon: CheckCircle },
                ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="glass-card p-4">
                            <Icon className={`w-4 h-4 mb-2 ${data ? "text-primary" : "text-muted-foreground/40"}`} />
                            <p className={`text-xl font-bold font-mono ${data ? "text-foreground" : "text-muted-foreground/40"}`}>{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
