const { fontFamily } = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

const brand = {
  50: "#EEF2FF",
  500: "#6366F1",
  900: "#312E81",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem" },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        brand,
        slate: colors.slate,
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["'Fraunces'", "serif"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.1" }],
      },
      spacing: {
        18: "4.5rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
