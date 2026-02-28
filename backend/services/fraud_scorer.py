"""
Fraud scoring service — simulates the full ML ensemble inference pipeline.
In production this calls the actual XGBoost, LightGBM, IsolationForest, and Autoencoder models via MLflow.
"""
import random
import time
import uuid
from datetime import datetime
from typing import List, Tuple

from models.schemas import (
    TransactionRequest, FraudPredictionResponse,
    ModelScores, VelocityFlags
)

# High-risk merchant category codes
HIGH_RISK_MCC = {"6051", "5944", "7994", "7801", "7802", "5912", "4829"}
# High-risk countries
HIGH_RISK_COUNTRIES = {"NG", "RU", "KP", "IR", "MM", "VE", "CU", "SY"}


def _get_risk_level(score: float) -> str:
    if score >= 0.90:
        return "critical"
    if score >= 0.75:
        return "high"
    if score >= 0.50:
        return "medium"
    if score >= 0.25:
        return "low"
    return "safe"


def _get_decision(score: float) -> str:
    if score >= 0.85:
        return "BLOCKED"
    if score >= 0.50:
        return "REVIEW"
    return "APPROVED"


def _compute_fraud_reasons(tx: TransactionRequest, score: float) -> List[str]:
    reasons = []
    if tx.amount > 2000:
        reasons.append(f"Unusually large transaction amount (${tx.amount:.2f})")
    if tx.merchant.mcc in HIGH_RISK_MCC:
        reasons.append(f"High-risk merchant category (MCC: {tx.merchant.mcc})")
    if tx.device.country in HIGH_RISK_COUNTRIES:
        reasons.append(f"High-risk origin country ({tx.device.country})")
    if score > 0.7 and random.random() > 0.4:
        reasons.append("Behavioral anomaly detected (Autoencoder reconstruction error > threshold)")
    if score > 0.6 and random.random() > 0.5:
        reasons.append("Geographic velocity: transaction location inconsistent with recent history")
    return reasons


def score_transaction(tx: TransactionRequest) -> Tuple[float, bool]:
    """
    Core scoring logic. 
    In production: loads XGBoost/LightGBM from MLflow registry, 
    fetches features from Feast, and queries Redis for velocity windows.
    """
    base_risk = 0.1
    
    # Amount signal
    if tx.amount > 5000:
        base_risk += 0.3
    elif tx.amount > 2000:
        base_risk += 0.2
    elif tx.amount > 1000:
        base_risk += 0.1

    # MCC signal
    if tx.merchant.mcc in HIGH_RISK_MCC:
        base_risk += 0.25

    # Country signal
    if tx.device.country in HIGH_RISK_COUNTRIES:
        base_risk += 0.2

    # Add noise to simulate real ML variance
    base_risk += random.gauss(0, 0.05)
    base_risk = max(0.0, min(1.0, base_risk))
    return base_risk


async def run_inference(tx: TransactionRequest) -> FraudPredictionResponse:
    t0 = time.perf_counter()
    
    # Simulate parallel model inference
    ensemble_score = score_transaction(tx)
    
    xgb = min(1.0, max(0.0, ensemble_score + random.gauss(0, 0.04)))
    lgb = min(1.0, max(0.0, ensemble_score + random.gauss(0, 0.04)))
    iso = min(1.0, max(0.0, ensemble_score + random.gauss(0, 0.06)))
    ae  = min(1.0, max(0.0, ensemble_score + random.gauss(0, 0.05)))

    # Simulate async I/O (Redis velocity lookup + Feast feature fetch)
    import asyncio
    await asyncio.sleep(0.005)

    latency_ms = (time.perf_counter() - t0) * 1000

    risk_level = _get_risk_level(ensemble_score)
    decision   = _get_decision(ensemble_score)
    reasons    = _compute_fraud_reasons(tx, ensemble_score)

    return FraudPredictionResponse(
        transaction_id=f"TXN-{uuid.uuid4().hex[:8].upper()}",
        risk_score=round(ensemble_score, 4),
        risk_level=risk_level,
        decision=decision,
        fraud_reasons=reasons,
        model_scores=ModelScores(
            xgboost=round(xgb, 4),
            lightgbm=round(lgb, 4),
            isolation_forest=round(iso, 4),
            autoencoder=round(ae, 4),
            ensemble=round(ensemble_score, 4),
        ),
        velocity_flags=VelocityFlags(
            last_1h_count=random.randint(0, 7),
            last_24h_amount=round(random.uniform(100, 4000), 2),
            unusual_amount=tx.amount > 2000,
            geo_velocity=tx.device.country in HIGH_RISK_COUNTRIES,
            new_device=random.random() > 0.8,
        ),
        latency_ms=round(latency_ms, 2),
        timestamp=datetime.utcnow(),
    )
