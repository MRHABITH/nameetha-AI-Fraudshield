# FraudShield AI — Real-Time Credit Card Fraud Detection Platform

> Production-grade AI fraud detection with < 200ms inference, streaming analytics, and a full analyst investigation dashboard.

---

## 🏗️ Project Structure

```
namitha_og/
├── frontend/            # Next.js 15 + TailwindCSS + ECharts dashboard
│   └── src/
│       ├── app/         # Next.js app router (layout, page)
│       ├── components/  # Dashboard, Alerts, Transactions, MLOps, Simulator
│       ├── lib/         # Mock data service
│       └── types/       # TypeScript type definitions
├── backend/             # Python FastAPI inference API
│   ├── main.py          # App entrypoint with CORS + router wiring
│   ├── models/          # Pydantic schemas
│   ├── routers/         # inference.py, alerts.py
│   ├── services/        # fraud_scorer.py (ML ensemble simulation)
│   └── requirements.txt
├── schema.sql           # PostgreSQL database schema
├── docker-compose.yml   # PostgreSQL, Redis, Redpanda (Kafka)
└── README.md
```

---

## 🚀 Quick Start

### 1. Start Infrastructure (Docker required)
```bash
docker-compose up -d
```
This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **Redpanda (Kafka)** on `localhost:19092`

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open: **http://localhost:3000**

### 3. Run the Backend API
```bash
cd backend && 
pip install -r requirements.txt && 
python main.py
```
API Docs: **http://localhost:8000/docs**

---

## 🤖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/predict` | **Fraud inference** (< 200ms) |
| `GET`  | `/api/v1/alerts/active` | Active fraud alerts |
| `GET`  | `/api/v1/alerts/` | All alerts |
| `PUT`  | `/api/v1/alerts/{id}/status` | Update alert status |
| `GET`  | `/health` | System health check |

### Example — Predict Fraud
```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 4999.99,
    "currency": "USD",
    "merchant": { "name": "Binance Crypto", "mcc": "6051", "country": "MT" },
    "device": { "fingerprint": "fp_xyz123", "ip_address": "185.33.21.99", "country": "MT" }
  }'
```

---

## 🧠 AI Model Ensemble

| Model | Type | Use Case |
|-------|------|----------|
| **XGBoost** | Gradient Boosting | Primary classifier (tabular features) |
| **LightGBM** | Gradient Boosting | Fast secondary classifier |
| **Isolation Forest** | Anomaly Detection | Unsupervised outlier detection |
| **Deep Autoencoder** | Neural Network | Reconstruction-error anomaly |
| **Ensemble** | Weighted Average | Final fraud decision |

---

## 📊 Dashboard Pages

| Page | Description |
|------|-------------|
| **Overview** | Metric cards, hourly fraud volume chart, risk distribution, live feed |
| **Alerts** | Filterable alert list + investigation panel with SHAP scores |
| **Transactions** | Streaming table with real-time AI risk scores |
| **ML Ops** | Model registry, performance charts, Airflow DAG status |
| **Simulator** | Test custom transactions through the fraud engine live |

---

## 🔧 Tech Stack

**Frontend:** Next.js 15, TypeScript, TailwindCSS, Framer Motion, ECharts  
**Backend:** Python FastAPI, Uvicorn  
**AI/ML:** XGBoost, LightGBM, Scikit-learn, MLflow  
**Streaming:** Redpanda (Kafka-compatible)  
**Caching:** Redis  
**Database:** PostgreSQL  
**Infrastructure:** Docker, Docker Compose  
