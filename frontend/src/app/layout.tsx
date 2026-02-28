import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "FraudShield AI — Real-Time Fraud Detection Platform",
    description:
        "Production-ready AI-powered credit card fraud detection with real-time ML inference, streaming analytics, and analyst investigation tools.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
