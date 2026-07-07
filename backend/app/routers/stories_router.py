from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .. import models, schemas, auth, storage, gpx_utils
from ..database import get_db

router = APIRouter(prefix="/stories", tags=["stories"])


@router.post("", response_model=schemas.StoryOut)
async def create_story(
    title: str = Form(...),
    body: str = Form(...),
    ride_type: models.RideType = Form(...),
    difficulty: models.Difficulty = Form(...),
    region: str = Form(...),
    gpx_file: Optional[UploadFile] = File(None),
    photos: List[UploadFile] = File(default=[]),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if len(photos) > storage.MAX_PHOTOS_PER_STORY:
        raise HTTPException(400, f"מקסימום {storage.MAX_PHOTOS_PER_STORY} תמונות לסיפור")

    story = models.Story(
        author_id=current_user.id,
        title=title,
        body=body,
        ride_type=ride_type,
        difficulty=difficulty,
        region=region,
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
    return _with_like_count(story, db)


@router.get("", response_model=List[schemas.StoryListItem])
def list_stories(
    region: Optional[str] = None,
    ride_type: Optional[models.RideType] = None,
    difficulty: Optional[models.Difficulty] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(models.Story).options(joinedload(models.Story.author)).filter(
        models.Story.is_published == True  # noqa: E712
    )

    if region:
        query = query.filter(models.Story.region == region)
    if ride_type:
        query = query.filter(models.Story.ride_type == ride_type)
    if difficulty:
        query = query.filter(models.Story.difficulty == difficulty)
    if search:
        like = f"%{search}%"
        query = query.filter(models.Story.title.ilike(like))

    stories = (
        query.order_by(models.Story.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_with_like_count(s, db) for s in stories]


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
    return _with_like_count(story, db)


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


def _with_like_count(story: models.Story, db: Session):
    count = db.query(func.count(models.Like.id)).filter(models.Like.story_id == story.id).scalar()
    story.like_count = count or 0
    return story
