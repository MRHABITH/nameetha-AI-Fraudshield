import random
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["MLOps"])

MODELS = [
    {"name": "XGBoost Classifier",  "version": "v3.2.1", "type": "Gradient Boosting"},
    {"name": "LightGBM Classifier", "version": "v2.8.0", "type": "Gradient Boosting"},
    {"name": "Isolation Forest",    "version": "v1.5.3", "type": "Anomaly Detection"},
    {"name": "Deep Autoencoder",    "version": "v1.1.0", "type": "Neural Network"},
]

DAG_NAMES = [
    "feature_engineering_dag",
    "model_retraining_dag",
    "model_evaluation_dag",
    "data_drift_detection_dag",
    "feast_feature_sync_dag",
]

DAG_STATUSES = ["success", "success", "success", "running", "success"]


@router.get("/models")
async def get_models():
    """Model registry with live-simulated performance metrics."""
    seed = int(datetime.utcnow().timestamp() / 300)  # changes every 5 min
    rng  = random.Random(seed)

    model_list = []
    for m in MODELS:
        base_auc  = rng.uniform(0.962, 0.981)
        base_prec = rng.uniform(0.930, 0.965)
        base_rec  = rng.uniform(0.885, 0.930)
        f1 = round(2 * base_prec * base_rec / (base_prec + base_rec), 4)

        # 9-day performance trend
        perf_trend = []
        for d in range(9):
            day = (datetime.utcnow() - timedelta(days=8 - d)).strftime("%b %d")
            perf_trend.append({
                "day": day,
                "auc":       round(base_auc   + rng.uniform(-0.006, 0.006), 4),
                "precision": round(base_prec  + rng.uniform(-0.010, 0.010), 4),
                "recall":    round(base_rec   + rng.uniform(-0.012, 0.012), 4),
            })

        model_list.append({
            **m,
            "status":      "serving",
            "trainedAt":   (datetime.utcnow() - timedelta(days=rng.randint(1, 7))).strftime("%Y-%m-%d"),
            "auc":         round(base_auc,  4),
            "precision":   round(base_prec, 4),
            "recall":      round(base_rec,  4),
            "f1":          f1,
            "driftScore":  round(rng.uniform(0.01, 0.08), 4),
            "predictions": rng.randint(800_000, 1_400_000),
            "perfTrend":   perf_trend,
        })

    dags = []
    for name, status in zip(DAG_NAMES, DAG_STATUSES):
        dags.append({
            "name":       name,
            "status":     status,
            "lastRun":    (datetime.utcnow() - timedelta(hours=rng.randint(1, 23))).isoformat() + "Z",
            "duration":   f"{rng.randint(3, 45)}m {rng.randint(0, 59)}s",
        })

    monitoring = {
        "avgLatencyMs": round(rng.uniform(95, 145), 1),
        "dailyPredictions": rng.randint(1_200_000, 1_800_000),
        "driftAlerts": rng.randint(0, 3),
        "featureStoreLagMs": rng.randint(8, 60),
    }

    return {
        "models": model_list,
        "dags":   dags,
        "monitoring": monitoring,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
