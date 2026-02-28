-- ============================================================
-- FraudShield AI — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (cardholders)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone_number    VARCHAR(30),
    risk_score      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Payment cards
CREATE TABLE cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    masked_pan      VARCHAR(20) NOT NULL,
    card_type       VARCHAR(20) DEFAULT 'Credit',
    issuing_bank    VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Device fingerprints
CREATE TABLE devices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint  VARCHAR(128) UNIQUE NOT NULL,
    os_version          VARCHAR(60),
    ip_address          INET,
    location_geo        VARCHAR(100),
    last_seen           TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id             UUID NOT NULL REFERENCES cards(id),
    device_id           UUID REFERENCES devices(id),
    amount              NUMERIC(14, 2) NOT NULL,
    currency            VARCHAR(3) DEFAULT 'USD',
    merchant_name       VARCHAR(255),
    merchant_category   VARCHAR(100),
    merchant_mcc        VARCHAR(10),
    merchant_country    CHAR(2),
    ip_address          INET,
    device_location     VARCHAR(100),
    risk_score          NUMERIC(5, 4),
    risk_level          VARCHAR(20),
    decision            VARCHAR(20),
    is_fraud            BOOLEAN DEFAULT FALSE,
    fraud_reasons       TEXT[],
    xgboost_score       NUMERIC(5, 4),
    lightgbm_score      NUMERIC(5, 4),
    isolation_score     NUMERIC(5, 4),
    autoencoder_score   NUMERIC(5, 4),
    ensemble_score      NUMERIC(5, 4),
    inference_latency_ms NUMERIC(8, 2),
    timestamp           TIMESTAMPTZ DEFAULT NOW()
);

-- Fraud alerts
CREATE TABLE fraud_alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    alert_type          VARCHAR(50) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'open',
    priority            VARCHAR(20) DEFAULT 'high',
    analyst_notes       TEXT,
    assigned_to         VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_card_id    ON transactions(card_id);
CREATE INDEX idx_transactions_timestamp  ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_risk_score ON transactions(risk_score DESC);
CREATE INDEX idx_transactions_is_fraud   ON transactions(is_fraud);
CREATE INDEX idx_alerts_status           ON fraud_alerts(status);
CREATE INDEX idx_alerts_transaction_id   ON fraud_alerts(transaction_id);
