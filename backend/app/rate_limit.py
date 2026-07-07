import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request

_attempts: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def check_rate_limit(request: Request, action: str, max_attempts: int = 5, window_seconds: int = 900):
    """מגביל לפי IP - פשוט (זיכרון תהליך, לא Redis), מספיק לשלב הזה.
    אם בעתיד נריץ כמה workers/instances במקביל, זה יפסיק להיות אמין וצריך Redis אמיתי.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"{action}:{client_ip}"
    now = time.time()

    with _lock:
        attempts = [t for t in _attempts[key] if now - t < window_seconds]
        if len(attempts) >= max_attempts:
            retry_minutes = int((window_seconds - (now - attempts[0])) / 60) + 1
            raise HTTPException(
                429,
                f"יותר מדי ניסיונות. נסה שוב בעוד כ-{retry_minutes} דקות.",
            )
        attempts.append(now)
        _attempts[key] = attempts
