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
