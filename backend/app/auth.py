import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from . import models

_DEFAULT_SECRET = "change-me-in-production"
SECRET_KEY = os.getenv("JWT_SECRET_KEY", _DEFAULT_SECRET)

# בפרודקשן (DB אמיתי, לא SQLite מקומי) אסור לרוץ עם הסוד ברירת-המחדל: מי שקורא
# את הריפו הציבורי יכול לזייף טוקן לכל משתמש. נכשלים מיד בעליית השרת במקום להיחשף.
# פיתוח מקומי (בלי DATABASE_URL - נופל ל-SQLite) ממשיך לעבוד עם ברירת המחדל.
if SECRET_KEY == _DEFAULT_SECRET:
    _db_url = os.getenv("DATABASE_URL", "")
    if _db_url and not _db_url.startswith("sqlite"):
        raise RuntimeError(
            "JWT_SECRET_KEY לא מוגדר. חובה להגדיר סוד אקראי ארוך במשתני הסביבה "
            "לפני הרצה בפרודקשן."
        )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
COOKIE_NAME = "access_token"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# auto_error=False בשניהם - כי אנחנו בודקים קוקי או header, לא רק אחד מהם
_header_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _decode_user_id(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def _resolve_token(
    cookie_token: Optional[str],
    header_token: Optional[str],
) -> Optional[str]:
    """קוקי (httpOnly, השיטה החדשה והבטוחה יותר) קודם - אם אין, נופלים חזרה
    ל-Authorization header (השיטה הישנה) כדי לא לשבור קריאות קיימות בפרונט
    שעדיין לא עברו למנגנון החדש."""
    return cookie_token or header_token


def get_current_user(
    cookie_token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    header_token: Optional[str] = Depends(_header_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="פרטי ההתחברות לא תקינים",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = _resolve_token(cookie_token, header_token)
    if not token:
        raise credentials_exception

    user_id = _decode_user_id(token)
    if not user_id:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_user_optional(
    cookie_token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    header_token: Optional[str] = Depends(_header_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """כמו get_current_user, אבל מחזיר None במקום לזרוק שגיאה כשאין token - לעמודים ציבוריים
    שרוצים לדעת אם יש משתמש מחובר (למשל: האם אני כבר רשום לאירוע הזה)"""
    token = _resolve_token(cookie_token, header_token)
    if not token:
        return None
    user_id = _decode_user_id(token)
    if not user_id:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
