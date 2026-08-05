import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ["var(--font-heading)", "serif"],
                sans: ["var(--font-body)", "sans-serif"],
            },
            colors: {
                primary: {
                    DEFAULT: "#00994D",
                    hover: "#007A3D",
                    light: "#00C060",
                    muted: "#E6F5ED",
                },
                heading: "#0C1A10",
                body: "#374151",
                muted: "#6B7280",
                surface: {
                    DEFAULT: "#FFFFFF",
                    alt: "#F7F8F7",
                },
                border: "#E2E8E4",
            },
            borderRadius: {
                sm: "6px",
                md: "12px",
                lg: "16px",
            },
            boxShadow: {
                soft: "0 1px 4px rgba(0, 0, 0, 0.06)",
                premium: "0 12px 40px rgba(0, 153, 77, 0.09)",
                deep: "0 12px 40px rgba(0, 153, 77, 0.12)",
                nav: "0 2px 16px rgba(0, 0, 0, 0.06)",
                dropdown: "0 12px 40px rgba(0, 0, 0, 0.08)",
            },
        },
    },
    plugins: [],
};
export default config;
