"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import AccountMenu from "@/components/AccountMenu";

// ניווט אחיד לכל האתר - מקור אמת יחיד לקישורים, במקום שכל עמוד ימציא סט משלו
const NAV_LINKS = [
  { href: "/stories", label: "מסלולים" },
  { href: "/events", label: "אירועים" },
  { href: "/stories/nearby", label: "בקרבתי" },
  { href: "/contact", label: "צור קשר" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // הקישור הפעיל = ההתאמה הארוכה ביותר, כדי ש-/stories/nearby לא ידליק גם את "מסלולים"
  const activeHref = NAV_LINKS.filter(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/")
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <header className="border-b border-edge sticky top-0 z-40 bg-carbon/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <Link href="/" aria-label="דף הבית">
          <Logo />
        </Link>

        {/* ניווט דסקטופ */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition-colors ${
                l.href === activeHref ? "text-moto font-bold" : "text-ink hover:text-moto"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <AccountMenu />
          <Link
            href="/stories/new"
            className="hidden md:inline-flex tactical-btn bg-moto text-onAccent hover:bg-motoDark !text-[11px] !py-2.5 !px-4"
          >
            העלה סיפור
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden switch-btn text-ink px-3 py-2"
            aria-label="תפריט ניווט"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* תפריט מובייל */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-edge bg-surface px-5 py-3 flex flex-col"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`py-3 text-sm border-b border-edge/50 last:border-0 ${
                l.href === activeHref ? "text-moto font-bold" : "text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/stories/new"
            onClick={() => setMenuOpen(false)}
            className="tactical-btn bg-moto text-onAccent hover:bg-motoDark !text-xs mt-3 justify-center"
          >
            העלה סיפור
          </Link>
        </nav>
      )}
    </header>
  );
}
