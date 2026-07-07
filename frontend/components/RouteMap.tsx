"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function RouteMap({
  profileJson,
  className = "",
}: {
  profileJson?: string | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !profileJson || !containerRef.current) return;

    let points: [number, number, number][] = [];
    try {
      points = JSON.parse(profileJson);
    } catch {
      return;
    }
    if (!points.length) return;

    let map: any;
    let cancelled = false;

    // ייבוא דינמי - mapbox-gl תלוי ב-window, אסור לטעון אותו ב-SSR
    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.default.accessToken = MAPBOX_TOKEN;

      const coordinates = points.map((p) => [p[1], p[0]]); // GPX הוא [lat, lon], Mapbox רוצה [lon, lat]

      map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: coordinates[0] as [number, number],
        zoom: 11,
      });

      map.on("load", () => {
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
          paint: { "line-color": "#A8462E", "line-width": 4 },
        });

        new mapboxgl.default.Marker({ color: "#5C6B47" })
          .setLngLat(coordinates[0] as [number, number])
          .addTo(map);

        const bounds = coordinates.reduce(
          (b: any, coord: any) => b.extend(coord),
          new mapboxgl.default.LngLatBounds(coordinates[0] as any, coordinates[0] as any)
        );
        map.fitBounds(bounds, { padding: 40, duration: 0 });
      });
    });

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [profileJson]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-sandDark text-char/50 text-sm ${className}`}>
        כדי להציג מפה יש להגדיר NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  if (!profileJson) {
    return (
      <div className={`flex items-center justify-center bg-sandDark text-char/50 text-sm ${className}`}>
        לא צורף מסלול GPX לסיפור הזה
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
