from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from routers.inference import router as inference_router
from routers.dashboard import router as dashboard_router
from routers.transactions import router as transactions_router
from routers.mlops import router as mlops_router
from routers.stream import router_stream

app = FastAPI(
    title="FraudShield AI — Real-Time Fraud Detection API",
    description="High-performance fraud detection with XGBoost, LightGBM, Isolation Forest & Autoencoder ensemble (< 200ms inference)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(inference_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(mlops_router)
app.include_router(router_stream)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "inference_engine": "online",
            "kafka_stream":     "online",
            "redis_cache":      "online",
            "postgres_db":      "online",
            "ml_models":        "online",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
