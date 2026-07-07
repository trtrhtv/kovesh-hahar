/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbon: "#12161A",       // רקע ראשי
        surface: "#1A1F26",      // כרטיסים/קומפוננטות
        surfaceHi: "#232932",    // כרטיס במצב hover/פעיל
        edge: "#2D3748",         // גבולות 1px
        moto: "#FF6600",         // אקצנט ראשי - כתום מוטו, CTA ופעולות
        motoDark: "#E55A00",
        cyan: "#00E5FF",         // אקצנט משני - נעצי מפה, הדגשות חיות
        textDim: "#94A3B8",      // טקסט משני
        // צבעי הרקע הקודם (roadbook) - נשמרים לתאימות אם נצטרך לחזור אליהם
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
      boxShadow: {
        "glow-moto": "0 0 24px rgba(255,102,0,0.25)",
        "glow-cyan": "0 0 24px rgba(0,229,255,0.25)",
      },
    },
  },
  plugins: [],
};
