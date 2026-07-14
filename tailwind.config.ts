import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      colors: {
        // Warm neutral page/card backgrounds
        page: "#F6F2EC",
        card: "#FFFFFF",
        sunken: "#EFE8DC",
        ink: "#241F1B",
        // Brand accent — Plum
        brand: {
          50: "#f5f0f6",
          100: "#e8dcea",
          200: "#d3bcd6",
          400: "#9b7aa3",
          500: "#6B4E71",
          600: "#5a4060",
          700: "#4a3450",
        },
        // Status palette
        status: {
          verified: "#2F8F5B",
          forming: "#C08A2E",
          solo: "#3B7DA6",
          report: "#B84A3E",
        },
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
