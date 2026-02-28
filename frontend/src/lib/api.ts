// Use NEXT_PUBLIC_API_URL in production (Vercel), fallback to localhost in dev
const _rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BACKEND = _rawUrl.replace(/\/$/, "");
const BASE = `${BACKEND}/api/v1`;

async function apiFetch<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HourlyPoint { hour: string; safe: number; fraud: number }
export interface RiskBucket { name: string; value: number; itemStyle: { color: string } }

export interface DashboardMetrics {
    totalTransactions: number
    fraudBlocked: number
    fraudRate: number
    avgLatencyMs: number
    totalVolumeUsd: number
    activeAlerts: number
    streamingThroughput: number
    modelsOnline: number
    fraudSavingsM: number
    hourlyData: HourlyPoint[]
    riskDistribution: RiskBucket[]
    timestamp: string
}

export interface Transaction {
    id: string
    maskedPan: string
    amount: number
    currency: string
    merchant: { name: string; category: string; mcc: string; country: string }
    device: { location: string; country: string; ipAddress: string; fingerprint: string }
    riskScore: number
    riskLevel: string
    status: string
    modelScores: { xgboost: number; lightgbm: number; isolationForest: number; autoencoder: number; ensemble: number }
    fraudReasons: string[]
    latencyMs: number
    timestamp: string
    isFraud: boolean
}

export interface Alert {
    id: string
    type: string
    status: string
    priority: string
    riskScore: number
    createdAt: string
    transaction: Transaction
    modelScores: { xgboost: number; lightgbm: number; isolationForest: number; autoencoder: number; ensemble: number }
}

export interface PerfTrend { day: string; auc: number; precision: number; recall: number }

export interface ModelInfo {
    name: string
    version: string
    type: string
    status: string
    trainedAt: string
    auc: number
    precision: number
    recall: number
    f1: number
    driftScore: number
    predictions: number
    perfTrend: PerfTrend[]
}

export interface DagInfo {
    name: string
    status: string
    lastRun: string
    duration: string
}

export interface MLOpsData {
    models: ModelInfo[]
    dags: DagInfo[]
    monitoring: { avgLatencyMs: number; dailyPredictions: number; driftAlerts: number; featureStoreLagMs: number }
    timestamp: string
}

// ── API calls — all go directly to the FastAPI backend ────────────────────────

export const api = {
    health: () => fetch(`${BACKEND}/health`, { cache: "no-store" })
        .then(r => r.ok ? r.json() as Promise<{ status: string }> : null)
        .catch(() => null),
    metrics: () => apiFetch<DashboardMetrics>("/metrics"),
    transactions: (limit = 30) => apiFetch<{ transactions: Transaction[] }>(`/transactions?limit=${limit}`),
    alerts: (limit = 20) => apiFetch<{ alerts: Alert[] }>(`/alerts?limit=${limit}`),
    models: () => apiFetch<MLOpsData>("/models"),
};
