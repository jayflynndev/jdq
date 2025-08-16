// tailwind.config.ts
import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import aspectRatio from "@tailwindcss/aspect-ratio";

const config: Config = {
  darkMode: ["class"], // manual toggle via .dark on <html> or <body>
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (Option B)
        brand: {
          ...colors.violet,
          DEFAULT: "#7C3AED", // vivid violet
          foreground: "#FFFFFF",
        },
        accent: {
          ...colors.cyan,
          DEFAULT: "#06B6D4", // cyan/teal
          foreground: "#0A0A0A",
        },
        highlight: {
          ...colors.amber,
          DEFAULT: "#F59E0B", // warm gold
          foreground: "#0A0A0A",
        },

        // Neutral surfaces/text (semantic)
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8FAFC", // light background (slate-50-ish)
          muted: "#F3F4F6", // card bg
          inverted: "#111827", // near-black
        },
        textc: {
          DEFAULT: "#0F172A", // primary text (slate-900)
          muted: "#475569", // secondary text (slate-600)
          inverted: "#F8FAFC",
        },
        borderc: {
          DEFAULT: "#E5E7EB", // border / hairlines
          strong: "#CBD5E1",
        },
      },

      fontFamily: {
        heading: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "16px",
        lg: "24px",
        full: "9999px",
      },

      boxShadow: {
        // soft, modern shadows
        card: "0 6px 20px rgba(17, 24, 39, 0.06)",
        hover: "0 10px 24px rgba(17, 24, 39, 0.10)",
        focus: "0 0 0 4px rgba(124, 58, 237, 0.25)", // brand outline
      },

      transitionTimingFunction: {
        "out-soft": "cubic-bezier(.22,.61,.36,1)",
      },
    },
  },
  plugins: [aspectRatio],
};

export default config;
