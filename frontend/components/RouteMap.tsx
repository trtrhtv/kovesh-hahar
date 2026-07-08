"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { stripPoliticalLayers, ensureRTLTextPlugin, addSatelliteToggle, locateAndFly } from "@/lib/mapUtils";
import LocateButton from "@/components/LocateButton";

// OpenFreeMap - שירות מפות חינמי לגמרי, בלי מפתח API, בלי הרשמה, בלי הגבלת שימוש.
// מבוסס נתוני OpenStreetMap. ראה https://openfreemap.org
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function RouteMap({
  profileJson,
  className = "",
}: {
  profileJson?: string | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<(() => boolean) | null>(null);
  const mapRef = useRef<any>(null);
  const maplibreglRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [satelliteOn, setSatelliteOn] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileJson || !containerRef.current) return;

    let points: [number, number, number][] = [];
    try {
      points = JSON.parse(profileJson);
    } catch {
      return;
    }
    if (!points.length) return;

    let map: any;
    let cancelled = false;

    // ייבוא דינמי - maplibre-gl תלוי ב-window, אסור לטעון אותו ב-SSR
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !containerRef.current) return;
      ensureRTLTextPlugin(maplibregl.default);

      const coordinates = points.map((p) => [p[1], p[0]]); // GPX הוא [lat, lon], המפה רוצה [lon, lat]

      map = new maplibregl.default.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: coordinates[0] as [number, number],
        zoom: 11,
      });
      mapRef.current = map;
      maplibreglRef.current = maplibregl.default;

      map.addControl(new maplibregl.default.NavigationControl(), "top-left");
      map.addControl(new maplibregl.default.FullscreenControl(), "top-left");

      map.on("load", () => {
        stripPoliticalLayers(map);

        const baseLayerIds = map.getStyle().layers.map((l: any) => l.id);
        toggleRef.current = addSatelliteToggle(map, baseLayerIds);

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#FF6600", "line-width": 4 },
        });

        new maplibregl.default.Marker({ color: "#5C6B47" })
          .setLngLat(coordinates[0] as [number, number])
          .addTo(map);

        const bounds = coordinates.reduce(
          (b: any, coord: any) => b.extend(coord),
          new maplibregl.default.LngLatBounds(coordinates[0] as any, coordinates[0] as any)
        );
        map.fitBounds(bounds, { padding: 40, duration: 0 });
      });
    });

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [profileJson]);

  if (!profileJson) {
    return (
      <div className={`flex items-center justify-center bg-surfaceHi text-textDim text-sm ${className}`}>
        לא צורף מסלול GPX לסיפור הזה
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-2">
        <LocateButton
          onClick={() =>
            mapRef.current &&
            locateAndFly(mapRef.current, maplibreglRef.current, userMarkerRef, setLocateError)
          }
        />
        {locateError && (
          <span className="bg-surfaceHi border border-edge text-moto text-xs px-2.5 py-1.5 max-w-[220px]">
            {locateError}
          </span>
        )}
      </div>
      <button
        onClick={() => setSatelliteOn(toggleRef.current ? toggleRef.current() : false)}
        className="absolute bottom-3 right-3 z-10 bg-surface border border-edge px-4 py-2.5 min-h-[44px] text-xs font-bold hover:border-moto transition-colors shadow-sm"
      >
        {satelliteOn ? "מפה רגילה" : "מפת לוויין"}
      </button>
    </div>
  );
}
