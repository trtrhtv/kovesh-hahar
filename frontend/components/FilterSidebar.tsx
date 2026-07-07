"use client";

import { useState } from "react";
import { ISRAEL, ISRAEL_REGIONS, COUNTRIES } from "@/lib/locations";
import { RIDE_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";

export default function FilterSidebar({
  defaults,
}: {
  defaults: {
    country?: string;
    region?: string;
    ride_type?: string;
    difficulty?: string;
    search?: string;
  };
}) {
  const [country, setCountry] = useState(defaults.country || "");

  return (
    <form method="get" className="flex flex-col gap-5 sticky top-6">
      <div>
        <label className="block text-xs font-bold text-char/60 mb-1.5 tracking-wide">
          חיפוש חופשי
        </label>
        <input
          type="text"
          name="search"
          defaultValue={defaults.search}
          placeholder="שם מסלול..."
          className="w-full border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-char/60 mb-1.5 tracking-wide">
          מדינה
        </label>
        <select
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
        >
          <option value="">כל המדינות</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {country === ISRAEL && (
        <div>
          <label className="block text-xs font-bold text-char/60 mb-1.5 tracking-wide">
            אזור בארץ
          </label>
          <select
            name="region"
            defaultValue={defaults.region}
            className="w-full border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
          >
            <option value="">כל האזורים</option>
            {ISRAEL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-char/60 mb-1.5 tracking-wide">
          סוג רכיבה
        </label>
        <select
          name="ride_type"
          defaultValue={defaults.ride_type}
          className="w-full border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
        >
          <option value="">הכל</option>
          {Object.entries(RIDE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-char/60 mb-1.5 tracking-wide">
          רמת קושי
        </label>
        <select
          name="difficulty"
          defaultValue={defaults.difficulty}
          className="w-full border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
        >
          <option value="">הכל</option>
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="bg-char text-sand py-2.5 font-bold text-sm hover:bg-oxide transition-colors"
      >
        סנן תוצאות
      </button>
    </form>
  );
}
