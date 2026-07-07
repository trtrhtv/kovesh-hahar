/**
 * מקום שמור לפרסומת. כרגע placeholder בלבד - כשיהיה מוכן לחבר רשת פרסום
 * אמיתית (Google AdSense, פרסום ישיר וכו'), כאן המקום להטמיע את הקוד.
 */
export default function AdBanner({ variant = "horizontal" }: { variant?: "horizontal" | "square" }) {
  return (
    <div
      className={`border border-dashed border-edge flex items-center justify-center text-textDim text-xs tracking-wider ${
        variant === "horizontal" ? "h-20" : "h-40"
      }`}
    >
      מקום פרסומת
    </div>
  );
}
