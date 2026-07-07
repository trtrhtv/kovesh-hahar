"use client";

import { useEffect, useRef, useState } from "react";

export default function ReadingProgressRider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.5;
      const total = rect.height;
      const traveled = viewportCenter - rect.top;
      const pct = Math.max(0, Math.min(1, traveled / total));
      setProgress(pct);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* פס המסלול + הרוכב - מוסתר במסכים צרים, אין מקום */}
      <div className="hidden xl:block absolute top-0 bottom-0 -right-8 w-px bg-edge">
        <div
          className="absolute right-1/2 translate-x-1/2 transition-[top] duration-150 ease-out"
          style={{ top: `${progress * 100}%` }}
        >
          <div className="w-6 h-6 -translate-y-1/2 rounded-full bg-moto/15 border border-moto flex items-center justify-center">
            <span className="text-xs" style={{ transform: "scaleX(-1)" }}>
              🏍️
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
