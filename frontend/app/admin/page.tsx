"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin, fetchContactMessages, type ContactMessage } from "@/lib/api";

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    if (!token) return;
    checkIsAdmin(token).then((result) => {
      setIsAdmin(result);
      if (result) fetchContactMessages(token).then(setMessages);
    });
  }, [token]);

  if (loading || isAdmin === null) {
    return <div className="max-w-2xl mx-auto px-5 py-24 text-center text-textDim">טוען...</div>;
  }

  if (!user || !token || !isAdmin) {
    return (
      <main className="max-w-md mx-auto px-5 py-24 text-center">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <p className="text-textDim">העמוד הזה זמין רק למנהלי האתר.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>
      <h1 className="text-3xl font-black mb-6">פניות שהתקבלו</h1>

      {messages.length === 0 ? (
        <p className="text-textDim">אין עדיין פניות.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div key={m.id} className="border border-edge p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-bold">{m.name}</span>
                <span className="text-textDim text-xs">
                  {new Date(m.created_at).toLocaleString("he-IL")}
                </span>
              </div>
              <a href={`mailto:${m.email}`} className="text-moto text-xs hover:underline">
                {m.email}
              </a>
              <p className="text-white/80 text-sm mt-2 whitespace-pre-line">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
