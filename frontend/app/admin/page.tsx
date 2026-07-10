"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import {
  checkIsAdmin,
  fetchContactMessages,
  fetchReports,
  updateReportStatus,
  type ContactMessage,
  type Report,
} from "@/lib/api";

const REASON_LABELS: Record<string, string> = {
  spam: "ספאם / פרסומת",
  inappropriate: "תוכן לא ראוי",
  harassment: "הטרדה / פגיעה באדם",
  misinformation: "מידע שגוי או מסוכן",
  other: "אחר",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  story: "סיפור",
  comment: "תגובה",
  event: "אירוע",
};

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"reports" | "messages">("reports");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!token) return;
    checkIsAdmin(token).then((result) => {
      setIsAdmin(result);
      if (result) {
        fetchContactMessages(token).then(setMessages);
        fetchReports("pending").then(setReports);
      }
    });
  }, [token]);

  async function handleReportAction(reportId: string, status: string) {
    await updateReportStatus(reportId, status);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  // מציגים ספינר רק בזמן שהזהות עדיין נטענת, או כשיש token והבדיקה מול השרת בעיצומה.
  // בלי התנאי `token &&`, משתמש מנותק (token=null) היה נתקע ב-isAdmin===null לנצח.
  if (loading || (token && isAdmin === null)) {
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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("reports")}
          className={`switch-btn text-sm font-bold px-4 py-2.5 ${tab === "reports" ? "active text-moto" : "text-ink"}`}
        >
          דיווחים {reports.length > 0 && `(${reports.length})`}
        </button>
        <button
          onClick={() => setTab("messages")}
          className={`switch-btn text-sm font-bold px-4 py-2.5 ${tab === "messages" ? "active text-moto" : "text-ink"}`}
        >
          פניות
        </button>
      </div>

      {tab === "reports" && (
        <div>
          <h1 className="text-2xl font-black mb-6">דיווחים ממתינים</h1>
          {reports.length === 0 ? (
            <p className="text-textDim">אין דיווחים ממתינים כרגע.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reports.map((r) => (
                <div key={r.id} className="border border-edge p-4">
                  <div className="flex items-center justify-between mb-2 text-sm flex-wrap gap-2">
                    <span className="font-bold text-moto">
                      {CONTENT_TYPE_LABELS[r.content_type]} · {REASON_LABELS[r.reason] || r.reason}
                    </span>
                    <span className="text-textDim text-xs">
                      {new Date(r.created_at).toLocaleString("he-IL")}
                    </span>
                  </div>
                  <p className="text-xs text-textDim mb-1">
                    דיווח מאת: {r.reporter.display_name}
                  </p>
                  <p className="text-xs text-textDim mb-2 font-mono">
                    מזהה תוכן: {r.content_id}
                  </p>
                  {r.note && <p className="text-ink/80 text-sm mb-3 whitespace-pre-line">{r.note}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReportAction(r.id, "reviewed")}
                      className="switch-btn text-xs font-bold text-emerald-400 px-3 py-2"
                    >
                      ✓ טופל
                    </button>
                    <button
                      onClick={() => handleReportAction(r.id, "dismissed")}
                      className="switch-btn text-xs font-bold text-textDim px-3 py-2"
                    >
                      התעלם
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "messages" && (
        <div>
          <h1 className="text-2xl font-black mb-6">פניות שהתקבלו</h1>
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
                  <p className="text-ink/80 text-sm mt-2 whitespace-pre-line">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
