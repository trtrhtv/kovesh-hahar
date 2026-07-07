export default function ParkingSecurityTag({ status }: { status?: string | null }) {
  if (!status) return null;

  if (status === "safe") {
    return (
      <div className="border border-emerald-800 bg-emerald-950/30 text-emerald-400 text-xs sm:text-sm font-bold px-3 py-2.5 flex items-center gap-2">
        <span>🔒</span>
        <span>אזור חניה בטוח - נראות גבוהה, מתאים להשארת רכב/טריילר</span>
      </div>
    );
  }

  return (
    <div className="border border-red-800 bg-red-950/30 text-red-500 text-xs sm:text-sm font-bold px-3 py-2.5 flex items-center gap-2 animate-pulse">
      <span>⚠️</span>
      <span>סיכון גניבה גבוה באזור - לא מומלץ להשאיר רכבים ללא השגחה</span>
    </div>
  );
}
