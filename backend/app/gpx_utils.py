import json
import gpxpy


def parse_gpx(file_bytes: bytes) -> dict:
    """
    מקבל תוכן קובץ GPX גולמי ומחזיר:
    - distance_km: מרחק כולל
    - elevation_gain_m: טיפוס מצטבר (רק עליות, לא ירידות)
    - elevation_profile: רשימה מדוללת של נקודות [lat, lon, elevation] לצורך ציור המפה וקו החתימה
    - start_lat / start_lon: נקודת ההתחלה
    """
    gpx = gpxpy.parse(file_bytes.decode("utf-8", errors="ignore"))

    points = []
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                points.append(point)

    # חלק מקבצי ה-GPX משתמשים ב-routes במקום tracks
    if not points:
        for route in gpx.routes:
            for point in route.points:
                points.append(point)

    if not points:
        raise ValueError("לא נמצאו נקודות מסלול בקובץ ה-GPX")

    distance_m = gpx.length_2d() or gpx.length_3d() or 0
    uphill, _downhill = gpx.get_uphill_downhill()

    # דילול הנקודות ל-~150 נקודות מקסימום - מספיק לציור חלק, לא מכביד על ה-DB/ה-JSON
    max_points = 150
    step = max(1, len(points) // max_points)
    thinned = points[::step]

    profile = [
        [round(p.latitude, 6), round(p.longitude, 6), round(p.elevation or 0, 1)]
        for p in thinned
    ]

    return {
        "distance_km": round(distance_m / 1000, 2),
        "elevation_gain_m": round(uphill or 0, 1),
        "elevation_profile": profile,
        "start_lat": points[0].latitude,
        "start_lon": points[0].longitude,
    }


def profile_to_json(profile: list) -> str:
    return json.dumps(profile)
