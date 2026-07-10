import os
import re
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .routers import auth_router, stories_router, comments_router, trail_updates_router, contact_router, users_router, notifications_router, events_router, reports_router
from . import storage

# מבנה מסד הנתונים מנוהל עכשיו על ידי Alembic (ראה alembic/), לא כאן.
# כל שינוי מבנה: `alembic revision --autogenerate -m "..."` ואז `alembic upgrade head`
# רץ אוטומטית לפני עליית השרת (ראה Start Command ב-Railway).

# מעקב שגיאות - רק אם מוגדר SENTRY_DSN ב-Variables, אחרת פשוט לא עושה כלום
# (בלי DSN, sentry_sdk.init לא נקרא בכלל - אין שום השפעה על האפליקציה)
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1,  # רק 10% מהבקשות התקינות נשלחות למעקב ביצועים - חוסך מכסה
        send_default_pii=False,  # לא שולחים מידע מזהה של משתמשים (אימייל, IP) לשירות חיצוני
    )

app = FastAPI(title="כובש ההר - API")

# CORS מוגבל לדומיינים ספציפיים - זו לא בחירה, זו דרישה טכנית: דפדפנים חוסמים
# עוגיות (credentials) לגמרי כשה-CORS מוגדר ל-wildcard ("*"). מגדירים את הדומיין
# האמיתי של הפרונט דרך CORS_ORIGINS (מחרוזת מופרדת בפסיקים, ב-Railway Variables),
# ותומכים גם אוטומטית בכל preview deployment של Vercel (project-git-branch.vercel.app).
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
_extra_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()]

# אין להתיר את כל *.vercel.app: כל אתר חינמי ב-vercel.app הוא origin שאפשר להשיג,
# ועם allow_credentials=True זה מאפשר לכל אתר כזה לשלוח בקשות מאומתות ולקרוא את
# התשובות בשם משתמש מחובר (השתלטות חשבון). לתמיכה ב-preview deployments של הפרויקט
# עצמו, הגדירו CORS_ORIGIN_REGEX לביטוי ממוקד-פרויקט, למשל:
#   CORS_ORIGIN_REGEX=https://kovesh-hahar-.*\.vercel\.app
_cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX") or None

_allowed_origins = ["http://localhost:3000"] + _extra_origins


def _origin_allowed(origin: str) -> bool:
    """אותה רשימת היתר של CORS - משמשת גם את הגנת ה-CSRF למטה."""
    if origin in _allowed_origins:
        return True
    if _cors_origin_regex and re.fullmatch(_cors_origin_regex, origin):
        return True
    return False


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# הגנת CSRF מבוססת-Origin: העוגייה היא SameSite=None (הכרחי כי הפרונט וה-backend
# בדומיינים שונים), ולכן הדפדפן מצרף אותה גם לבקשות שמקורן באתר זר. בקשות "פשוטות"
# (טופס/multipart) לא מפעילות preflight של CORS, כך שהן מגיעות לשרת ומתבצעות גם אם
# הדפדפן חוסם את קריאת התשובה - זו פרצת CSRF. לכן חוסמים בשרת עצמו כל בקשה משנת-מצב
# שה-Origin שלה אינו ברשימת ההיתר. בקשות בלי Origin (curl, בריאות, שרת-לשרת) עוברות,
# כי מתקפת CSRF מדפדפן תמיד נושאת Origin.
_UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


@app.middleware("http")
async def csrf_origin_guard(request: Request, call_next):
    if request.method in _UNSAFE_METHODS:
        origin = request.headers.get("origin")
        if origin and not _origin_allowed(origin):
            return JSONResponse(status_code=403, content={"detail": "מקור הבקשה אינו מורשה"})
    return await call_next(request)

app.include_router(auth_router.router)
app.include_router(stories_router.router)
app.include_router(comments_router.router)
app.include_router(trail_updates_router.router)
app.include_router(contact_router.router)
app.include_router(users_router.router)
app.include_router(notifications_router.router)
app.include_router(events_router.router)
app.include_router(reports_router.router)

# כשמשתמשים באחסון מקומי (ברירת מחדל) - מגישים את הקבצים שהועלו ישירות דרך ה-API
if storage.STORAGE_BACKEND == "local":
    os.makedirs(storage.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount("/media", StaticFiles(directory=storage.LOCAL_UPLOAD_DIR), name="media")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "roadstory-api"}
