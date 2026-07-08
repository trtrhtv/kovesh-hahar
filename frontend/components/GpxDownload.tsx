"use client";

import { useState } from "react";

export default function GpxDownload({ gpxUrl }: { gpxUrl: string }) {
  const [showQr, setShowQr] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    gpxUrl
  )}`;

  return (
    <div className="moto-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold text-cyan tracking-widest mb-1">📥 קובץ מסלול</div>
          <p className="text-[11px] text-textDim">
            קובץ GPX נפתח ישירות באפליקציות ניווט שטח כמו Gaia GPS, OsmAnd, Locus Map ועוד
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={gpxUrl}
            download
            className="switch-btn text-xs font-bold text-ink px-4 py-2.5 whitespace-nowrap"
          >
            ⬇ הורד GPX
          </a>
          <button
            onClick={() => setShowQr((v) => !v)}
            className="switch-btn text-xs font-bold text-ink px-4 py-2.5 whitespace-nowrap"
          >
            {showQr ? "הסתר QR" : "📱 QR לנייד"}
          </button>
        </div>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col items-center gap-2 border-t border-edge pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR code להורדת קובץ ה-GPX" width={180} height={180} />
          <p className="text-[11px] text-textDim text-center">
            סרוק עם מצלמת הטלפון כדי לפתוח את קובץ ה-GPX ישירות באפליקציית הניווט שלך
          </p>
        </div>
      )}
    </div>
  );
}
