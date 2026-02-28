"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, AlertCircle, Zap, Lock, User } from "lucide-react";

// ── Demo credentials ───────────────────────────────────────────────────────────
const DEMO_USERS = [
    { username: "admin", password: "admin123", role: "Administrator" },
    { username: "analyst", password: "analyst123", role: "Fraud Analyst" },
    { username: "demo", password: "demo", role: "Demo Access" },
];

interface LoginPageProps {
    onLogin: (user: { username: string; role: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Simulate network delay for realism
        await new Promise(r => setTimeout(r, 800));

        const match = DEMO_USERS.find(
            u => u.username === username.trim().toLowerCase() && u.password === password
        );

        if (match) {
            onLogin({ username: match.username, role: match.role });
        } else {
            setError("Invalid credentials. Try admin / admin123");
        }
        setLoading(false);
    };

    const fillDemo = () => {
        setUsername("admin");
        setPassword("admin123");
        setError("");
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(195,100%,50%), transparent)" }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(265,85%,65%), transparent)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(0,85%,55%), transparent)" }} />

            {/* Animated grid lines */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: "linear-gradient(hsl(220,15%,14%,0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(220,15%,14%,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header card */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
                        style={{ background: "linear-gradient(135deg, hsl(195,100%,20%), hsl(265,85%,25%))", border: "1px solid hsl(195,100%,50%,0.3)" }}
                    >
                        <Shield className="w-8 h-8 text-primary" />
                        {/* Pulse ring */}
                        <span className="absolute inset-0 rounded-2xl border border-primary/30 animate-ping opacity-30" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">FraudShield <span className="text-primary">AI</span></h1>
                    <p className="text-muted-foreground text-sm mt-1.5">Real-Time Fraud Detection Platform</p>
                </div>

                {/* Login card */}
                <div className="glass-card p-8 shadow-2xl" style={{ boxShadow: "0 0 60px hsl(195,100%,50%,0.06), 0 25px 50px rgba(0,0,0,0.5)" }}>
                    <div className="flex items-center gap-2 mb-6">
                        <Lock className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Secure Sign In</h2>
                        <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold bg-green-900/30 text-green-400 border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Demo Mode
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="login-username"
                                    type="text"
                                    value={username}
                                    onChange={e => { setUsername(e.target.value); setError(""); }}
                                    placeholder="Enter username"
                                    autoComplete="username"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="login-password"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(""); }}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                                />
                                <button type="button" onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
                                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                                    <p className="text-xs text-destructive">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit button */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, hsl(195,100%,40%), hsl(265,85%,55%))", color: "white" }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating…
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Sign In to Dashboard
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Demo credentials hint */}
                    <div className="mt-6 p-4 rounded-xl border border-border/50 bg-secondary/50">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Demo Credentials</p>
                        <div className="space-y-1.5">
                            {DEMO_USERS.map(u => (
                                <div key={u.username} className="flex items-center justify-between text-xs">
                                    <span className="font-mono text-foreground/70">
                                        <span className="text-primary">{u.username}</span> / {u.password}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{u.role}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={fillDemo}
                            className="mt-3 w-full py-1.5 rounded-lg text-xs font-medium text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            ↗ Fill admin credentials
                        </button>
                    </div>
                </div>

                <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
                    FraudShield GoGenix-AI v2.1.0 · Production-Ready Demo
                </p>
                <p className="text-center text-[11px] text-muted-foreground/50 mt-1">
                    ⓒ 2026 Nameetha and Team. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
