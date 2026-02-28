import random
import time
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/v1", tags=["Transactions"])

MERCHANTS = [
    ("Amazon Prime", "E-Commerce", "5999", "US"),
    ("Starbucks Coffee", "Food & Drink", "5812", "US"),
    ("Shell Gas Station", "Fuel", "5541", "GB"),
    ("Apple Store", "Electronics", "5732", "AU"),
    ("Netflix Subscription", "Streaming", "5968", "BR"),
    ("Walmart Supercenter", "Retail", "5912", "US"),
    ("British Airways", "Travel", "4511", "GB"),
    ("Binance Exchange", "Crypto", "6051", "MT"),
    ("Marriott Hotels", "Hotels", "7011", "AE"),
    ("Luxury Goods Ltd", "Jewelry", "5944", "CH"),
    ("McDonald's", "Food & Drink", "5814", "US"),
    ("Uber Technologies", "Transport", "4121", "IN"),
    ("Steam Gaming", "Entertainment", "7994", "US"),
    ("Western Union", "Wire Transfer", "4829", "NG"),
    ("Coinbase Global", "Crypto", "6051", "US"),
]

LOCATIONS = [
    ("New York, US", "US"), ("London, UK", "GB"), ("Mumbai, IN", "IN"),
    ("Sydney, AU", "AU"), ("Dubai, AE", "AE"), ("São Paulo, BR", "BR"),
    ("Tokyo, JP", "JP"), ("Singapore, SG", "SG"), ("Lagos, NG", "NG"),
    ("Malta, MT", "MT"), ("Zurich, CH", "CH"), ("Toronto, CA", "CA"),
]

HIGH_RISK_MCC = {"6051", "5944", "7994", "4829", "6012"}
HIGH_RISK_COUNTRIES = {"NG", "KP", "IR", "MT", "BY"}

CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD", "AUD"]


def _compute_risk(amount: float, mcc: str, country: str, merchant_name: str) -> dict:
    risk = 0.05
    if amount > 10000: risk += 0.35
    elif amount > 5000: risk += 0.25
    elif amount > 2000: risk += 0.15
    elif amount > 1000: risk += 0.08

    if country in HIGH_RISK_COUNTRIES: risk += 0.30
    if mcc in HIGH_RISK_MCC: risk += 0.22

    risk = min(0.97, max(0.02, risk + (random.random() - 0.5) * 0.08))

    xgb = round(min(0.99, max(0.01, risk + (random.random() - 0.5) * 0.06)), 4)
    lgb = round(min(0.99, max(0.01, risk + (random.random() - 0.5) * 0.06)), 4)
    iso = round(min(0.99, max(0.01, risk + (random.random() - 0.5) * 0.10)), 4)
    ae  = round(min(0.99, max(0.01, risk + (random.random() - 0.5) * 0.08)), 4)
    ens = round(risk, 4)

    level = (
        "critical" if ens >= 0.90 else
        "high"     if ens >= 0.72 else
        "medium"   if ens >= 0.45 else
        "low"      if ens >= 0.20 else "safe"
    )
    decision = "blocked" if ens >= 0.82 else "reviewing" if ens >= 0.45 else "approved"

    return dict(
        riskScore=ens, riskLevel=level, status=decision,
        xgboost=xgb, lightgbm=lgb, isolationForest=iso, autoencoder=ae,
        latencyMs=round(80 + random.random() * 90, 1),
    )


def _generate_transaction(offset_seconds: int = 0) -> dict:
    merchant_name, category, mcc, m_country = random.choice(MERCHANTS)
    location, country = random.choice(LOCATIONS)
    amount = round(random.choices(
        [random.uniform(5, 200), random.uniform(200, 2000), random.uniform(2000, 15000)],
        weights=[70, 25, 5]
    )[0], 2)
    currency = random.choice(CURRENCIES)
    card_last4 = str(random.randint(1000, 9999))
    masked_pan = f"**** **** **** {card_last4}"
    ts = datetime.utcnow() - timedelta(seconds=offset_seconds)

    risk = _compute_risk(amount, mcc, country, merchant_name)

    txn_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    reasons = []
    if amount > 2000: reasons.append(f"High transaction amount: ${amount:,.2f}")
    if country in HIGH_RISK_COUNTRIES: reasons.append(f"High-risk country: {country}")
    if mcc in HIGH_RISK_MCC: reasons.append(f"High-risk MCC: {mcc}")

    return {
        "id": txn_id,
        "maskedPan": masked_pan,
        "amount": amount,
        "currency": currency,
        "merchant": {"name": merchant_name, "category": category, "mcc": mcc, "country": m_country},
        "device": {"location": location, "country": country, "ipAddress": f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}", "fingerprint": f"fp_{uuid.uuid4().hex[:8]}"},
        "riskScore": risk["riskScore"],
        "riskLevel": risk["riskLevel"],
        "status": risk["status"],
        "modelScores": {
            "xgboost": risk["xgboost"],
            "lightgbm": risk["lightgbm"],
            "isolationForest": risk["isolationForest"],
            "autoencoder": risk["autoencoder"],
            "ensemble": risk["riskScore"],
        },
        "fraudReasons": reasons,
        "latencyMs": risk["latencyMs"],
        "timestamp": ts.isoformat() + "Z",
        "isFraud": risk["riskLevel"] in ("critical", "high"),
    }


@router.get("/transactions")
async def get_transactions(limit: int = Query(default=30, le=100)):
    """Return `limit` recent simulated transactions with full ML scoring."""
    txns = [_generate_transaction(offset_seconds=i * 18) for i in range(limit)]
    return {"transactions": txns, "total": limit, "timestamp": datetime.utcnow().isoformat() + "Z"}
