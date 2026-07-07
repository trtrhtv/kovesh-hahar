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
    <div className="moto-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div>
        <div className="text-xs font-bold text-cyan tracking-widest mb-1">🧭 נקודת כינוס</div>
        <div className="text-white font-bold">{label || "המיקום מסומן על המפה"}</div>
      </div>
      <div className="flex gap-2 shrink-0 flex-col sm:flex-row">
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press moto-btn bg-moto text-carbon w-full sm:w-auto px-6 py-4 min-h-[52px] text-base font-black hover:bg-motoDark hover:shadow-glow-moto transition-colors flex items-center justify-center text-center"
        >
          נווט ב-Waze
        </a>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press border-2 border-edge text-white w-full sm:w-auto px-6 py-4 min-h-[52px] text-base font-bold hover:border-moto transition-colors flex items-center justify-center text-center"
        >
          Google Maps
        </a>
      </div>
    </div>
  );
}
