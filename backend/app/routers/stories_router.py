import json
import math
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from .. import models, schemas, auth, storage, gpx_utils, locations, admin
from ..geo import haversine_km, route_distance_km
from ..notifications import create_notification
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
    drawn_route_json: Optional[str] = Form(None),
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
    # אלטרנטיבה ל-GPX - מסלול שהמשתמש שרטט ידנית על המפה (לא כולל גובה אמיתי)
    elif drawn_route_json:
        try:
            points = json.loads(drawn_route_json)
        except Exception:
            raise HTTPException(400, "מסלול משורטט לא תקין")
        if not isinstance(points, list) or len(points) < 2:
            raise HTTPException(400, "מסלול משורטט צריך לפחות 2 נקודות")
        if len(points) > 500:
            raise HTTPException(400, "יותר מדי נקודות במסלול המשורטט")

        story.distance_km = round(route_distance_km(points), 2)
        story.elevation_profile_json = json.dumps([[p[0], p[1], 0] for p in points])
        story.start_lat = points[0][0]
        story.start_lon = points[0][1]
        # elevation_gain_m נשאר None בכוונה - אין דרך לדעת גובה אמיתי משרטוט ביד

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


@router.get("/nearby", response_model=List[schemas.StoryListItem])
def nearby_stories(
    lat: float,
    lon: float,
    radius_km: float = 50,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    radius_km = min(max(radius_km, 1), 300)
    limit = min(max(limit, 1), 50)

    # קופסת-תוחם (bounding box) ב-SQL כדי לא לטעון את כל טבלת הסיפורים ל-Python.
    # ~111 ק"מ למעלת קו-רוחב; מעלת קו-אורך מתכווצת עם הרוחב (cos). ההסינה המדויקת
    # (haversine מעגלי) נעשית אחרי כן רק על המועמדים שבתוך הקופסה, לא על הכל.
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))
    eff_lat = func.coalesce(models.Story.meeting_point_lat, models.Story.start_lat)
    eff_lon = func.coalesce(models.Story.meeting_point_lon, models.Story.start_lon)

    candidates = (
        db.query(models.Story)
        .options(joinedload(models.Story.author).selectinload(models.User.bikes))
        .filter(
            models.Story.is_published == True,  # noqa: E712
            eff_lat.isnot(None),
            eff_lon.isnot(None),
            eff_lat.between(lat - lat_delta, lat + lat_delta),
            eff_lon.between(lon - lon_delta, lon + lon_delta),
        )
        .limit(500)  # תקרה קשיחה - הקופסה כבר מצמצמת, וזה מונע חריגה קיצונית
        .all()
    )

    results = []
    for story in candidates:
        story_lat = story.meeting_point_lat if story.meeting_point_lat is not None else story.start_lat
        story_lon = story.meeting_point_lon if story.meeting_point_lon is not None else story.start_lon
        if story_lat is None or story_lon is None:
            continue
        distance = haversine_km(lat, lon, story_lat, story_lon)
        if distance <= radius_km:
            results.append((distance, story))

    results.sort(key=lambda pair: pair[0])
    return _attach_extras([story for _, story in results[:limit]], db)


