from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .. import models, schemas, auth, admin, locations
from ..notifications import create_notification
from ..database import get_db

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=schemas.EventOut)
def create_event(
    payload: schemas.EventCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    title = payload.title.strip()
    description = payload.description.strip()
    meeting_point_label = payload.meeting_point_label.strip()
    contact_phone = payload.contact_phone.strip()
    if not title:
        raise HTTPException(400, "יש למלא כותרת")
    if len(description.split()) < 3:
        raise HTTPException(400, "יש למלא תיאור קצר (לפחות כמה מילים)")
    if not meeting_point_label:
        raise HTTPException(400, "יש לציין נקודת כינוס")
    if not contact_phone:
        raise HTTPException(400, "יש לציין טלפון ליצירת קשר")

    # הפרונט שולח תאריך עם timezone (UTC), אבל datetime.utcnow() לא מודע ל-timezone -
    # השוואה ישירה ביניהם זורקת TypeError. מנרמלים לפני ההשוואה ולפני השמירה ב-DB.
    event_date = payload.event_date
    if event_date.tzinfo is not None:
        event_date = event_date.astimezone(timezone.utc).replace(tzinfo=None)
    if event_date < datetime.utcnow() - timedelta(hours=1):
        raise HTTPException(400, "תאריך האירוע לא יכול להיות בעבר")

    if not locations.is_valid_country(payload.country):
        raise HTTPException(400, "מדינה לא תקינה")
    if payload.country == locations.ISRAEL and not locations.is_valid_israel_region(payload.region):
        raise HTTPException(400, "אזור לא תקין - יש לבחור מהרשימה")
    if payload.country != locations.ISRAEL and not payload.region.strip():
        raise HTTPException(400, "יש לציין שם מקום")

    event = models.Event(
        organizer_id=current_user.id,
        title=title,
        description=description,
        event_date=event_date,
        vehicle_type=payload.vehicle_type,
        difficulty=payload.difficulty,
        country=payload.country,
        region=payload.region.strip(),
        meeting_point_label=meeting_point_label,
        meeting_point_lat=payload.meeting_point_lat,
        meeting_point_lon=payload.meeting_point_lon,
        contact_phone=contact_phone,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _with_extras(event, db, current_user.id)


@router.get("", response_model=List[schemas.EventOut])
def list_events(
    country: Optional[str] = None,
    region: Optional[str] = None,
    include_past: bool = False,
    limit: int = 30,
    offset: int = 0,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    limit = min(max(limit, 1), 50)
    query = db.query(models.Event).options(joinedload(models.Event.organizer))

    if not include_past:
        query = query.filter(models.Event.event_date >= datetime.utcnow())
    if country:
        query = query.filter(models.Event.country == country)
    if region:
        query = query.filter(models.Event.region == region)

    events = query.order_by(models.Event.event_date.asc()).offset(offset).limit(limit).all()
    uid = current_user.id if current_user else None
    return [_with_extras(e, db, uid) for e in events]


@router.get("/{event_id}", response_model=schemas.EventOut)
def get_event(
    event_id: str,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    event = (
        db.query(models.Event)
        .options(joinedload(models.Event.organizer))
        .filter(models.Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(404, "האירוע לא נמצא")
    return _with_extras(event, db, current_user.id if current_user else None)


@router.patch("/{event_id}", response_model=schemas.EventOut)
def update_event(
    event_id: str,
    payload: schemas.EventUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "האירוע לא נמצא")
    if event.organizer_id != current_user.id and not admin.is_admin(current_user):
        raise HTTPException(403, "אין לך הרשאה לערוך את האירוע הזה")

    data = payload.dict(exclude_unset=True)
    if "event_date" in data and data["event_date"] is not None and data["event_date"].tzinfo is not None:
        data["event_date"] = data["event_date"].astimezone(timezone.utc).replace(tzinfo=None)
    for field, value in data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return _with_extras(event, db, current_user.id)


@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "האירוע לא נמצא")
    if event.organizer_id != current_user.id and not admin.is_admin(current_user):
        raise HTTPException(403, "אין לך הרשאה למחוק את האירוע הזה")
    db.delete(event)
    db.query(models.EventRSVP).filter(models.EventRSVP.event_id == event_id).delete()
    db.commit()
    return {"deleted": True}


@router.post("/{event_id}/rsvp")
def toggle_rsvp(
    event_id: str,
    payload: schemas.RSVPRequest = schemas.RSVPRequest(),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "האירוע לא נמצא")

    guest_count = min(max(payload.guest_count, 1), 20)

    existing = (
        db.query(models.EventRSVP)
        .filter(models.EventRSVP.event_id == event_id, models.EventRSVP.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"attending": False, "guest_count": 0}

    db.add(models.EventRSVP(event_id=event_id, user_id=current_user.id, guest_count=guest_count))
    extra_note = f' (עם עוד {guest_count - 1} אנשים)' if guest_count > 1 else ""
    create_notification(
        db,
        user_id=event.organizer_id,
        actor_id=current_user.id,
        notif_type=models.NotificationType.EVENT_RSVP,
        story_id=None,
        message=f'{current_user.display_name} מגיע/ה לאירוע "{event.title}"{extra_note}',
    )
    db.commit()
    return {"attending": True, "guest_count": guest_count}


def _with_extras(event: models.Event, db: Session, current_user_id: Optional[str]):
    total = db.query(func.sum(models.EventRSVP.guest_count)).filter(models.EventRSVP.event_id == event.id).scalar()
    event.attendee_count = total or 0
    event.is_attending = False
    event.my_guest_count = 0
    if current_user_id:
        my_rsvp = (
            db.query(models.EventRSVP)
            .filter(models.EventRSVP.event_id == event.id, models.EventRSVP.user_id == current_user_id)
            .first()
        )
        if my_rsvp:
            event.is_attending = True
            event.my_guest_count = my_rsvp.guest_count
    return event
