/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand accents (from PointPilot design system)
        amex: "#006FCF",
        aeroplan: "#F01428",
        // App surface palette (dark premium fintech)
        base: {
          900: "#0B1220",
          800: "#111827",
        },
        // Feedback (from ui-ux-pro-max recommendations)
        success: "#22C55E",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "app-gradient": "linear-gradient(160deg, #0B1220 0%, #111827 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -24px, 0) scale(1.08)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "orb-drift": "orb-drift 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
