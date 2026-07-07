from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .. import models, schemas, auth, storage, gpx_utils, locations, admin
from ..database import get_db

router = APIRouter(prefix="/stories", tags=["stories"])

MIN_BODY_WORDS = 30


@router.post("", response_model=schemas.StoryOut)
async def create_story(
    title: str = Form(...),
    body: str = Form(...),
    vehicle_type: models.VehicleType = Form(...),
    vehicle_type_other: Optional[str] = Form(None),
    ride_style: models.RideStyle = Form(...),
    difficulty: models.Difficulty = Form(...),
    season: models.Season = Form(...),
    country: str = Form(...),
    region: str = Form(...),
    meeting_point_label: Optional[str] = Form(None),
    meeting_point_lat: Optional[float] = Form(None),
    meeting_point_lon: Optional[float] = Form(None),
    parking_security: Optional[models.ParkingSecurity] = Form(None),
    gpx_file: Optional[UploadFile] = File(None),
    photos: List[UploadFile] = File(default=[]),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if len(photos) > storage.MAX_PHOTOS_PER_STORY:
        raise HTTPException(400, f"מקסימום {storage.MAX_PHOTOS_PER_STORY} תמונות לסיפור")

    if vehicle_type == models.VehicleType.OTHER and not (vehicle_type_other or "").strip():
        raise HTTPException(400, "יש לפרט את סוג האופנוע כשבוחרים 'אחר'")

    word_count = len(body.split())
    if word_count < MIN_BODY_WORDS:
        raise HTTPException(
            400, f"הסיפור קצר מדי - נדרשות לפחות {MIN_BODY_WORDS} מילים (יש כרגע {word_count})"
        )

    if not locations.is_valid_country(country):
        raise HTTPException(400, "מדינה לא תקינה")
    if country == locations.ISRAEL and not locations.is_valid_israel_region(region):
        raise HTTPException(400, "אזור לא תקין - יש לבחור מהרשימה")
    if country != locations.ISRAEL and not region.strip():
        raise HTTPException(400, "יש לציין שם מקום")

    story = models.Story(
        author_id=current_user.id,
        title=title,
        body=body,
        vehicle_type=vehicle_type,
        vehicle_type_other=(vehicle_type_other or "").strip() or None,
        ride_style=ride_style,
        difficulty=difficulty,
        season=season,
        country=country,
        region=region.strip(),
        meeting_point_label=(meeting_point_label or "").strip() or None,
        meeting_point_lat=meeting_point_lat,
        meeting_point_lon=meeting_point_lon,
        parking_security=parking_security,
    )

    # פענוח GPX אם צורף - זה מה שמפיק את המרחק, הטיפוס, וקו החתימה
    if gpx_file is not None:
        raw = await gpx_file.read()
        if len(raw) > storage.MAX_GPX_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"קובץ ה-GPX גדול מ-{storage.MAX_GPX_SIZE_MB}MB")
        try:
            parsed = gpx_utils.parse_gpx(raw)
        except Exception as e:
            raise HTTPException(400, f"לא הצלחתי לקרוא את קובץ ה-GPX: {e}")

        gpx_url = storage.upload_file(raw, "application/gpx+xml", "gpx", "gpx")
        story.gpx_url = gpx_url
        story.distance_km = parsed["distance_km"]
        story.elevation_gain_m = parsed["elevation_gain_m"]
        story.elevation_profile_json = gpx_utils.profile_to_json(parsed["elevation_profile"])
        story.start_lat = parsed["start_lat"]
        story.start_lon = parsed["start_lon"]

    db.add(story)
    db.flush()  # כדי לקבל story.id לפני העלאת התמונות

    for idx, photo in enumerate(photos):
        raw = await photo.read()
        if photo.content_type not in storage.ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "פורמט תמונה לא נתמך - יש להעלות JPEG/PNG/WebP בלבד")
        if len(raw) > storage.MAX_PHOTO_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"כל תמונה עד {storage.MAX_PHOTO_SIZE_MB}MB")

        ext = photo.content_type.split("/")[-1]
        url = storage.upload_file(raw, photo.content_type, "photos", ext)
        story_photo = models.StoryPhoto(story_id=story.id, url=url, order_index=idx)
        db.add(story_photo)
        if idx == 0:
            story.cover_photo_url = url

    db.commit()
    db.refresh(story)
    return _with_extras(story, db)


