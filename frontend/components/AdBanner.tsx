/**
 * מקום שמור לפרסומת. כרגע placeholder בלבד - כשיהיה מוכן לחבר רשת פרסום
 * אמיתית (Google AdSense, פרסום ישיר וכו'), כאן המקום להטמיע את הקוד.
 */
export default function AdBanner({ variant = "horizontal" }: { variant?: "horizontal" | "square" }) {
  return (
    <div
      className={`border border-dashed border-char/25 flex items-center justify-center text-char/30 text-xs tracking-wider ${
        variant === "horizontal" ? "h-20" : "h-40"
      }`}
    >
      מקום פרסומת
    </div>
  );
}
