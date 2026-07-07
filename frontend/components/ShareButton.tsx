"use client";

import { useState } from "react";

export default function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function getUrl() {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  async function handleShare() {
    const url = getUrl();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
      } catch {
        // המשתמש ביטל את השיתוף - לא שגיאה אמיתית, לא עושים כלום
      }
      return;
    }
    setMenuOpen((o) => !o);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // אין הרשאת clipboard - לא קריטי
    }
    setMenuOpen(false);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${getUrl()}`)}`;

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="switch-btn text-sm font-bold text-ink px-5 py-2.5 min-h-[44px] flex items-center gap-2"
      >
        <span>📤</span> שתף
      </button>

      {menuOpen && (
        <div className="absolute top-full mt-2 right-0 z-30 moto-card p-2 w-48 flex flex-col gap-1">
          <button
            onClick={copyLink}
            className="text-sm text-ink text-right px-3 py-2.5 hover:bg-surfaceHi transition-colors"
          >
            {copied ? "✓ הועתק!" : "העתק קישור"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-ink text-right px-3 py-2.5 hover:bg-surfaceHi transition-colors"
          >
            שתף ב-WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