@router.get("", response_model=List[schemas.StoryListItem])
def list_stories(
    country: Optional[str] = None,
    region: Optional[str] = None,
    vehicle_type: Optional[models.VehicleType] = None,
    ride_style: Optional[models.RideStyle] = None,
    difficulty: Optional[models.Difficulty] = None,
    season: Optional[models.Season] = None,
    search: Optional[str] = None,
    author_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    limit = min(max(limit, 1), 50)  # תקרה כדי שאף אחד לא יבקש 10,000 שורות בבת אחת
    query = db.query(models.Story).options(joinedload(models.Story.author)).filter(
        models.Story.is_published == True  # noqa: E712
    )

    if author_id:
        query = query.filter(models.Story.author_id == author_id)
    if country:
        query = query.filter(models.Story.country == country)
    if region:
        query = query.filter(models.Story.region == region)
    if vehicle_type:
        query = query.filter(models.Story.vehicle_type == vehicle_type)
    if ride_style:
        query = query.filter(models.Story.ride_style == ride_style)
    if difficulty:
        query = query.filter(models.Story.difficulty == difficulty)
    if season:
        query = query.filter(models.Story.season == season)
    if search:
        like = f"%{search}%"
        query = query.filter(models.Story.title.ilike(like))

    stories = (
        query.order_by(models.Story.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_with_extras(s, db) for s in stories]


@router.get("/{story_id}", response_model=schemas.StoryOut)
def get_story(story_id: str, db: Session = Depends(get_db)):
    story = (
        db.query(models.Story)
        .options(joinedload(models.Story.author), joinedload(models.Story.photos))
        .filter(models.Story.id == story_id)
        .first()
    )
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")
    return _with_extras(story, db)


@router.post("/{story_id}/like")
def toggle_like(
    story_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.Like)
        .filter(models.Like.story_id == story_id, models.Like.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}

    like = models.Like(story_id=story_id, user_id=current_user.id)
    db.add(like)
    db.commit()
    return {"liked": True}


@router.delete("/{story_id}")
def delete_story(
    story_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")

    if story.author_id != current_user.id and not admin.is_admin(current_user):
        raise HTTPException(403, "אין לך הרשאה למחוק את הסיפור הזה")

    db.delete(story)
    db.commit()
    return {"deleted": True}


@router.patch("/{story_id}", response_model=schemas.StoryOut)
def update_story(
    story_id: str,
    payload: schemas.StoryUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")
    if story.author_id != current_user.id and not admin.is_admin(current_user):
        raise HTTPException(403, "אין לך הרשאה לערוך את הסיפור הזה")

    data = payload.dict(exclude_unset=True)

    if "body" in data and data["body"] is not None:
        word_count = len(data["body"].split())
        if word_count < MIN_BODY_WORDS:
            raise HTTPException(
                400, f"הסיפור קצר מדי - נדרשות לפחות {MIN_BODY_WORDS} מילים (יש כרגע {word_count})"
            )

    country = data.get("country", story.country)
    region = data.get("region", story.region)
    if "country" in data or "region" in data:
        if not locations.is_valid_country(country):
            raise HTTPException(400, "מדינה לא תקינה")
        if country == locations.ISRAEL and not locations.is_valid_israel_region(region):
            raise HTTPException(400, "אזור לא תקין - יש לבחור מהרשימה")
        if country != locations.ISRAEL and not region.strip():
            raise HTTPException(400, "יש לציין שם מקום")

    if data.get("vehicle_type") == models.VehicleType.OTHER and not (
        data.get("vehicle_type_other") or story.vehicle_type_other or ""
    ).strip():
        raise HTTPException(400, "יש לפרט את סוג האופנוע כשבוחרים 'אחר'")

    for field, value in data.items():
        setattr(story, field, value)

    db.commit()
    db.refresh(story)
    return _with_extras(story, db)


def _with_extras(story: models.Story, db: Session):
    like_count = db.query(func.count(models.Like.id)).filter(models.Like.story_id == story.id).scalar()
    comment_count = (
        db.query(func.count(models.Comment.id)).filter(models.Comment.story_id == story.id).scalar()
    )
    story.like_count = like_count or 0
    story.comment_count = comment_count or 0
    # "נעץ" למפה - עדיפות לנקודת הכינוס הידנית, אחרת נקודת ההתחלה מה-GPX
    story.pin_lat = story.meeting_point_lat if story.meeting_point_lat is not None else story.start_lat
    story.pin_lon = story.meeting_point_lon if story.meeting_point_lon is not None else story.start_lon
    return story
