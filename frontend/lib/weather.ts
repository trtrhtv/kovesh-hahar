export type WeatherInfo = {
  tempC: number;
  weatherCode: number;
  windKph: number;
  rainLast3DaysMm: number;
};

const WEATHER_DESCRIPTIONS: Record<number, { label: string; icon: string }> = {
  0: { label: "בהיר", icon: "☀️" },
  1: { label: "בהיר בעיקר", icon: "🌤️" },
  2: { label: "מעונן חלקית", icon: "⛅" },
  3: { label: "מעונן", icon: "☁️" },
  45: { label: "ערפל", icon: "🌫️" },
  48: { label: "ערפל קפוא", icon: "🌫️" },
  51: { label: "טפטוף קל", icon: "🌦️" },
  53: { label: "טפטוף", icon: "🌦️" },
  55: { label: "טפטוף חזק", icon: "🌧️" },
  61: { label: "גשם קל", icon: "🌧️" },
  63: { label: "גשם", icon: "🌧️" },
  65: { label: "גשם חזק", icon: "🌧️" },
  71: { label: "שלג קל", icon: "❄️" },
  73: { label: "שלג", icon: "❄️" },
  75: { label: "שלג כבד", icon: "❄️" },
  80: { label: "ממטרים קלים", icon: "🌦️" },
  81: { label: "ממטרים", icon: "🌧️" },
  82: { label: "ממטרים עזים", icon: "⛈️" },
  95: { label: "סופת רעמים", icon: "⛈️" },
};

export function describeWeatherCode(code: number) {
  return WEATHER_DESCRIPTIONS[code] || { label: "לא ידוע", icon: "🌡️" };
}

/**
 * Open-Meteo - חינמי לגמרי, בלי מפתח API, בלי הרשמה. מחזיר גם תנאים נוכחיים
 * וגם סכום גשם ב-3 הימים האחרונים (פרוקסי לסיכון בוץ/קרקע רטובה).
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=precipitation_sum&past_days=3&forecast_days=1&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // מתעדכן כל חצי שעה, לא בכל בקשה
    if (!res.ok) return null;
    const data = await res.json();

    const rainLast3Days: number = (data.daily?.precipitation_sum || [])
      .slice(0, 3)
      .reduce((sum: number, v: number) => sum + (v || 0), 0);

    return {
      tempC: Math.round(data.current?.temperature_2m ?? 0),
      weatherCode: data.current?.weather_code ?? 0,
      windKph: Math.round(data.current?.wind_speed_10m ?? 0),
      rainLast3DaysMm: Math.round(rainLast3Days * 10) / 10,
    };
  } catch {
    return null;
  }
}
