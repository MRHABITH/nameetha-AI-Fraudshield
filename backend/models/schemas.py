"""
Pydantic schemas for request and response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
import uuid


class MerchantInfo(BaseModel):
    name: str
    category: str = ""
    country: str = "US"
    mcc: str = "5999"


class DeviceInfo(BaseModel):
    fingerprint: str
    ip_address: str
    location: str = ""
    country: str = "US"


class TransactionRequest(BaseModel):
    card_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    masked_pan: str = "**** **** **** 0000"
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    merchant: MerchantInfo
    device: DeviceInfo


class ModelScores(BaseModel):
    xgboost: float
    lightgbm: float
    isolation_forest: float
    autoencoder: float
    ensemble: float


class VelocityFlags(BaseModel):
    last_1h_count: int
    last_24h_amount: float
    unusual_amount: bool
    geo_velocity: bool
    new_device: bool


class FraudPredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    transaction_id: str
    risk_score: float
    risk_level: str  # critical, high, medium, low, safe
    decision: str    # APPROVED, REVIEW, BLOCKED
    fraud_reasons: List[str]
    model_scores: ModelScores
    velocity_flags: VelocityFlags
    latency_ms: float
    timestamp: datetime
