"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "oled" | "vintage";
export type AccentBrand = "ktm" | "gasgas" | "yamaha" | "suzuki";

const ACCENTS: Record<AccentBrand, { label: string; rgb: string; darkRgb: string }> = {
  ktm: { label: "KTM · כתום", rgb: "255 85 0", darkRgb: "204 68 0" },
  gasgas: { label: "GasGas/Honda · אדום", rgb: "255 0 60", darkRgb: "204 0 48" },
  yamaha: { label: "Yamaha · ציאן", rgb: "0 229 255", darkRgb: "0 183 204" },
  suzuki: { label: "Suzuki · צהוב", rgb: "255 234 0", darkRgb: "204 187 0" },
};

const MODE_KEY = "roadstory_theme_mode";
const ACCENT_KEY = "roadstory_theme_accent";

type ThemeContextType = {
  mode: ThemeMode;
  accent: AccentBrand;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentBrand) => void;
  accents: typeof ACCENTS;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("oled");
  const [accent, setAccentState] = useState<AccentBrand>("ktm");

  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_KEY) as ThemeMode | null;
    const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentBrand | null;
    if (savedMode) setModeState(savedMode);
    if (savedAccent) setAccentState(savedAccent);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  useEffect(() => {
    const a = ACCENTS[accent];
    document.documentElement.style.setProperty("--accent-rgb", a.rgb);
    document.documentElement.style.setProperty("--accent-dark-rgb", a.darkRgb);
  }, [accent]);

  function setMode(m: ThemeMode) {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }

  function setAccent(a: AccentBrand) {
    setAccentState(a);
    localStorage.setItem(ACCENT_KEY, a);
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, accents: ACCENTS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme חייב לרוץ בתוך ThemeProvider");
  return ctx;
}
