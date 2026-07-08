"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BackNav() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.back()}
        className="switch-btn text-xs font-bold text-ink px-3 py-2 gap-1.5"
      >
        <span>→</span> חזרה
      </button>
      <Link
        href="/"
        className="switch-btn text-xs font-bold text-ink px-3 py-2 gap-1.5"
      >
        <span>⌂</span> מסך ראשי
      </Link>
    </div>
  );
}
