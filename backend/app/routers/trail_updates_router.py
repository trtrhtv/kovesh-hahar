from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional

from .. import models, schemas, auth, storage
from ..notifications import create_notification
from ..database import get_db

router = APIRouter(prefix="/stories/{story_id}/trail-updates", tags=["trail-updates"])

MAX_TRAIL_UPDATE_PHOTOS = 3


@router.get("", response_model=List[schemas.TrailUpdateOut])
def list_trail_updates(story_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.TrailUpdate)
        .options(
            joinedload(models.TrailUpdate.author),
            selectinload(models.TrailUpdate.photos),
        )
        .filter(models.TrailUpdate.story_id == story_id)
        .order_by(models.TrailUpdate.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.TrailUpdateOut)
async def create_trail_update(
    story_id: str,
    status: models.TrailStatus = Form(...),
    note: Optional[str] = Form(None),
    photos: Optional[List[UploadFile]] = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")

    clean_note = (note or "").strip() or None
    if clean_note and len(clean_note) > 500:
        raise HTTPException(400, "ההערה ארוכה מדי (עד 500 תווים)")

    # תמונות אופציונליות - קוראים ומאמתים את כולן לפני שמעלים משהו
    incoming = [p for p in (photos or []) if p is not None and p.filename]
    if len(incoming) > MAX_TRAIL_UPDATE_PHOTOS:
        raise HTTPException(400, f"עד {MAX_TRAIL_UPDATE_PHOTOS} תמונות לעדכון")

    uploaded_urls: List[str] = []
    for photo in incoming:
        raw = await photo.read()
        if not raw:
            continue
        if photo.content_type not in storage.ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "פורמט תמונה לא נתמך - יש להעלות JPEG/PNG/WebP בלבד")
        if len(raw) > storage.MAX_PHOTO_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"כל תמונה עד {storage.MAX_PHOTO_SIZE_MB}MB")
        ext = photo.content_type.split("/")[-1]
        uploaded_urls.append(storage.upload_file(raw, photo.content_type, "trail-updates", ext))

    update = models.TrailUpdate(
        story_id=story_id,
        author_id=current_user.id,
        status=status,
        note=clean_note,
    )
    db.add(update)
    db.flush()
    for i, url in enumerate(uploaded_urls):
        db.add(models.TrailUpdatePhoto(trail_update_id=update.id, url=url, order_index=i))

    # מתריעים לכל מי שאהב את הסיפור (חוץ מהמדווח עצמו) - הם אלה שרלוונטי להם לדעת
    liker_ids = (
        db.query(models.Like.user_id).filter(models.Like.story_id == story_id).distinct().all()
    )
    for (liker_id,) in liker_ids:
        create_notification(
            db,
            user_id=liker_id,
            actor_id=current_user.id,
            notif_type=models.NotificationType.TRAIL_UPDATE,
            story_id=story_id,
            message=f'עדכון שטח חדש על "{story.title}"',
        )

    db.commit()
    db.refresh(update)
    return update
