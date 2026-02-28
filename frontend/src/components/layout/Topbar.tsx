"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Clock, LogOut, UserCircle2 } from "lucide-react";
import { type Page } from "@/app/page";

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
    dashboard: { title: "Fraud Intelligence Overview", subtitle: "Real-time fraud analytics and threat monitoring" },
    alerts: { title: "Alert Investigation Center", subtitle: "Active fraud alerts requiring analyst review" },
    transactions: { title: "Transaction Stream", subtitle: "Live transaction feed with AI risk scoring" },
    mlops: { title: "ML Ops & Model Registry", subtitle: "Model performance, drift detection, and pipeline" },
    simulator: { title: "Transaction Simulator", subtitle: "Test the fraud detection engine with custom scenarios" },
};

interface TopbarProps {
    currentPage: Page;
    user?: { username: string; role: string };
    onLogout?: () => void;
}

export default function Topbar({ currentPage, user, onLogout }: TopbarProps) {
    const { title, subtitle } = pageTitles[currentPage];

    const [timeStr, setTimeStr] = useState<string | null>(null);
    useEffect(() => {
        const fmt = () => new Date().toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        });
        setTimeStr(fmt());
        const id = setInterval(() => setTimeStr(fmt()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <header className="flex-shrink-0 h-14 sm:h-16 flex items-center gap-2 sm:gap-4 px-4 sm:px-6 border-b border-border bg-card/30 backdrop-blur-sm">
            {/* Spacer for mobile hamburger */}
            <div className="w-9 lg:hidden flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-foreground leading-none truncate">{title}</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block truncate">{subtitle}</p>
            </div>

            {/* Search (hidden on small screens) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground w-48 xl:w-56 cursor-pointer hover:border-primary/40 transition-colors">
                <Search className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs truncate">Search...</span>
                <kbd className="ml-auto text-[10px] px-1 py-0.5 rounded bg-muted/50 font-mono flex-shrink-0">⌘K</kbd>
            </div>

            {/* Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeStr ?? ""}</span>
            </div>

            {/* Notifications */}
            <button className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:border-primary/40 transition-colors flex-shrink-0">
                <Bell className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* User badge + Logout */}
            {user && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
                        <UserCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="leading-none">
                            <p className="text-xs font-semibold text-foreground">{user.username}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        title="Sign out"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:border-destructive/40 hover:text-destructive transition-colors flex-shrink-0 text-muted-foreground"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            )}
        </header>
    );
}
