import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """מרחק במעוף ציפור בין שתי נקודות על פני כדור הארץ, בק"מ"""
    r = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return r * 2 * math.asin(math.sqrt(a))


def route_distance_km(points: list) -> float:
    """סכום מרחקי הקטעים לאורך כל נקודות המסלול - points הוא רשימת [lat, lon]"""
    total = 0.0
    for i in range(1, len(points)):
        lat1, lon1 = points[i - 1][0], points[i - 1][1]
        lat2, lon2 = points[i][0], points[i][1]
        total += haversine_km(lat1, lon1, lat2, lon2)
    return total
