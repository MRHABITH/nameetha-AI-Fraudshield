import {
    Transaction,
    Alert,
    DashboardMetrics,
    SystemHealth,
    RiskLevel,
} from "@/types";

// Deterministic random based on seed
function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

const merchants = [
    { name: "Amazon Prime", category: "E-Commerce", country: "US", mcc: "5999" },
    { name: "Best Buy Online", category: "Electronics", country: "US", mcc: "5732" },
    { name: "Shell Gas Station", category: "Fuel", country: "UK", mcc: "5541" },
    { name: "Marriott Hotels", category: "Lodging", country: "DE", mcc: "7011" },
    { name: "Apple Store", category: "Electronics", country: "US", mcc: "5732" },
    { name: "Walmart Superstore", category: "Retail", country: "US", mcc: "5411" },
    { name: "Netflix Subscription", category: "Streaming", country: "US", mcc: "7994" },
    { name: "DoorDash Delivery", category: "Food", country: "US", mcc: "5812" },
    { name: "Binance Crypto", category: "Crypto Exchange", country: "MT", mcc: "6051" },
    { name: "Luxury Goods Dubai", category: "Retail", country: "AE", mcc: "5944" },
];

const locations = [
    "New York, US",
    "London, UK",
    "Lagos, NG",
    "Mumbai, IN",
    "Singapore, SG",
    "Berlin, DE",
    "Dubai, AE",
    "Sydney, AU",
    "São Paulo, BR",
    "Tokyo, JP",
];

function getRiskLevel(score: number): RiskLevel {
    if (score >= 0.9) return "critical";
    if (score >= 0.75) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.25) return "low";
    return "safe";
}

function generateTransaction(id: number, hoursAgo: number): Transaction {
    const rng = seededRandom(id * 7919);
    const isFraud = rng() > 0.78;
    const riskScore = isFraud
        ? 0.65 + rng() * 0.35
        : rng() * 0.35;

    const merchant = merchants[Math.floor(rng() * merchants.length)];
    const location = locations[Math.floor(rng() * locations.length)];
    const amount = isFraud
        ? 200 + rng() * 4800
        : 10 + rng() * 350;

    const xgb = isFraud ? 0.7 + rng() * 0.29 : rng() * 0.3;
    const lgb = isFraud ? 0.68 + rng() * 0.3 : rng() * 0.3;
    const iso = isFraud ? 0.6 + rng() * 0.38 : rng() * 0.35;
    const ae = isFraud ? 0.72 + rng() * 0.27 : rng() * 0.28;

    const fraudReasonsList = [
        "Geographic velocity anomaly",
        "Unusual spending amount",
        "New device fingerprint",
        "Velocity breach (5 txns/hr)",
        "High-risk MCC code",
        "Cross-border anomaly",
        "Behavioral pattern shift",
    ];

    const fraudReasons = isFraud
        ? fraudReasonsList.filter(() => rng() > 0.6).slice(0, 3)
        : [];

    const timestamp = new Date(Date.now() - hoursAgo * 3600 * 1000 - rng() * 3600 * 1000);

    return {
        id: `TXN-${String(id).padStart(8, "0")}`,
        cardId: `CARD-${(Math.floor(rng() * 9000) + 1000).toString()}`,
        maskedPan: `**** **** **** ${Math.floor(1000 + rng() * 8999)}`,
        amount: parseFloat(amount.toFixed(2)),
        currency: rng() > 0.7 ? "EUR" : rng() > 0.5 ? "GBP" : "USD",
        merchant,
        device: {
            fingerprint: `fp_${Math.random().toString(36).slice(2, 10)}`,
            ipAddress: `${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.1`,
            location,
            country: location.split(", ")[1],
        },
        timestamp: timestamp.toISOString(),
        riskScore: parseFloat(riskScore.toFixed(4)),
        riskLevel: getRiskLevel(riskScore),
        isFraud,
        fraudReasons,
        modelScores: {
            xgboost: parseFloat(xgb.toFixed(4)),
            lightgbm: parseFloat(lgb.toFixed(4)),
            isolationForest: parseFloat(iso.toFixed(4)),
            autoencoder: parseFloat(ae.toFixed(4)),
            ensemble: parseFloat(riskScore.toFixed(4)),
        },
        velocityFlags: {
            last1hCount: Math.floor(rng() * 8),
            last24hAmount: parseFloat((rng() * 5000).toFixed(2)),
            unusualAmount: isFraud && rng() > 0.5,
            geoVelocity: isFraud && rng() > 0.6,
            newDevice: isFraud && rng() > 0.7,
        },
        status: isFraud ? (rng() > 0.5 ? "blocked" : "reviewing") : "approved",
    };
}

export function getMockTransactions(count = 50): Transaction[] {
    return Array.from({ length: count }, (_, i) =>
        generateTransaction(i + 1, i * 0.5)
    );
}

export function getMockAlerts(): Alert[] {
    const txns = getMockTransactions(20).filter((t) => t.isFraud);
    const alertTypes: Alert["alertType"][] = [
        "geo_velocity",
        "spending_spike",
        "device_mismatch",
        "velocity_breach",
        "pattern_anomaly",
        "fraud_ring",
    ];
    const statuses: Alert["status"][] = [
        "open",
        "investigating",
        "closed_fraud",
        "closed_safe",
    ];

    return txns.map((tx, i) => ({
        id: `ALERT-${String(i + 1).padStart(6, "0")}`,
        transactionId: tx.id,
        transaction: tx,
        alertType: alertTypes[i % alertTypes.length],
        status: statuses[i % 4],
        priority: tx.riskLevel === "critical" ? "critical" : tx.riskLevel === "high" ? "high" : "medium",
        createdAt: tx.timestamp,
        analystNotes: i % 3 === 0 ? "Customer contacted. Awaiting confirmation." : undefined,
    }));
}

export function getMockMetrics(): DashboardMetrics {
    return {
        totalTransactions: 148293,
        fraudBlocked: 2847,
        fraudRate: 1.92,
        avgLatencyMs: 127,
        totalVolumeUsd: 48392847,
        activeAlerts: 23,
        modelsOnline: 4,
        streamingThroughput: 1847,
    };
}

export function getMockSystemHealth(): SystemHealth {
    return {
        inference_api: "online",
        kafka_stream: "online",
        redis_cache: "online",
        postgres_db: "online",
        ml_models: "online",
    };
}

export function getHourlyFraudData() {
    const hours = Array.from({ length: 24 }, (_, i) => {
        const rng = seededRandom(i * 31337);
        const total = Math.floor(4000 + rng() * 3000);
        const fraud = Math.floor(total * (0.01 + rng() * 0.03));
        return {
            hour: `${String(i).padStart(2, "0")}:00`,
            total,
            fraud,
            safe: total - fraud,
        };
    });
    return hours;
}

export function getRiskDistribution() {
    return [
        { name: "Critical", value: 287, color: "#ef4444" },
        { name: "High", value: 643, color: "#f97316" },
        { name: "Medium", value: 1823, color: "#eab308" },
        { name: "Low", value: 4921, color: "#22c55e" },
        { name: "Safe", value: 140619, color: "#06b6d4" },
    ];
}
