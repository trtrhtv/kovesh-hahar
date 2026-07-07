"use client";

import { useState } from "react";
import { ISRAEL, ISRAEL_REGIONS, COUNTRIES } from "@/lib/locations";
import {
  VEHICLE_TYPE_LABELS,
  RIDE_STYLE_LABELS,
  DIFFICULTY_LABELS,
  SEASON_LABELS,
} from "@/lib/labels";

export default function FilterSidebar({
  defaults,
}: {
  defaults: {
    country?: string;
    region?: string;
    vehicle_type?: string;
    ride_style?: string;
    difficulty?: string;
    season?: string;
    search?: string;
  };
}) {
  const [country, setCountry] = useState(defaults.country || "");

  return (
    <form method="get" className="flex flex-col gap-5 sticky top-6">
      <div>
        <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
          חיפוש חופשי
        </label>
        <input
          type="text"
          name="search"
          defaultValue={defaults.search}
          placeholder="שם מסלול..."
          className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
          מדינה
        </label>
        <select
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
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
          <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
            אזור בארץ
          </label>
          <select
            name="region"
            defaultValue={defaults.region}
            className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
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
        <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
          סוג אופנוע
        </label>
        <select
          name="vehicle_type"
          defaultValue={defaults.vehicle_type}
          className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
        >
          <option value="">הכל</option>
          {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
          סגנון רכיבה
        </label>
        <select
          name="ride_style"
          defaultValue={defaults.ride_style}
          className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
        >
          <option value="">הכל</option>
          {Object.entries(RIDE_STYLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
          רמת קושי
        </label>
        <select
          name="difficulty"
          defaultValue={defaults.difficulty}
          className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
        >
          <option value="">הכל</option>
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">
          עונה מומלצת
        </label>
        <select
          name="season"
          defaultValue={defaults.season}
          className="w-full border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
        >
          <option value="">הכל</option>
          {Object.entries(SEASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="bg-surfaceHi text-ink py-2.5 font-bold text-sm hover:bg-moto hover:text-carbon transition-colors"
      >
        סנן תוצאות
      </button>
    </form>
  );
}
