"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Dashboard from "@/components/dashboard/Dashboard";
import AlertsPage from "@/components/alerts/AlertsPage";
import TransactionsPage from "@/components/transactions/TransactionsPage";
import MLOpsPage from "@/components/mlops/MLOpsPage";
import SimulatorPage from "@/components/simulator/SimulatorPage";
import LoginPage from "@/components/auth/LoginPage";

export type Page = "dashboard" | "alerts" | "transactions" | "mlops" | "simulator";

interface AuthUser { username: string; role: string }

export default function Home() {
    const [currentPage, setCurrentPage] = useState<Page>("dashboard");
    const [user, setUser] = useState<AuthUser | null>(null);

    const renderPage = () => {
        switch (currentPage) {
            case "dashboard": return <Dashboard />;
            case "alerts": return <AlertsPage />;
            case "transactions": return <TransactionsPage />;
            case "mlops": return <MLOpsPage />;
            case "simulator": return <SimulatorPage />;
            default: return <Dashboard />;
        }
    };

    // ── Not logged in → show Login ─────────────────────────────────────────────
    if (!user) {
        return (
            <AnimatePresence mode="wait">
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoginPage onLogin={setUser} />
                </motion.div>
            </AnimatePresence>
        );
    }

    // ── Logged in → show Dashboard ─────────────────────────────────────────────
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex h-screen overflow-hidden bg-background"
            >
                <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    <Topbar currentPage={currentPage} user={user} onLogout={() => setUser(null)} />
                    <main className="flex-1 overflow-y-auto overscroll-none p-4 sm:p-5 lg:p-6">
                        {renderPage()}
                    </main>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
