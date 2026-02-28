// Shared TypeScript types for the Fraud Detection Platform

export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";

export interface Transaction {
    id: string;
    cardId: string;
    maskedPan: string;
    amount: number;
    currency: string;
    merchant: {
        name: string;
        category: string;
        country: string;
        mcc: string;
    };
    device: {
        fingerprint: string;
        ipAddress: string;
        location: string;
        country: string;
    };
    timestamp: string;
    riskScore: number;
    riskLevel: RiskLevel;
    isFraud: boolean;
    fraudReasons: string[];
    modelScores: {
        xgboost: number;
        lightgbm: number;
        isolationForest: number;
        autoencoder: number;
        ensemble: number;
    };
    velocityFlags: {
        last1hCount: number;
        last24hAmount: number;
        unusualAmount: boolean;
        geoVelocity: boolean;
        newDevice: boolean;
    };
    status: "approved" | "blocked" | "reviewing";
}

export interface Alert {
    id: string;
    transactionId: string;
    transaction: Transaction;
    alertType: "geo_velocity" | "spending_spike" | "device_mismatch" | "velocity_breach" | "pattern_anomaly" | "fraud_ring";
    status: "open" | "investigating" | "closed_fraud" | "closed_safe";
    priority: "critical" | "high" | "medium";
    createdAt: string;
    analystNotes?: string;
    assignedTo?: string;
}

export interface DashboardMetrics {
    totalTransactions: number;
    fraudBlocked: number;
    fraudRate: number;
    avgLatencyMs: number;
    totalVolumeUsd: number;
    activeAlerts: number;
    modelsOnline: number;
    streamingThroughput: number;
}

export interface SystemHealth {
    inference_api: "online" | "degraded" | "offline";
    kafka_stream: "online" | "degraded" | "offline";
    redis_cache: "online" | "degraded" | "offline";
    postgres_db: "online" | "degraded" | "offline";
    ml_models: "online" | "degraded" | "offline";
}
