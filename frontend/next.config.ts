import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            // Proxy health check (root level on backend)
            {
                source: "/api/health",
                destination: "http://localhost:8000/health",
            },
            // Proxy all /api/v1/* and SSE stream
            {
                source: "/api/:path*",
                destination: "http://localhost:8000/api/:path*",
            },
        ];
    },
};

export default nextConfig;
