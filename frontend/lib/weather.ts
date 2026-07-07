export type ForecastDay = {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  rainMm: number;
};

export type WeatherInfo = {
  tempC: number;
  weatherCode: number;
  windKph: number;
  rainLast3DaysMm: number;
  forecast: ForecastDay[];
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min&past_days=3&forecast_days=4&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // מתעדכן כל חצי שעה, לא בכל בקשה
    if (!res.ok) return null;
    const data = await res.json();

    const dailyDates: string[] = data.daily?.time || [];
    const dailyRain: number[] = data.daily?.precipitation_sum || [];
    const dailyCode: number[] = data.daily?.weather_code || [];
    const dailyMax: number[] = data.daily?.temperature_2m_max || [];
    const dailyMin: number[] = data.daily?.temperature_2m_min || [];

    // past_days=3 אומר שה-3 הימים הראשונים במערך הם עבר, והשאר (מאינדקס 3) הם היום+עתיד
    const rainLast3Days = dailyRain.slice(0, 3).reduce((sum, v) => sum + (v || 0), 0);

    const forecast: ForecastDay[] = dailyDates.slice(3).map((date, i) => ({
      date,
      weatherCode: dailyCode[i + 3] ?? 0,
      tempMaxC: Math.round(dailyMax[i + 3] ?? 0),
      tempMinC: Math.round(dailyMin[i + 3] ?? 0),
      rainMm: Math.round((dailyRain[i + 3] ?? 0) * 10) / 10,
    }));

    return {
      tempC: Math.round(data.current?.temperature_2m ?? 0),
      weatherCode: data.current?.weather_code ?? 0,
      windKph: Math.round(data.current?.wind_speed_10m ?? 0),
      rainLast3DaysMm: Math.round(rainLast3Days * 10) / 10,
      forecast,
    };
  } catch {
    return null;
  }
}
