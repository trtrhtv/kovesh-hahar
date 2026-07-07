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
      if (/country|boundary|disputed|state-label/i.test(id)) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
    });
  } catch {
    // אם המפה עוד לא מוכנה או שהשכבות שונות בגרסה - פשוט לא עושים כלום
  }
}
