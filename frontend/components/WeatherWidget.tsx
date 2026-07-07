import { fetchWeather, describeWeatherCode } from "@/lib/weather";

export default async function WeatherWidget({ lat, lon }: { lat?: number | null; lon?: number | null }) {
  if (lat == null || lon == null) return null;

  const weather = await fetchWeather(lat, lon);
  if (!weather) return null;

  const desc = describeWeatherCode(weather.weatherCode);
  const muddyRisk = weather.rainLast3DaysMm >= 8; // סף גס - מעל 8 מ"מ ב-3 ימים נחשב סיכון בוץ ממשי

  return (
    <div className="moto-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{desc.icon}</span>
        <div>
          <div className="stat-number text-2xl font-black text-ink leading-none">{weather.tempC}°</div>
          <div className="text-[11px] text-textDim mt-1">{desc.label} · רוח {weather.windKph} קמ"ש</div>
        </div>
      </div>

      <div className="sm:border-r sm:border-edge sm:pr-4">
        {muddyRisk ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-moto font-bold">⚠️ סיכון בוץ</span>
            <span className="text-textDim text-xs">
              ירדו {weather.rainLast3DaysMm} מ"מ ב-3 הימים האחרונים באזור
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-400 font-bold">✓ קרקע יבשה כנראה</span>
            <span className="text-textDim text-xs">
              {weather.rainLast3DaysMm > 0 ? `${weather.rainLast3DaysMm} מ"מ גשם ב-3 ימים` : "אין גשם לאחרונה"}
            </span>
          </div>
        )}
        <p className="text-[10px] text-textDim mt-1">
          הערכה אוטומטית לפי כמות גשם - לא תחליף לעדכון שטח אמיתי מרוכב שהיה שם
        </p>
      </div>
    </div>
  );
}
