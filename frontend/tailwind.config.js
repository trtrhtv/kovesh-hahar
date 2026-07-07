/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#E8E1D3",
        sandDark: "#DCD3BF",
        char: "#23201B",
        oxide: "#A8462E",
        oxideDark: "#8A3623",
        olive: "#5C6B47",
        oliveLight: "#7C8B63",
        trail: "#8B7355",
      },
      fontFamily: {
        heebo: ["var(--font-heebo)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        grain: "url('/grain.png')",
      },
    },
  },
  plugins: [],
};
