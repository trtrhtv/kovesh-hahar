"use client";

/**
 * כפתור "הגעה לתחילת המסלול" - פותח ניווט ישירות מהטלפון.
 * עדיפות לנקודת הכינוס הידנית (meeting point), ואם אין - נקודת ההתחלה מה-GPX.
 */
export default function NavigateButton({
  lat,
  lon,
  label,
}: {
  lat?: number | null;
  lon?: number | null;
  label?: string | null;
}) {
  if (lat == null || lon == null) return null;

  const wazeUrl = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  return (
    <div className="border border-char/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div>
        <div className="text-xs font-bold text-char/60 tracking-wide mb-0.5">נקודת כינוס</div>
        <div className="text-sm">{label || "המיקום מסומן על המפה"}</div>
      </div>
      <div className="flex gap-2 shrink-0">
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-char text-sand px-4 py-2 text-sm font-bold hover:bg-oxide transition-colors"
        >
          נווט ב-Waze
        </a>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-char/30 px-4 py-2 text-sm font-bold hover:border-oxide transition-colors"
        >
          Google Maps
        </a>
      </div>
    </div>
  );
}
