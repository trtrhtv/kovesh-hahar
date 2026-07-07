"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { stripPoliticalLayers, ensureRTLTextPlugin, addSatelliteToggle, locateAndFly } from "@/lib/mapUtils";
import LocateButton from "@/components/LocateButton";
import type { StoryListItem } from "@/lib/api";
import { DIFFICULTY_COLORS } from "@/lib/labels";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ISRAEL_CENTER: [number, number] = [35.0, 31.5];

export default function OverviewMap({
  stories,
  className = "",
}: {
  stories: StoryListItem[];
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
    if (!containerRef.current) return;

    const pinned = stories.filter((s) => s.pin_lat != null && s.pin_lon != null);

    let map: any;
    let cancelled = false;
    const markers: any[] = [];

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !containerRef.current) return;
      ensureRTLTextPlugin(maplibregl.default);

      map = new maplibregl.default.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: pinned[0] ? [pinned[0].pin_lon!, pinned[0].pin_lat!] : ISRAEL_CENTER,
        zoom: pinned.length ? 7 : 6.5,
      });
      mapRef.current = map;
      maplibreglRef.current = maplibregl.default;

      map.addControl(new maplibregl.default.NavigationControl(), "top-left");
      map.addControl(new maplibregl.default.FullscreenControl(), "top-left");

      map.on("load", () => {
        stripPoliticalLayers(map);

        const baseLayerIds = map.getStyle().layers.map((l: any) => l.id);
        toggleRef.current = addSatelliteToggle(map, baseLayerIds);

        if (!pinned.length) return;

        pinned.forEach((story) => {
          const color = DIFFICULTY_COLORS[story.difficulty] || "#FF6600";
          const el = document.createElement("a");
          el.href = `/stories/${story.id}`;
          el.style.display = "block";
          el.style.width = "14px";
          el.style.height = "14px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = color;
          el.style.border = "2px solid #E8E1D3";
          el.style.cursor = "pointer";

          const popup = new maplibregl.default.Popup({ offset: 12, closeButton: false }).setHTML(
            `<div style="font-family: sans-serif; font-size: 13px; direction: rtl;">${story.title}</div>`
          );

          const marker = new maplibregl.default.Marker({ element: el })
            .setLngLat([story.pin_lon!, story.pin_lat!])
            .setPopup(popup)
            .addTo(map);
          markers.push(marker);
        });

        if (pinned.length > 1) {
          const bounds = pinned.reduce(
            (b: any, s) => b.extend([s.pin_lon!, s.pin_lat!]),
            new maplibregl.default.LngLatBounds(
              [pinned[0].pin_lon!, pinned[0].pin_lat!],
              [pinned[0].pin_lon!, pinned[0].pin_lat!]
            )
          );
          map.fitBounds(bounds, { padding: 60, duration: 0 });
        }
      });
    });

    return () => {
      cancelled = true;
      markers.forEach((m) => m.remove());
      if (map) map.remove();
    };
  }, [stories]);

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
        className="absolute bottom-3 right-3 z-10 bg-surface border border-edge px-4 py-2.5 min-h-[40px] text-xs font-bold hover:border-moto transition-colors shadow-sm"
      >
        {satelliteOn ? "מפה רגילה" : "מפת לוויין"}
      </button>
    </div>
  );
}
