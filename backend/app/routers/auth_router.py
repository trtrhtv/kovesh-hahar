from datetime import datetime, timedelta
import re
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from .. import models, schemas, auth, admin
from ..phone import is_valid_phone
from ..rate_limit import check_rate_limit
from ..email import send_password_reset_email
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


def _slugify_username(text: str) -> str:
    """הופך שם תצוגה לבסיס לשם משתמש - אותיות/ספרות לועזיות בלבד, אין תמיכה בעברית ב-username"""
    base = re.sub(r"[^a-zA-Z0-9_]", "", text.replace(" ", "_")).lower()
    return base or "rider"


def _generate_unique_username(db: Session, display_name: str) -> str:
    base = _slugify_username(display_name)[:20]
    candidate = base
    attempt = 0
    while db.query(models.User).filter(models.User.username == candidate).first():
        attempt += 1
        candidate = f"{base}{secrets.randbelow(9000) + 1000}"
        if attempt > 5:
            candidate = f"rider{secrets.token_hex(4)}"
            break
    return candidate


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request, "register", max_attempts=10, window_seconds=3600)

    if not payload.accepted_disclaimer:
        raise HTTPException(400, "יש לאשר את הצהרת האחריות כדי להירשם")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="כבר קיים משתמש עם האימייל הזה")

    username = (payload.username or "").strip().lower() or None
    phone_number = (payload.phone_number or "").strip() or None
    if phone_number and not is_valid_phone(phone_number):
        raise HTTPException(400, "מספר הטלפון לא נראה תקין")
    if username:
        username = re.sub(r"[^a-z0-9_ ]", "", username)
        if not username:
            username = None
        elif db.query(models.User).filter(models.User.username == username).first():
            raise HTTPException(400, "שם המשתמש הזה כבר תפוס")
    if not username:
        username = _generate_unique_username(db, payload.display_name)

    user = models.User(
        email=payload.email,
        username=username,
        hashed_password=auth.hash_password(payload.password),
        display_name=payload.display_name,
        phone_number=phone_number,
        accepted_disclaimer_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(user.id)
    return schemas.Token(access_token=token)


@router.post("/login", response_model=schemas.Token)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    check_rate_limit(request, "login", max_attempts=8, window_seconds=900)

    identifier = form_data.username.strip()
    # מתחברים או עם אימייל מלא או עם שם משתמש - לא צריך להקליד @ וכו' כל פעם.
    # אימייל מושווה בלי תלות ברישיות, למקרה שנרשמו עם אותיות גדולות.
    user = (
        db.query(models.User)
        .filter(
            or_(
                func.lower(models.User.email) == identifier.lower(),
                models.User.username == identifier.lower(),
            )
        )
        .first()
    )
    if not user or not user.hashed_password or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="פרטי ההתחברות שגויים",
        )
    token = auth.create_access_token(user.id)
    return schemas.Token(access_token=token)


@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request, "forgot-password", max_attempts=5, window_seconds=3600)

    user = db.query(models.User).filter(func.lower(models.User.email) == payload.email.lower()).first()
    # תמיד אותה תשובה בין אם המייל קיים או לא - כדי לא לחשוף אילו מיילים רשומים במערכת
    generic_response = {"message": "אם קיים חשבון עם המייל הזה, נשלח אליו קישור לאיפוס סיסמה"}

    if not user:
        return generic_response

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    send_password_reset_email(user.email, token)
    return generic_response


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(400, "הסיסמה חייבת להיות באורך 8 תווים לפחות")

    user = (
        db.query(models.User)
        .filter(models.User.reset_token == payload.token)
        .first()
    )
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(400, "הקישור לא תקין או שפג תוקפו - יש לבקש קישור חדש")

    user.hashed_password = auth.hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "הסיסמה עודכנה בהצלחה"}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if payload.display_name is not None:
        name = payload.display_name.strip()
        if not name:
            raise HTTPException(400, "שם תצוגה לא יכול להיות ריק")
        current_user.display_name = name
    if payload.username is not None:
        new_username = re.sub(r"[^a-z0-9_ ]", "", payload.username.strip().lower())
        if new_username and new_username != current_user.username:
            if db.query(models.User).filter(models.User.username == new_username).first():
                raise HTTPException(400, "שם המשתמש הזה כבר תפוס")
            current_user.username = new_username
    if payload.phone_number is not None:
        new_phone = payload.phone_number.strip() or None
        if new_phone and not is_valid_phone(new_phone):
            raise HTTPException(400, "מספר הטלפון לא נראה תקין")
        current_user.phone_number = new_phone
    if payload.home_region is not None:
        current_user.home_region = payload.home_region.strip() or None
    if payload.notifications_enabled is not None:
        current_user.notifications_enabled = payload.notifications_enabled

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/bikes", response_model=schemas.BikeOut)
def add_bike(
    payload: schemas.BikeCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    name = payload.model_name.strip()
    if not name:
        raise HTTPException(400, "יש למלא דגם אופנוע")

    existing_count = db.query(models.UserBike).filter(models.UserBike.user_id == current_user.id).count()
    if existing_count >= 10:
        raise HTTPException(400, "מקסימום 10 אופנועים לפרופיל")

    bike = models.UserBike(
        user_id=current_user.id,
        model_name=name,
        vehicle_type=payload.vehicle_type.value if payload.vehicle_type else None,
    )
    db.add(bike)
    db.commit()
    db.refresh(bike)
    return bike


@router.delete("/me/bikes/{bike_id}")
def delete_bike(
    bike_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    bike = (
        db.query(models.UserBike)
        .filter(models.UserBike.id == bike_id, models.UserBike.user_id == current_user.id)
        .first()
    )
    if not bike:
        raise HTTPException(404, "האופנוע לא נמצא")
    db.delete(bike)
    db.commit()
    return {"deleted": True}


@router.get("/is-admin")
def check_is_admin(current_user: models.User = Depends(auth.get_current_user)):
    return {"is_admin": admin.is_admin(current_user)}
