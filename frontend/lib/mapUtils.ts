/**
 * MapLibre מצייר טקסט על קנבס ולא כ-HTML רגיל, ובלי התוסף הזה הוא לא יודע
 * "לחבר" אותיות עבריות/ערביות לפי כיוון RTL - הטקסט יוצא מעוות. התוסף הרשמי
 * מלמד אותו לעשות שיבוץ (shaping) נכון. צריך לקרוא לזה פעם אחת בלבד, לפני
 * יצירת כל מופע מפה.
 */
let rtlPluginLoaded = false;

export function ensureRTLTextPlugin(maplibregl: any) {
  if (rtlPluginLoaded) return;
  rtlPluginLoaded = true;
  maplibregl.setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
    true // lazy - נטען רק כשבאמת יש טקסט RTL להציג
  );
}

/**
 * יוצר מרקר "אני כאן" עם אפקט ראדאר פועם (טבעת מתרחבת + נקודה מוצקה),
 * בצבע האקצנט הפעיל כדי שיתאים תמיד למותג שנבחר בבורר ה-theme.
 */
export function createUserLocationMarker(maplibregl: any, lngLat: [number, number]) {
  const el = document.createElement("div");
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.position = "relative";
  el.innerHTML = `
    <span class="absolute inset-0 rounded-full animate-ping" style="background-color: rgb(var(--accent-rgb) / 0.6)"></span>
    <span class="absolute inset-[3px] rounded-full border-2 border-white" style="background-color: rgb(var(--accent-rgb))"></span>
  `;
  return new maplibregl.Marker({ element: el });
}

/**
 * מאתר את מיקום המשתמש (Geolocation API), טס אליו על המפה, ומציב/מעדכן
 * את מרקר "אני כאן". markerHolder הוא useRef כדי לשמור מופע יחיד ולא
 * להערים מרקרים בכל לחיצה.
 */
export function locateAndFly(
  map: any,
  maplibregl: any,
  markerHolder: { current: any },
  onError?: (msg: string) => void
) {
  if (!navigator.geolocation) {
    onError?.("הדפדפן הזה לא תומך באיתור מיקום");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.flyTo({ center: [longitude, latitude], zoom: 14, speed: 1.4 });
      if (markerHolder.current) markerHolder.current.remove();
      markerHolder.current = createUserLocationMarker(maplibregl, [longitude, latitude])
        .setLngLat([longitude, latitude])
        .addTo(map);
    },
    () => onError?.("לא הצלחנו לאתר את המיקום - ודא שנתת הרשאת מיקום לדפדפן"),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

/**
 * מוסיף מקור מפת לוויין (Esri World Imagery - חינמי, בלי מפתח API) כשכבה
 * כבויה כברירת מחדל, ומחזירה פונקציית toggle שמחליפה בינה לבין המפה הרגילה.
 * baseLayerIds הן כל שכבות המפה הבסיסית (חוץ מהמסלול/נעצים שלנו) - הן מוסתרות
 * כשהלוויין פעיל ומוצגות חזרה כשמכבים אותו.
 */
export function addSatelliteToggle(map: any, baseLayerIds: string[]): () => boolean {
  map.addSource("satellite", {
    type: "raster",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    attribution: "Esri, Maxar, Earthstar Geographics",
  });

  map.addLayer(
    {
      id: "satellite-layer",
      type: "raster",
      source: "satellite",
      layout: { visibility: "none" },
    },
    baseLayerIds[0] // מתחת לכל שכבה בסיסית, כדי שה-toggle יעבוד נקי
  );

  let satelliteOn = false;

  return function toggleSatellite() {
    satelliteOn = !satelliteOn;
    map.setLayoutProperty("satellite-layer", "visibility", satelliteOn ? "visible" : "none");
    baseLayerIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", satelliteOn ? "none" : "visible");
      }
    });
    return satelliteOn;
  };
}

/**
 * מסיר משכבות המפה כל תיוג גבולות/שמות מדינה - בכוונה וללא הבחנה בין צד לצד.
 * המפה כאן משמשת להצגת מסלולי רכיבה, לא כהצהרה גיאופוליטית, ואנחנו לא
 * הכתובת הנכונה להכריע במחלוקות ריבונות בין-לאומיות. נשארים: כבישים, שבילים,
 * פני שטח, מים, ושמות יישובים (רלוונטיים לניווט בפועל).
 */
export function stripPoliticalLayers(map: any) {
  try {
    const style = map.getStyle();
    if (!style?.layers) return;

    style.layers.forEach((layer: any) => {
      const id: string = layer.id || "";
      const sourceLayer: string = layer["source-layer"] || "";

      const isBoundaryLine = sourceLayer === "boundary"; // כל קווי הגבול, בין אם שנויים במחלוקת או לא
      const isCountryLabel = sourceLayer === "place" && /country/i.test(id);
      const matchesById = /country|boundary|disputed|state-label/i.test(id);

      if (isBoundaryLine || isCountryLabel || matchesById) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
    });
  } catch {
    // אם המפה עוד לא מוכנה או שהשכבות שונות בגרסה - פשוט לא עושים כלום
  }
}