@router.get("/count")
def count_stories(
    country: Optional[str] = None,
    region: Optional[str] = None,
    vehicle_type: Optional[models.VehicleType] = None,
    ride_style: Optional[models.RideStyle] = None,
    difficulty: Optional[models.Difficulty] = None,
    season: Optional[models.Season] = None,
    search: Optional[str] = None,
    author_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(func.count(models.Story.id)).filter(models.Story.is_published == True)  # noqa: E712

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
        query = query.filter(models.Story.title.ilike(f"%{search}%"))

    return {"count": query.scalar() or 0}


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
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    limit = min(max(limit, 1), 50)  # תקרה כדי שאף אחד לא יבקש 10,000 שורות בבת אחת
    query = db.query(models.Story).options(
        joinedload(models.Story.author).selectinload(models.User.bikes)
    ).filter(
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
    return _attach_extras(stories, db, current_user.id if current_user else None)


@router.get("/{story_id}", response_model=schemas.StoryOut)
def get_story(
    story_id: str,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    story = (
        db.query(models.Story)
        .options(joinedload(models.Story.author), joinedload(models.Story.photos))
        .filter(models.Story.id == story_id)
        .first()
    )
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")
    return _with_extras(story, db, current_user.id if current_user else None)


@router.post("/{story_id}/vote")
def vote_story(
    story_id: str,
    payload: schemas.VoteRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if payload.value not in (1, -1):
        raise HTTPException(400, "ערך הצבעה לא תקין")

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")

    existing = (
        db.query(models.Like)
        .filter(models.Like.story_id == story_id, models.Like.user_id == current_user.id)
        .first()
    )

    if existing and existing.value == payload.value:
        # אותה הצבעה שוב - מבטלים אותה
        db.delete(existing)
        db.commit()
        return {"my_vote": 0}

    if existing:
        # הצבעה קיימת בכיוון ההפוך - מחליפים
        existing.value = payload.value
        db.commit()
        return {"my_vote": payload.value}

    like = models.Like(story_id=story_id, user_id=current_user.id, value=payload.value)
    db.add(like)

    if payload.value > 0:
        create_notification(
            db,
            user_id=story.author_id,
            actor_id=current_user.id,
            notif_type=models.NotificationType.LIKE,
            story_id=story_id,
            message=f'{current_user.display_name} אהב/ה את הסיפור "{story.title}"',
        )

    try:
        db.commit()
    except IntegrityError:
        # מרוץ: בקשה מקבילה (לחיצה כפולה) כבר יצרה הצבעה. אילוץ הייחודיות מנע כפילות -
        # מתאוששים בעדכון ההצבעה הקיימת לערך המבוקש במקום להחזיר 500.
        db.rollback()
        existing = (
            db.query(models.Like)
            .filter(models.Like.story_id == story_id, models.Like.user_id == current_user.id)
            .first()
        )
        if existing:
            existing.value = payload.value
            db.commit()
    return {"my_vote": payload.value}


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

    # אוספים את כתובות הקבצים לפני המחיקה - אחרי db.delete הקשר לתמונות אבד.
    # (cover_photo_url הוא כפילות של אחת מכתובות התמונות, אז אין צורך להוסיפו בנפרד.)
    file_urls = [p.url for p in story.photos]
    if story.gpx_url:
        file_urls.append(story.gpx_url)

    db.delete(story)
    db.commit()

    # מוחקים את הקבצים רק אחרי שמחיקת ה-DB הצליחה, כדי לא להשאיר רשומה בלי קובץ
    for url in file_urls:
        storage.delete_file(url)
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


def _check_story_edit_permission(story: models.Story, current_user: models.User):
    if story.author_id != current_user.id and not admin.is_admin(current_user):
        raise HTTPException(403, "אין לך הרשאה לערוך את הסיפור הזה")


@router.post("/{story_id}/photos", response_model=schemas.StoryOut)
async def add_story_photos(
    story_id: str,
    photos: List[UploadFile] = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")
    _check_story_edit_permission(story, current_user)

    existing_count = db.query(func.count(models.StoryPhoto.id)).filter(
        models.StoryPhoto.story_id == story_id
    ).scalar() or 0
    if existing_count + len(photos) > storage.MAX_PHOTOS_PER_STORY:
        raise HTTPException(
            400, f"מקסימום {storage.MAX_PHOTOS_PER_STORY} תמונות לסיפור (יש כבר {existing_count})"
        )

    for idx, photo in enumerate(photos):
        raw = await photo.read()
        if photo.content_type not in storage.ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "פורמט תמונה לא נתמך - יש להעלות JPEG/PNG/WebP בלבד")
        if len(raw) > storage.MAX_PHOTO_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"כל תמונה עד {storage.MAX_PHOTO_SIZE_MB}MB")

        ext = photo.content_type.split("/")[-1]
        url = storage.upload_file(raw, photo.content_type, "photos", ext)
        db.add(models.StoryPhoto(story_id=story.id, url=url, order_index=existing_count + idx))
        if not story.cover_photo_url:
            story.cover_photo_url = url

    db.commit()
    db.refresh(story)
    return _with_extras(story, db)


@router.delete("/{story_id}/photos/{photo_id}", response_model=schemas.StoryOut)
def delete_story_photo(
    story_id: str,
    photo_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")
    _check_story_edit_permission(story, current_user)

    photo = (
        db.query(models.StoryPhoto)
        .filter(models.StoryPhoto.id == photo_id, models.StoryPhoto.story_id == story_id)
        .first()
    )
    if not photo:
        raise HTTPException(404, "התמונה לא נמצאה")

    was_cover = story.cover_photo_url == photo.url
    deleted_url = photo.url
    db.delete(photo)
    db.flush()

    if was_cover:
        # אם מחקנו את תמונת השער, מקדמים את התמונה הבאה בתור (אם יש)
        next_photo = (
            db.query(models.StoryPhoto)
            .filter(models.StoryPhoto.story_id == story_id)
            .order_by(models.StoryPhoto.order_index.asc())
            .first()
        )
        story.cover_photo_url = next_photo.url if next_photo else None

    db.commit()
    storage.delete_file(deleted_url)
    db.refresh(story)
    return _with_extras(story, db)


@router.put("/{story_id}/route", response_model=schemas.StoryOut)
async def replace_story_route(
    story_id: str,
    gpx_file: Optional[UploadFile] = File(None),
    drawn_route_json: Optional[str] = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """מחליף את המסלול הקיים (GPX או משורטט) בחדש - לא מוסיף, מחליף לגמרי"""
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")
    _check_story_edit_permission(story, current_user)

    if not gpx_file and not drawn_route_json:
        raise HTTPException(400, "יש לצרף קובץ GPX או מסלול משורטט")

    # הקובץ ה-GPX הישן - נמחק בסוף אם החלפנו אותו (בין אם ב-GPX חדש ובין אם במסלול משורטט)
    old_gpx_url = story.gpx_url

    if gpx_file is not None:
        raw = await gpx_file.read()
        if len(raw) > storage.MAX_GPX_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"קובץ ה-GPX גדול מ-{storage.MAX_GPX_SIZE_MB}MB")
        try:
            parsed = gpx_utils.parse_gpx(raw)
        except Exception as e:
            raise HTTPException(400, f"לא הצלחתי לקרוא את קובץ ה-GPX: {e}")

        story.gpx_url = storage.upload_file(raw, "application/gpx+xml", "gpx", "gpx")
        story.distance_km = parsed["distance_km"]
        story.elevation_gain_m = parsed["elevation_gain_m"]
        story.elevation_profile_json = gpx_utils.profile_to_json(parsed["elevation_profile"])
        story.start_lat = parsed["start_lat"]
        story.start_lon = parsed["start_lon"]
    else:
        try:
            points = json.loads(drawn_route_json)
        except Exception:
            raise HTTPException(400, "מסלול משורטט לא תקין")
        if not isinstance(points, list) or len(points) < 2:
            raise HTTPException(400, "מסלול משורטט צריך לפחות 2 נקודות")
        if len(points) > 500:
            raise HTTPException(400, "יותר מדי נקודות במסלול המשורטט")

        story.gpx_url = None
        story.distance_km = round(route_distance_km(points), 2)
        story.elevation_gain_m = None
        story.elevation_profile_json = json.dumps([[p[0], p[1], 0] for p in points])
        story.start_lat = points[0][0]
        story.start_lon = points[0][1]

    db.commit()
    # מוחקים את ה-GPX הישן רק אם הוחלף בקובץ אחר (או הוסר לטובת מסלול משורטט)
    if old_gpx_url and old_gpx_url != story.gpx_url:
        storage.delete_file(old_gpx_url)
    db.refresh(story)
    return _with_extras(story, db)


def _attach_extras(
    stories: List[models.Story], db: Session, current_user_id: Optional[str] = None
) -> List[models.Story]:
    """מחשב לייקים/תגובות/הצבעה-שלי לרשימת סיפורים ב-2-3 שאילתות סה"כ (במקום 2-3
    לכל סיפור - N+1). קריטי לפידים גדולים."""
    if not stories:
        return stories
    ids = [s.id for s in stories]

    like_sums = dict(
        db.query(models.Like.story_id, func.coalesce(func.sum(models.Like.value), 0))
        .filter(models.Like.story_id.in_(ids))
        .group_by(models.Like.story_id)
        .all()
    )
    comment_counts = dict(
        db.query(models.Comment.story_id, func.count(models.Comment.id))
        .filter(models.Comment.story_id.in_(ids))
        .group_by(models.Comment.story_id)
        .all()
    )
    my_votes = {}
    if current_user_id:
        my_votes = dict(
            db.query(models.Like.story_id, models.Like.value)
            .filter(models.Like.story_id.in_(ids), models.Like.user_id == current_user_id)
            .all()
        )

    for s in stories:
        s.like_count = int(like_sums.get(s.id, 0) or 0)
        s.comment_count = int(comment_counts.get(s.id, 0) or 0)
        s.my_vote = int(my_votes.get(s.id, 0) or 0)
        # "נעץ" למפה - עדיפות לנקודת הכינוס הידנית, אחרת נקודת ההתחלה מה-GPX
        s.pin_lat = s.meeting_point_lat if s.meeting_point_lat is not None else s.start_lat
        s.pin_lon = s.meeting_point_lon if s.meeting_point_lon is not None else s.start_lon
    return stories


def _with_extras(story: models.Story, db: Session, current_user_id: Optional[str] = None):
    return _attach_extras([story], db, current_user_id)[0]
