import Link from "next/link";

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "offset" && v) as [string, string][]
  );
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default function Pagination({
  basePath,
  params,
  currentPage,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  // בונה רשימת עמודים עם "..." כשיש הרבה - תמיד מציג ראשון, אחרון, ושכנים לעמוד הנוכחי
  const pages: (number | "...")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 flex-wrap mt-8" aria-label="עימוד">
      <Link
        href={buildHref(basePath, params, Math.max(1, currentPage - 1))}
        className={`switch-btn text-xs font-bold px-3 py-2 ${currentPage === 1 ? "pointer-events-none opacity-30" : "text-ink"}`}
      >
        ← הקודם
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="text-textDim text-xs px-1">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, params, p)}
            className={`switch-btn text-xs font-bold w-9 h-9 flex items-center justify-center ${
              p === currentPage ? "active text-moto" : "text-ink"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(basePath, params, Math.min(totalPages, currentPage + 1))}
        className={`switch-btn text-xs font-bold px-3 py-2 ${
          currentPage === totalPages ? "pointer-events-none opacity-30" : "text-ink"
        }`}
      >
        הבא →
      </Link>
    </nav>
  );
}
