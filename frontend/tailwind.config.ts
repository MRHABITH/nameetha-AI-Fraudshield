import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                border: "hsl(var(--border))",
                ring: "hsl(var(--ring))",
                fraud: {
                    50: "hsl(0, 90%, 97%)",
                    100: "hsl(0, 80%, 92%)",
                    500: "hsl(0, 85%, 55%)",
                    600: "hsl(0, 85%, 45%)",
                    900: "hsl(0, 75%, 20%)",
                },
                safe: {
                    50: "hsl(143, 90%, 97%)",
                    500: "hsl(143, 70%, 45%)",
                    600: "hsl(143, 70%, 35%)",
                },
                warning: {
                    50: "hsl(38, 95%, 95%)",
                    500: "hsl(38, 95%, 55%)",
                },
                cyber: {
                    DEFAULT: "hsl(195, 100%, 50%)",
                    50: "hsl(195, 100%, 97%)",
                    400: "hsl(195, 100%, 65%)",
                    500: "hsl(195, 100%, 50%)",
                    900: "hsl(195, 100%, 12%)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 5px hsl(0,85%,55%,0.4)" },
                    "50%": { boxShadow: "0 0 20px hsl(0,85%,55%,0.8), 0 0 40px hsl(0,85%,55%,0.4)" },
                },
                "fade-in-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-right": {
                    "0%": { transform: "translateX(100%)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                blink: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.2" },
                },
            },
            animation: {
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "fade-in-up": "fade-in-up 0.4s ease-out",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                blink: "blink 1.5s ease-in-out infinite",
            },
        },
    },
    plugins: [],
};

export default config;
