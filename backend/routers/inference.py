"""
FastAPI router for real-time fraud inference.
POST /api/v1/predict — synchronous fraud detection (< 200ms target)
"""
from fastapi import APIRouter, HTTPException
from models.schemas import TransactionRequest, FraudPredictionResponse
from services.fraud_scorer import run_inference

router = APIRouter(prefix="/api/v1", tags=["Inference"])


@router.post("/predict", response_model=FraudPredictionResponse)
async def predict_fraud(transaction: TransactionRequest):
    """
    Run the AI fraud detection ensemble on a transaction.
    Returns fraud score, decision, model breakdowns, and SHAP-like reasons.
    """
    try:
        result = await run_inference(transaction)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
