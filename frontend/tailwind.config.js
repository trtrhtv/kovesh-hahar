/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbon: "rgb(var(--bg-main-rgb) / <alpha-value>)",
        surface: "rgb(var(--bg-surface-rgb) / <alpha-value>)",
        surfaceHi: "rgb(var(--bg-surface-hi-rgb) / <alpha-value>)",
        edge: "rgb(var(--border-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        textDim: "rgb(var(--text-dim-rgb) / <alpha-value>)",
        moto: "rgb(var(--accent-rgb) / <alpha-value>)",
        motoDark: "rgb(var(--accent-dark-rgb) / <alpha-value>)",
        cyan: "#00E5FF",
      },
      fontFamily: {
        heebo: ["var(--font-heebo)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "glow-moto": "0 0 24px rgb(var(--accent-rgb) / 0.25)",
        "glow-cyan": "0 0 24px rgba(0,229,255,0.25)",
      },
    },
  },
  plugins: [],
};
