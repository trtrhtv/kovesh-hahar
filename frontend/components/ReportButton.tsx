"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { createReport } from "@/lib/api";

const REASON_LABELS: Record<string, string> = {
  spam: "ספאם / פרסומת",
  inappropriate: "תוכן לא ראוי",
  harassment: "הטרדה / פגיעה באדם",
  misinformation: "מידע שגוי או מסוכן",
  other: "אחר",
};

export default function ReportButton({
  contentType,
  contentId,
  small = false,
}: {
  contentType: "story" | "comment" | "event";
  contentId: string;
  small?: boolean;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createReport(contentType, contentId, reason, note);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <span className="text-[11px] text-emerald-400">הדיווח נשלח, תודה</span>;
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`text-textDim hover:text-moto underline ${small ? "text-[11px]" : "text-xs"}`}
      >
        🚩 דווח
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 z-30 moto-card p-3 w-64 max-w-[85vw]">
          <form onSubmit={submit} className="flex flex-col gap-2">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border border-edge bg-surface px-2 py-1.5 text-xs focus:border-moto outline-none"
            >
              {Object.entries(REASON_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="פרטים נוספים (לא חובה)"
              rows={2}
              maxLength={500}
              className="border border-edge bg-surface px-2 py-1.5 text-xs focus:border-moto outline-none resize-none"
            />
            {error && <p className="text-danger text-[11px]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="switch-btn text-[11px] font-bold text-moto px-3 py-1.5 disabled:opacity-50"
              >
                {busy ? "שולח..." : "שלח דיווח"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] text-textDim hover:underline"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
