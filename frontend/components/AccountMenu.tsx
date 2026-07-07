"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-bold text-moto hover:underline">
        התחבר
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-moto/20 border border-moto/50 flex items-center justify-center text-moto font-black text-sm hover:border-moto transition-colors"
      >
        {user.display_name.charAt(0)}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-30 moto-card w-52 flex flex-col p-1">
          <div className="px-3 py-2 text-xs text-textDim truncate border-b border-edge mb-1">
            {user.display_name}
          </div>
          <Link
            href={`/users/${user.id}`}
            onClick={() => setOpen(false)}
            className="text-sm text-ink px-3 py-2.5 hover:bg-surfaceHi transition-colors"
          >
            הפרופיל שלי
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="text-sm text-ink px-3 py-2.5 hover:bg-surfaceHi transition-colors"
          >
            הגדרות
          </Link>
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="text-sm text-moto text-right px-3 py-2.5 hover:bg-surfaceHi transition-colors"
          >
            התנתק
          </button>
        </div>
      )}
    </div>
  );
}
