import { useEffect, useRef, useState } from "react";

export interface LiveTransaction {
    id: string;
    merchant: string;
    amount: number;
    currency: string;
    riskScore: number;
    riskLevel: string;
    status: string;
    location: string;
    timestamp: string;
}

// Direct to FastAPI — Next.js proxy buffers SSE which breaks the stream
const _rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BACKEND = _rawUrl.replace(/\/$/, "");
const STREAM_URL = `${BACKEND}/api/v1/stream/transactions`;

/**
 * Subscribes to the SSE stream endpoint.
 * Returns the last `maxItems` live transactions and a connection flag.
 */
export function useLiveStream(maxItems = 20) {
    const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
    const [connected, setConnected] = useState(false);
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const connect = () => {
            if (esRef.current) {
                esRef.current.close();
            }

            const es = new EventSource(STREAM_URL);
            esRef.current = es;

            es.onopen = () => setConnected(true);

            es.onmessage = (event) => {
                try {
                    const tx: LiveTransaction = JSON.parse(event.data);
                    setTransactions((prev) => [tx, ...prev].slice(0, maxItems));
                } catch {
                    // ignore malformed events
                }
            };

            es.onerror = () => {
                setConnected(false);
                es.close();
                // Retry after 3 seconds
                setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            esRef.current?.close();
        };
    }, [maxItems]);

    return { transactions, connected };
}
