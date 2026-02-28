"""
FastAPI router for alert management.
"""
import random
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

ALERT_TYPES = ["geo_velocity", "spending_spike", "device_mismatch", "velocity_breach", "pattern_anomaly", "fraud_ring"]
STATUSES    = ["open", "investigating", "closed_fraud", "closed_safe"]

def _fake_alerts(count: int = 20):
    alerts = []
    for i in range(count):
        alerts.append({
            "id": f"ALERT-{str(i+1).zfill(6)}",
            "transaction_id": f"TXN-{(i+100):08d}",
            "alert_type": ALERT_TYPES[i % len(ALERT_TYPES)],
            "status": STATUSES[i % 4],
            "priority": "critical" if i % 7 == 0 else "high" if i % 3 == 0 else "medium",
            "amount": round(500 + i * 137.5, 2),
            "merchant": f"Merchant #{i+1}",
            "risk_score": round(0.65 + (i % 35) * 0.01, 4),
            "created_at": (datetime.utcnow() - timedelta(hours=i)).isoformat(),
        })
    return alerts


@router.get("/active")
async def get_active_alerts():
    """Return active (open + investigating) fraud alerts."""
    all_alerts = _fake_alerts(30)
    return [a for a in all_alerts if a["status"] in ("open", "investigating")]


@router.get("/")
async def get_all_alerts(limit: int = 50):
    """Return all alerts."""
    return _fake_alerts(min(limit, 100))


class AlertStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


@router.put("/{alert_id}/status")
async def update_alert_status(alert_id: str, payload: AlertStatusUpdate):
    """Update alert status (analyst action)."""
    if payload.status not in STATUSES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {STATUSES}")
    return {
        "alert_id": alert_id,
        "status": payload.status,
        "notes": payload.notes,
        "updated_at": datetime.utcnow().isoformat(),
    }
