"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { stripPoliticalLayers, ensureRTLTextPlugin } from "@/lib/mapUtils";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ISRAEL_CENTER: [number, number] = [35.0, 31.5];

/**
 * מפה שבה כל קליק מוסיף נקודה למסלול - חלופה לקובץ GPX למי שאין לו אחד,
 * אבל יודע בערך איפה רכב. onPointsChange מקבל מערך [lat, lon][] בכל שינוי.
 */
export default function RouteDrawer({
  onPointsChange,
  className = "",
}: {
  onPointsChange: (points: [number, number][]) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreglRef = useRef<any>(null);
  const pointsRef = useRef<[number, number][]>([]); // [lat, lon][]
  const markersRef = useRef<any[]>([]);
  const [pointCount, setPointCount] = useState(0);

  function redrawLine() {
    const map = mapRef.current;
    if (!map || !map.getSource("drawn-route")) return;
    const coords = pointsRef.current.map(([lat, lon]) => [lon, lat]); // GeoJSON = [lon, lat]
    map.getSource("drawn-route").setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords },
    });
  }

  function addPoint(lat: number, lon: number) {
    const maplibregl = maplibreglRef.current;
    pointsRef.current = [...pointsRef.current, [lat, lon]];
    setPointCount(pointsRef.current.length);
    onPointsChange(pointsRef.current);

    const el = document.createElement("div");
    el.style.width = "10px";
    el.style.height = "10px";
    el.style.borderRadius = "50%";
    el.style.background = "#FF6600";
    el.style.border = "2px solid white";
    const marker = new maplibregl.Marker({ element: el }).setLngLat([lon, lat]).addTo(mapRef.current);
    markersRef.current.push(marker);

    redrawLine();
  }

  function undoLast() {
    if (pointsRef.current.length === 0) return;
    pointsRef.current = pointsRef.current.slice(0, -1);
    setPointCount(pointsRef.current.length);
    onPointsChange(pointsRef.current);
    const marker = markersRef.current.pop();
    marker?.remove();
    redrawLine();
  }

  function clearAll() {
    pointsRef.current = [];
    setPointCount(0);
    onPointsChange([]);
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    redrawLine();
  }

  useEffect(() => {
    if (!containerRef.current) return;
    let map: any;
    let cancelled = false;

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !containerRef.current) return;
      ensureRTLTextPlugin(maplibregl.default);
      maplibreglRef.current = maplibregl.default;

      map = new maplibregl.default.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: ISRAEL_CENTER,
        zoom: 7,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.default.NavigationControl(), "top-left");

      map.on("load", () => {
        stripPoliticalLayers(map);

        map.addSource("drawn-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        });
        map.addLayer({
          id: "drawn-route-line",
          type: "line",
          source: "drawn-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#FF6600", "line-width": 4, "line-dasharray": [2, 1] },
        });

        map.on("click", (e: any) => {
          addPoint(e.lngLat.lat, e.lngLat.lng);
        });
      });
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-10 moto-card px-3 py-2 text-xs text-ink font-bold">
        {pointCount === 0 ? "לחץ על המפה כדי להתחיל לשרטט" : `${pointCount} נקודות`}
      </div>
      <div className="absolute bottom-3 right-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={undoLast}
          disabled={pointCount === 0}
          className="switch-btn text-xs font-bold text-ink px-3 py-2 disabled:opacity-40"
        >
          ↩ בטל נקודה אחרונה
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={pointCount === 0}
          className="switch-btn text-xs font-bold text-moto px-3 py-2 disabled:opacity-40"
        >
          🗑 נקה הכל
        </button>
      </div>
    </div>
  );
}
