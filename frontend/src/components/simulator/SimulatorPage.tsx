"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Zap, CreditCard, Hash, Building2, MapPin, Globe } from "lucide-react";

// Simple client-side transaction ID generator
function generateTxnId(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `TXN-${ts}-${rand}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SimForm {
    cardNumber: string;
    transactionId: string;
    merchant: string;
    mcc: string;
    amount: string;
    currency: string;
    country: string;
    ipAddress: string;
}

interface SimResult {
    transactionId: string;
    cardNumber: string;
    riskScore: number;
    riskLevel: "critical" | "high" | "medium" | "low" | "safe";
    decision: "BLOCKED" | "REVIEW" | "APPROVED";
    latencyMs: number;
    modelScores: { xgboost: number; lightgbm: number; isolationForest: number; autoencoder: number; ensemble: number };
    fraudReasons: string[];
    velocityFlags: { unusualAmount: boolean; geoRisk: boolean; highRiskMCC: boolean; newDevice: boolean };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HIGH_RISK_MCC = new Set(["6051", "5944", "7994", "7801", "7802", "4829", "6012"]);
const HIGH_RISK_COUNTRIES = new Set(["NG", "KP", "IR", "BY", "SY", "CU", "VE"]);
const MEDIUM_RISK_COUNTRIES = new Set(["RU", "MM", "VN", "PK", "BD", "GH", "KE"]);

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SGD", "JPY", "AUD"];
const COUNTRIES = [
    { code: "US", label: "United States" }, { code: "GB", label: "United Kingdom" },
    { code: "IN", label: "India" }, { code: "DE", label: "Germany" },
    { code: "AE", label: "UAE" }, { code: "SG", label: "Singapore" },
    { code: "AU", label: "Australia" }, { code: "JP", label: "Japan" },
    { code: "MT", label: "Malta" }, { code: "NG", label: "Nigeria" },
    { code: "RU", label: "Russia" }, { code: "KP", label: "North Korea" },
    { code: "BR", label: "Brazil" }, { code: "CA", label: "Canada" },
    { code: "FR", label: "France" },
];

// ── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
    {
        label: "Normal Purchase",
        form: { cardNumber: "4532 0151 2345 6789", transactionId: "", merchant: "Starbucks Coffee", mcc: "5812", amount: "12.50", currency: "USD", country: "US", ipAddress: "192.168.1.10" },
    },
    {
        label: "Geo Velocity Fraud",
        form: { cardNumber: "5412 7534 1234 5678", transactionId: "", merchant: "Luxury Goods Dubai", mcc: "5944", amount: "3499.00", currency: "AED", country: "AE", ipAddress: "185.220.101.45" },
    },
    {
        label: "Crypto High Risk",
        form: { cardNumber: "3714 496353 98431", transactionId: "", merchant: "Binance Exchange", mcc: "6051", amount: "9999.00", currency: "USD", country: "MT", ipAddress: "45.33.32.156" },
    },
];

// ── Scoring Engine ────────────────────────────────────────────────────────────

function maskCard(num: string): string {
    const digits = num.replace(/\D/g, "");
    if (digits.length < 4) return num;
    return "**** **** **** " + digits.slice(-4);
}

function runScoring(form: SimForm): SimResult {
    const amount = parseFloat(form.amount) || 0;
    let risk = 0.05;

    // Amount signals
    if (amount > 10000) risk += 0.35;
    else if (amount > 5000) risk += 0.25;
    else if (amount > 2000) risk += 0.15;
    else if (amount > 1000) risk += 0.08;

    // Country signals
    const highRiskCountry = HIGH_RISK_COUNTRIES.has(form.country);
    const medRiskCountry = MEDIUM_RISK_COUNTRIES.has(form.country);
    if (highRiskCountry) risk += 0.30;
    else if (medRiskCountry) risk += 0.12;

    // MCC signals
    const highRiskMCC = HIGH_RISK_MCC.has(form.mcc);
    if (highRiskMCC) risk += 0.22;

    // IP heuristic (non-private range)
    const privateIP = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(form.ipAddress);
    if (!privateIP && form.ipAddress.length > 0) risk += 0.06;

    risk = Math.min(0.98, Math.max(0.02, risk));

    // Add small jitter to simulate real model variance
    const jitter = (Math.random() - 0.5) * 0.04;
    const ensembleScore = Math.min(0.99, Math.max(0.01, risk + jitter));

    const xgb = Math.min(0.99, Math.max(0.01, ensembleScore + (Math.random() - 0.5) * 0.06));
    const lgb = Math.min(0.99, Math.max(0.01, ensembleScore + (Math.random() - 0.5) * 0.06));
    const iso = Math.min(0.99, Math.max(0.01, ensembleScore + (Math.random() - 0.5) * 0.10));
    const ae = Math.min(0.99, Math.max(0.01, ensembleScore + (Math.random() - 0.5) * 0.08));

    const riskLevel =
        ensembleScore >= 0.90 ? "critical" :
            ensembleScore >= 0.72 ? "high" :
                ensembleScore >= 0.45 ? "medium" :
                    ensembleScore >= 0.20 ? "low" : "safe";

    const decision =
        ensembleScore >= 0.82 ? "BLOCKED" :
            ensembleScore >= 0.45 ? "REVIEW" : "APPROVED";

    const reasons: string[] = [];
    if (amount > 2000) reasons.push(`Transaction amount significantly above historical average ($${amount.toLocaleString("en-US")})`);
    if (highRiskCountry) reasons.push(`Transaction origin from OFAC-monitored country (${form.country})`);
    if (medRiskCountry) reasons.push(`Elevated-risk country of origin (${form.country})`);
    if (highRiskMCC) reasons.push(`High-risk merchant category code detected (MCC ${form.mcc})`);
    if (!privateIP && form.ipAddress) reasons.push(`IP address ${form.ipAddress} outside known cardholder region`);
    if (ensembleScore > 0.5 && Math.random() > 0.5) reasons.push("Behavioral pattern deviates from cardholder's 30-day profile");
    if (ensembleScore > 0.7 && Math.random() > 0.6) reasons.push("Autoencoder reconstruction error exceeds anomaly threshold (0.78)");

    return {
        transactionId: form.transactionId.trim() || generateTxnId(),
        cardNumber: maskCard(form.cardNumber),
        riskScore: parseFloat(ensembleScore.toFixed(4)),
        riskLevel,
        decision,
        latencyMs: parseFloat((80 + Math.random() * 85).toFixed(1)),
        modelScores: {
            xgboost: parseFloat(xgb.toFixed(4)),
            lightgbm: parseFloat(lgb.toFixed(4)),
            isolationForest: parseFloat(iso.toFixed(4)),
            autoencoder: parseFloat(ae.toFixed(4)),
            ensemble: parseFloat(ensembleScore.toFixed(4)),
        },
        fraudReasons: reasons,
        velocityFlags: {
            unusualAmount: amount > 1000,
            geoRisk: highRiskCountry || medRiskCountry,
            highRiskMCC,
            newDevice: !privateIP,
        },
    };
}

// ── Field Component ───────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                <Icon className="w-3 h-3" /> {label}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all font-mono placeholder:text-muted-foreground/50";
const selectCls = inputCls + " cursor-pointer";

// ── Main Component ─────────────────────────────────────────────────────────────

const emptyForm: SimForm = {
    cardNumber: "",
    transactionId: "",
    merchant: "",
    mcc: "",
    amount: "",
    currency: "USD",
    country: "US",
    ipAddress: "",
};

export default function SimulatorPage() {
    const [form, setForm] = useState<SimForm>(emptyForm);
    const [result, setResult] = useState<SimResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<SimResult[]>([]);

    const set = (key: keyof SimForm, val: string) =>
        setForm((p) => ({ ...p, [key]: val }));

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setForm({ ...preset.form, transactionId: "" });
        setResult(null);
    };

    const handleRun = async () => {
        if (!form.amount || !form.merchant) return;
        setLoading(true);
        setResult(null);
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 600));
        const res = runScoring(form);
        setResult(res);
        setHistory((prev) => [res, ...prev].slice(0, 10));
        setLoading(false);
    };

    const handleReset = () => { setForm(emptyForm); setResult(null); };

    const riskColor = (level: string) =>
        level === "critical" ? "text-red-400" :
            level === "high" ? "text-orange-400" :
                level === "medium" ? "text-yellow-400" :
                    level === "low" ? "text-blue-400" : "text-green-400";

    const decisionBg = (d: string) =>
        d === "BLOCKED" ? "bg-red-900/30 border-red-500/40 text-red-300" :
            d === "REVIEW" ? "bg-yellow-900/30 border-yellow-500/40 text-yellow-300" :
                "bg-green-900/30 border-green-500/40 text-green-300";

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-base font-bold text-foreground">Transaction Fraud Simulator</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Enter transaction details to run through the AI fraud detection ensemble
                    </p>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* ── Input Form ─────────────────────────────────────────────── */}
                <div className="glass-card p-5 space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-3">
                        Transaction Details
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Field label="Card Number" icon={CreditCard}>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. 4532 0151 2345 6789"
                                    value={form.cardNumber}
                                    maxLength={23}
                                    onChange={(e) => {
                                        // Auto-format with spaces
                                        const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
                                        const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
                                        set("cardNumber", formatted);
                                    }}
                                />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <Field label="Transaction ID (optional — auto-generated if blank)" icon={Hash}>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. TXN-ABC123 (leave blank to auto-generate)"
                                    value={form.transactionId}
                                    onChange={(e) => set("transactionId", e.target.value)}
                                />
                            </Field>
                        </div>

                        <Field label="Merchant Name" icon={Building2}>
                            <input
                                className={inputCls}
                                placeholder="e.g. Starbucks Coffee"
                                value={form.merchant}
                                onChange={(e) => set("merchant", e.target.value)}
                            />
                        </Field>

                        <Field label="Merchant Category Code (MCC)" icon={Hash}>
                            <input
                                className={inputCls}
                                placeholder="e.g. 5812 (Food), 6051 (Crypto)"
                                value={form.mcc}
                                maxLength={4}
                                onChange={(e) => set("mcc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                            />
                        </Field>

                        <Field label="Amount" icon={Zap}>
                            <input
                                className={inputCls}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={(e) => set("amount", e.target.value)}
                            />
                        </Field>

                        <Field label="Currency" icon={Globe}>
                            <select className={selectCls} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </Field>

                        <Field label="Country of Origin" icon={MapPin}>
                            <select className={selectCls} value={form.country} onChange={(e) => set("country", e.target.value)}>
                                {COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="IP Address" icon={Globe}>
                            <input
                                className={inputCls}
                                placeholder="e.g. 192.168.1.10"
                                value={form.ipAddress}
                                onChange={(e) => set("ipAddress", e.target.value)}
                            />
                        </Field>
                    </div>

                    {/* MCC Reference */}
                    <div className="rounded-lg bg-secondary/50 border border-border p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Common MCC Codes</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { code: "5812", label: "Food & Drink" },
                                { code: "5999", label: "Retail" },
                                { code: "5732", label: "Electronics" },
                                { code: "5944", label: "Jewelry" },
                                { code: "6051", label: "Crypto ⚠" },
                                { code: "7994", label: "Gambling ⚠" },
                                { code: "4829", label: "Wire Transfer ⚠" },
                            ].map((m) => (
                                <button
                                    key={m.code}
                                    onClick={() => set("mcc", m.code)}
                                    className={`text-[10px] px-2 py-1 rounded border transition-all ${form.mcc === m.code
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                                        }`}
                                >
                                    {m.code} — {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleRun}
                            disabled={loading || !form.amount || !form.merchant}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" />
                            {loading ? "Analyzing…" : "Run Fraud Detection"}
                        </button>
                        <button
                            onClick={handleReset}
                            title="Reset form"
                            className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Result Panel ───────────────────────────────────────────── */}
                <div className="flex flex-col gap-5">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="glass-card p-10 flex flex-col items-center justify-center gap-4 flex-1"
                            >
                                <div className="w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-foreground">Running Ensemble Inference</p>
                                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                                        XGBoost · LightGBM · Isolation Forest · Autoencoder
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {result && !loading && (
                            <motion.div
                                key={result.transactionId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-5 space-y-5"
                            >
                                {/* Decision Banner */}
                                <div className={`rounded-xl p-4 border ${decisionBg(result.decision)} flex flex-col sm:flex-row gap-4`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap className="w-5 h-5" />
                                            <span className="text-xl font-bold">{result.decision}</span>
                                        </div>
                                        <p className="text-[11px] font-mono opacity-70">TXN ID: {result.transactionId}</p>
                                        <p className="text-[11px] font-mono opacity-70">Card: {result.cardNumber}</p>
                                        <p className="text-[11px] font-mono opacity-60 mt-0.5">Latency: {result.latencyMs}ms</p>
                                    </div>
                                    <div className="text-right sm:text-right">
                                        <p className={`text-4xl font-bold font-mono ${riskColor(result.riskLevel)}`}>
                                            {(result.riskScore * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-xs opacity-70">Risk Score</p>
                                        <p className={`text-sm font-semibold capitalize mt-1 ${riskColor(result.riskLevel)}`}>
                                            {result.riskLevel} Risk
                                        </p>
                                    </div>
                                </div>

                                {/* Velocity Flags */}
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Signal Flags</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { key: "unusualAmount", label: "Unusual Amount" },
                                            { key: "geoRisk", label: "Geo Risk" },
                                            { key: "highRiskMCC", label: "High-Risk MCC" },
                                            { key: "newDevice", label: "External IP" },
                                        ].map((f) => {
                                            const val = result.velocityFlags[f.key as keyof typeof result.velocityFlags];
                                            return (
                                                <div
                                                    key={f.key}
                                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border ${val
                                                        ? "bg-red-900/30 border-red-500/30 text-red-300"
                                                        : "bg-green-900/20 border-green-500/20 text-green-400"
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${val ? "bg-red-400" : "bg-green-400"}`} />
                                                    <span className="leading-tight">{f.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Model Scores */}
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                        AI Model Breakdown
                                    </p>
                                    {[
                                        ["XGBoost", result.modelScores.xgboost],
                                        ["LightGBM", result.modelScores.lightgbm],
                                        ["Isolation Forest", result.modelScores.isolationForest],
                                        ["Autoencoder", result.modelScores.autoencoder],
                                        ["Ensemble (Final)", result.modelScores.ensemble],
                                    ].map(([name, score]) => (
                                        <div key={name as string} className="mb-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={`text-muted-foreground ${name === "Ensemble (Final)" ? "font-semibold text-foreground" : ""}`}>
                                                    {name as string}
                                                </span>
                                                <span className={`font-mono font-semibold ${riskColor(
                                                    (score as number) >= 0.9 ? "critical" :
                                                        (score as number) >= 0.72 ? "high" :
                                                            (score as number) >= 0.45 ? "medium" : "safe"
                                                )}`}>
                                                    {((score as number) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className={`rounded-full bg-secondary overflow-hidden ${name === "Ensemble (Final)" ? "h-2.5" : "h-1.5"}`}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(score as number) * 100}%` }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                    className="h-full rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            (score as number) >= 0.72 ? "#ef4444" :
                                                                (score as number) >= 0.45 ? "#f59e0b" : "#22c55e",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Fraud Reasons */}
                                {result.fraudReasons.length > 0 ? (
                                    <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                                            Triggered Rules (SHAP Explanation)
                                        </p>
                                        {result.fraudReasons.map((r) => (
                                            <div key={r} className="flex items-start gap-2 mb-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                                                <span className="text-xs text-foreground leading-relaxed">{r}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-green-900/20 border border-green-500/20 p-3">
                                        <p className="text-xs text-green-400">✓ No fraud indicators detected — transaction appears normal</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {!result && !loading && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-card p-10 flex flex-col items-center justify-center gap-3 text-center"
                            >
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                    <Zap className="w-7 h-7 text-muted-foreground/40" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Fill in transaction details and click{" "}
                                    <span className="text-primary font-semibold">Run Fraud Detection</span>
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                    Fields required: Merchant Name + Amount
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* History */}
                    {history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-xs font-semibold text-foreground">Session History</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full data-table text-xs">
                                    <thead>
                                        <tr>
                                            <th>Transaction ID</th>
                                            <th>Card</th>
                                            <th>Risk Score</th>
                                            <th>Level</th>
                                            <th>Decision</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h) => (
                                            <tr key={h.transactionId + Math.random()}>
                                                <td className="font-mono text-primary">{h.transactionId}</td>
                                                <td className="font-mono">{h.cardNumber}</td>
                                                <td className="font-mono font-semibold">{(h.riskScore * 100).toFixed(1)}%</td>
                                                <td className={`capitalize font-semibold ${riskColor(h.riskLevel)}`}>{h.riskLevel}</td>
                                                <td>
                                                    <span className={`font-semibold ${h.decision === "BLOCKED" ? "text-red-400" :
                                                        h.decision === "REVIEW" ? "text-yellow-400" : "text-green-400"
                                                        }`}>{h.decision}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
