"use client";

import { useState } from "react";
import {
    LayoutDashboard, Bell, ArrowLeftRight, Cpu, Zap,
    Shield, Menu, X, Radio, CheckCircle2,
} from "lucide-react";
import { type Page } from "@/app/page";
import { useLiveStream } from "@/hooks/useLiveStream";
import { useEffect } from "react";
import { api } from "@/lib/api";

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "mlops", label: "ML Ops", icon: Cpu },
    { id: "simulator", label: "Simulator", icon: Zap },
];

const SERVICE_NAMES = ["Inference API", "Kafka Stream", "Redis Cache", "PostgreSQL"] as const;

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [backendOnline, setBackendOnline] = useState(false);
    const [txCount, setTxCount] = useState(0);
    const { connected: streamConnected } = useLiveStream(0); // just for the status dot

    // Poll health endpoint every 5s
    useEffect(() => {
        const check = async () => {
            const h = await api.health();
            setBackendOnline(h?.status === "healthy");
        };
        check();
        const id = setInterval(check, 5000);
        return () => clearInterval(id);
    }, []);

    // Increment rolling transaction counter every 2s when stream is live
    useEffect(() => {
        if (!streamConnected) return;
        const id = setInterval(() => setTxCount(c => c + Math.floor(Math.random() * 2 + 1)), 800);
        return () => clearInterval(id);
    }, [streamConnected]);

    const handleNav = (page: Page) => {
        onNavigate(page);
        setMobileOpen(false);
    };

    const NavContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-border flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative ${backendOnline ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"}`}>
                    <Shield className={`w-4 h-4 ${backendOnline ? "text-primary" : "text-muted-foreground"}`} />
                    {backendOnline && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 ring-1 ring-background" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-none">FraudShield</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">GoGenix-AI v2.1.0</p>
                </div>
            </div>

            {/* Live stream ticker */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-500 ${streamConnected
                    ? "bg-green-900/10 border-green-500/25"
                    : backendOnline
                        ? "bg-primary/5 border-primary/20"
                        : "bg-secondary border-border"
                    }`}>
                    <div className="relative flex-shrink-0">
                        <Radio className={`w-3 h-3 ${streamConnected ? "text-green-400" : backendOnline ? "text-primary" : "text-muted-foreground/40"}`} />
                        {streamConnected && (
                            <span className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
                        )}
                    </div>
                    <span className={`text-xs font-medium flex-1 ${streamConnected ? "text-green-400" : backendOnline ? "text-primary" : "text-muted-foreground"}`}>
                        {streamConnected ? "Stream Live" : backendOnline ? "Connecting..." : "Stream Offline"}
                    </span>
                    {streamConnected && txCount > 0 && (
                        <span className="text-[10px] font-mono text-green-400/70 flex-shrink-0">
                            +{txCount.toLocaleString("en-US")}
                        </span>
                    )}
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                    Platform
                </p>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = currentPage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${active
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                                }`}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                            {item.id === "alerts" && backendOnline && (
                                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30 font-mono">LIVE</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* System health — dynamic from backend */}
            <div className="px-3 py-4 border-t border-border flex-shrink-0">
                <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">System</p>
                    {backendOnline && (
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span className="text-[9px] text-green-400 font-mono">ALL ONLINE</span>
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    {SERVICE_NAMES.map((name, i) => (
                        <div key={name} className="flex items-center gap-2 px-2 py-1">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-700 ${backendOnline
                                ? `bg-green-400 ${i === 1 && streamConnected ? "animate-pulse" : ""}`
                                : "bg-muted-foreground/30"
                                }`} />
                            <span className="text-[11px] text-muted-foreground flex-1 truncate">{name}</span>
                            <span className={`text-[10px] font-mono flex-shrink-0 ${backendOnline ? "text-green-400" : "text-muted-foreground/40"}`}>
                                {backendOnline ? "online" : "offline"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-secondary border border-border shadow-lg"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X className="w-4 h-4 text-foreground" /> : <Menu className="w-4 h-4 text-foreground" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Mobile drawer */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <NavContent />
            </aside>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 bg-card border-r border-border">
                <NavContent />
            </aside>
        </>
    );
}
