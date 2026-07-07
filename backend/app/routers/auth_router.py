from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas, auth, admin
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if not payload.accepted_disclaimer:
        raise HTTPException(400, "יש לאשר את הצהרת האחריות כדי להירשם")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="כבר קיים משתמש עם האימייל הזה")

    user = models.User(
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        display_name=payload.display_name,
        phone_number=(payload.phone_number or "").strip() or None,
        accepted_disclaimer_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(user.id)
    return schemas.Token(access_token=token)


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not user.hashed_password or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="אימייל או סיסמה שגויים",
        )
    token = auth.create_access_token(user.id)
    return schemas.Token(access_token=token)


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
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number.strip() or None
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
