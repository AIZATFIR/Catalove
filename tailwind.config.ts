import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vanilla: {
          50: "#FDFBF7",
          100: "#FAF7F2",
          200: "#F4EFE6",
          300: "#EADFCF",
          400: "#DBCBB7",
        },
        butter: {
          50: "#FFFDF2",
          100: "#FEF9E7",
          200: "#FDF2C8",
          300: "#FCE79D",
          400: "#F9DA6A",
          500: "#F5C842",
          600: "#E6B324",
        },
        caramel: {
          50: "#FCF8F3",
          100: "#F7EFE6",
          200: "#EBDCCB",
          300: "#DEC4AB",
          400: "#C99F77",
          500: "#B87F4A",
          600: "#9E6433",
          700: "#7F4C22",
          800: "#633917",
          900: "#4A270D",
        },
        cocoa: {
          100: "#F0EBE7",
          300: "#C3B5AC",
          500: "#6B5446",
          700: "#44342A",
          800: "#34261E",
          900: "#221813",
          950: "#160F0C",
        },
        blueberry: {
          50: "#F4F7FB",
          100: "#E6EDF6",
          200: "#C8D7EC",
          400: "#7798CA",
          500: "#4A6FA5",
          600: "#365585",
          700: "#2B4369",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(45, 35, 30, 0.06)",
        warm: "0 10px 30px -4px rgba(184, 127, 74, 0.12)",
        card: "0 2px 10px rgba(45, 35, 30, 0.04), 0 16px 32px -8px rgba(45, 35, 30, 0.08)",
        floating: "0 14px 40px -10px rgba(45, 35, 30, 0.18)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
