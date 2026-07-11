"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";

export default function ThemeSwitcher() {
  const { mode, accent, setMode, setAccent, accents } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="moto-card p-4 mb-3 w-64 max-w-[85vw]">
          <div className="text-[10px] font-bold text-textDim tracking-widest mb-2">
            מצב תצוגה
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setMode("oled")}
              className={`switch-btn text-xs font-bold py-2.5 min-h-[44px] ${mode === "oled" ? "active" : ""}`}
            >
              OLED לילה
            </button>
            <button
              onClick={() => setMode("vintage")}
              className={`switch-btn text-xs font-bold py-2.5 min-h-[44px] ${mode === "vintage" ? "active" : ""}`}
            >
              ראלי וינטג׳
            </button>
          </div>

          <div className="text-[10px] font-bold text-textDim tracking-widest mb-2">
            צבע מותג
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(accents) as Array<keyof typeof accents>).map((key) => (
              <button
                key={key}
                onClick={() => setAccent(key)}
                className={`switch-btn text-xs font-bold py-2.5 min-h-[44px] flex items-center justify-center gap-1.5 ${
                  accent === key ? "active" : ""
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `rgb(${accents[key].rgb})` }}
                />
                {accents[key].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="הגדרות תצוגה"
        className="moto-btn bg-moto text-onAccent w-12 h-12 min-h-[48px] flex items-center justify-center font-black hover:bg-motoDark transition-colors shadow-glow-moto"
      >
        ⚙
      </button>
    </div>
  );
}
