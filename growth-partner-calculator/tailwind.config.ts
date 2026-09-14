import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070b14",
          900: "#0b1220",
          850: "#0f172a",
          800: "#131c2e",
          700: "#1b2740",
          600: "#25324d",
        },
        border: "#22304a",
        muted: {
          DEFAULT: "#8a97ad",
          foreground: "#c3ccdb",
        },
        brand: {
          blue: "#4f7cff",
          "blue-dim": "#2d3f66",
        },
        positive: {
          DEFAULT: "#22a06b",
          bg: "#0f2419",
          border: "#1e4d34",
        },
        warning: {
          DEFAULT: "#c98a1e",
          bg: "#2a1f0d",
          border: "#4d3a14",
        },
        danger: {
          DEFAULT: "#d3453f",
          bg: "#2a1212",
          border: "#4d1e1e",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
