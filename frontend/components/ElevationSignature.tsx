"use client";

/**
 * "קו החתימה" - האלמנט הגרפי הייחודי של האתר.
 * כל סיפור מציג קו קונטור מופשט שנגזר מפרופיל הגובה של קובץ ה-GPX שלו,
 * במקום עוד תמונת thumbnail גנרית. קו שטוח = מסלול קל, קו משונן = טיפוס קשה.
 */
export default function ElevationSignature({
  profileJson,
  className = "",
  color = "#A8462E",
}: {
  profileJson?: string | null;
  className?: string;
  color?: string;
}) {
  if (!profileJson) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="contour-divider w-full" />
      </div>
    );
  }

  let points: [number, number, number][] = [];
  try {
    points = JSON.parse(profileJson);
  } catch {
    return null;
  }

  if (!points.length) return null;

  const elevations = points.map((p) => p[2]);
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  const range = max - min || 1;

  const width = 400;
  const height = 60;
  const padding = 4;

  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const normalized = (p[2] - min) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
