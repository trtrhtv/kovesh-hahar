import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-5 gap-6">
      <div className="font-mono text-xs text-moto tracking-[0.3em]">[404 // מחוץ למסלול]</div>
      <h1 className="text-6xl sm:text-7xl font-black text-ink leading-none">404</h1>
      <p className="text-textDim max-w-md leading-relaxed">
        הדף שחיפשת לא נמצא - אולי המסלול השתנה, או שהקישור שבור.
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="tactical-btn bg-moto text-onAccent hover:bg-motoDark !px-5"
        >
          ⌂ חזרה לדף הבית
        </Link>
        <Link href="/stories" className="switch-btn text-ink px-4 py-2.5 text-sm font-bold">
          עיין במסלולים
        </Link>
      </div>
    </main>
  );
}
