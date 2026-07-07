from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import auth_router, stories_router

# יוצר את הטבלאות אם לא קיימות. לפרודקשן אמיתי כדאי לעבור ל-alembic migrations,
# אבל לשלב ה-MVP זה מספיק פשוט ועובד.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="סיפור דרך - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # יש לצמצם לדומיין האמיתי של הפרונט לפני production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(stories_router.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "roadstory-api"}
