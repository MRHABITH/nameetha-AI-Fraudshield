import random
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["Dashboard"])

_FRAUD_TYPES = ["Geo Velocity", "Spending Spike", "Device Mismatch", "Velocity Breach",
                "Crypto Wash", "Card Testing", "Account Takeover"]
_PRIORITIES   = ["critical", "high", "high", "medium"]
_STATUSES     = ["open", "open", "investigating", "closed_fraud", "closed_safe"]


@router.get("/metrics")
async def get_dashboard_metrics():
    """Real-time dashboard KPI metrics — fresh random values on every call."""
    total_txns      = random.randint(140_000, 165_000)
    fraud_blocked   = random.randint(2_500, 3_500)
    avg_latency_ms  = round(random.uniform(88, 155), 1)
    volume_usd      = round(random.uniform(42.0, 58.0), 1)
    active_alerts   = random.randint(12, 48)
    throughput      = random.randint(1_400, 2_400)
    models_online   = 4
    fraud_savings   = round(fraud_blocked * random.uniform(650, 950) / 1_000_000, 1)

    # Hourly data (last 24h)
    hourly = []
    base_safe = random.randint(4000, 7000)
    for h in range(24):
        variation = random.uniform(0.7, 1.3)
        safe  = int(base_safe * variation)
        fraud = int(safe * random.uniform(0.01, 0.04))
        hourly.append({"hour": f"{h:02d}:00", "safe": safe, "fraud": fraud})

    # Risk distribution
    total = total_txns
    critical_pct = random.uniform(0.003, 0.010)
    high_pct     = random.uniform(0.010, 0.022)
    medium_pct   = random.uniform(0.030, 0.065)
    low_pct      = random.uniform(0.05, 0.10)
    safe_count   = int(total * (1 - critical_pct - high_pct - medium_pct - low_pct))

    risk_dist = [
        {"name": "Critical", "value": int(total * critical_pct), "itemStyle": {"color": "hsl(265,85%,65%)"}},
        {"name": "High",     "value": int(total * high_pct),     "itemStyle": {"color": "hsl(0,85%,55%)"}},
        {"name": "Medium",   "value": int(total * medium_pct),   "itemStyle": {"color": "hsl(38,95%,55%)"}},
        {"name": "Low",      "value": int(total * low_pct),      "itemStyle": {"color": "hsl(195,100%,50%,0.5)"}},
        {"name": "Safe",     "value": safe_count,                "itemStyle": {"color": "hsl(195,100%,50%)"}},
    ]

    return {
        "totalTransactions": total_txns,
        "fraudBlocked": fraud_blocked,
        "fraudRate": round(fraud_blocked / total_txns * 100, 2),
        "avgLatencyMs": avg_latency_ms,
        "totalVolumeUsd": volume_usd,
        "activeAlerts": active_alerts,
        "streamingThroughput": throughput,
        "modelsOnline": models_online,
        "fraudSavingsM": fraud_savings,
        "hourlyData": hourly,
        "riskDistribution": risk_dist,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/alerts")
async def get_alerts(limit: int = 20):
    """Return live simulated fraud alerts."""
    seed = int(datetime.utcnow().timestamp() / 60)
    rng  = random.Random(seed)
    alerts = []
    for i in range(min(limit, 20)):
        fraud_type = rng.choice(_FRAUD_TYPES)
        status     = rng.choice(_STATUSES)
        priority   = rng.choice(_PRIORITIES)
        amount     = round(rng.uniform(200, 9999), 2)
        currency   = rng.choice(["USD", "EUR", "GBP", "AED"])
        merchant   = rng.choice(["Apple Store", "Binance Exchange", "Netflix", "Amazon Prime", "Luxury Goods Ltd"])
        card_last4 = rng.randint(1000, 9999)
        countries  = ["AU", "BR", "JP", "MT", "AE", "NG", "GB", "US"]
        country    = rng.choice(countries)
        risk_score = round(rng.uniform(0.55, 0.98), 4)
        ts = (datetime.utcnow() - timedelta(minutes=i * 25)).isoformat() + "Z"

        alerts.append({
            "id": f"ALERT-{str(i+1).zfill(6)}",
            "type": fraud_type,
            "status": status,
            "priority": priority,
            "riskScore": risk_score,
            "createdAt": ts,
            "transaction": {
                "id": f"TXN-{i:05d}",
                "maskedPan": f"**** **** **** {card_last4}",
                "amount": amount,
                "currency": currency,
                "merchant": {"name": merchant, "category": "Various", "mcc": rng.choice(["5999","6051","5944"]), "country": country},
                "device": {"location": f"City, {country}", "country": country, "ipAddress": f"{rng.randint(1,254)}.{rng.randint(0,255)}.{rng.randint(0,255)}.1", "fingerprint": f"fp_{i:08x}"},
                "riskScore": risk_score,
                "riskLevel": "critical" if risk_score >= 0.9 else "high" if risk_score >= 0.72 else "medium",
                "timestamp": ts,
            },
            "modelScores": {
                "xgboost":         round(rng.uniform(0.5, 0.98), 4),
                "lightgbm":        round(rng.uniform(0.5, 0.98), 4),
                "isolationForest": round(rng.uniform(0.5, 0.98), 4),
                "autoencoder":     round(rng.uniform(0.5, 0.98), 4),
                "ensemble":        risk_score,
            },
        })
    return {"alerts": alerts, "total": len(alerts), "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/alerts/active")
async def get_active_alerts():
    result = await get_alerts(limit=10)
    active = [a for a in result["alerts"] if a["status"] in ("open", "investigating")]
    return {"alerts": active, "total": len(active)}
