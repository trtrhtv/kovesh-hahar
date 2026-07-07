"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HERO_SLIDES } from "@/lib/heroSlides";

const INTERVAL_MS = 9000;

/**
 * רקע קבוע לעמודים פנימיים (העלאת סיפור, עמוד סיפור) - כל עוד אין הרבה
 * תמונות אמיתיות שהועלו, הרקע הוא תמיד אחת מתמונות האתר, מתחלף לאט.
 * כולל בקרת בהירות ידנית (סליידר) כדי לשלוט כמה כהה ה-vignette.
 */
export default function PageBackdrop({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const [darkness, setDarkness] = useState(70); // 0 = בהיר לגמרי, 100 = כהה לגמרי

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image src={slide.src} alt="" fill priority={i === 0} sizes="100vw" className="slow-pan object-cover" />
          </div>
        ))}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: "rgb(var(--bg-main-rgb))",
            opacity: darkness / 100,
          }}
        />
      </div>

      {/* בקרת בהירות - פינה שמאלית תחתונה, מעל תוכן העמוד */}
      <div className="fixed bottom-4 left-4 z-40 moto-card px-3 py-2 flex items-center gap-2">
        <span className="text-[10px] text-textDim">☀</span>
        <input
          type="range"
          min={20}
          max={95}
          value={darkness}
          onChange={(e) => setDarkness(Number(e.target.value))}
          className="w-20 accent-moto"
          aria-label="בהירות הרקע"
        />
        <span className="text-[10px] text-textDim">🌑</span>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
