import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import auth_router, stories_router, comments_router, trail_updates_router, contact_router, users_router, notifications_router, events_router
from . import storage

# מבנה מסד הנתונים מנוהל עכשיו על ידי Alembic (ראה alembic/), לא כאן.
# כל שינוי מבנה: `alembic revision --autogenerate -m "..."` ואז `alembic upgrade head`
# רץ אוטומטית לפני עליית השרת (ראה Start Command ב-Railway).

app = FastAPI(title="כובש ההר - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # יש לצמצם לדומיין האמיתי של הפרונט לפני production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(stories_router.router)
app.include_router(comments_router.router)
app.include_router(trail_updates_router.router)
app.include_router(contact_router.router)
app.include_router(users_router.router)
app.include_router(notifications_router.router)
app.include_router(events_router.router)

# כשמשתמשים באחסון מקומי (ברירת מחדל) - מגישים את הקבצים שהועלו ישירות דרך ה-API
if storage.STORAGE_BACKEND == "local":
    os.makedirs(storage.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount("/media", StaticFiles(directory=storage.LOCAL_UPLOAD_DIR), name="media")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "roadstory-api"}
