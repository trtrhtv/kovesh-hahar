from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas, auth
from ..notifications import create_notification
from ..database import get_db

router = APIRouter(prefix="/stories/{story_id}/trail-updates", tags=["trail-updates"])


@router.get("", response_model=List[schemas.TrailUpdateOut])
def list_trail_updates(story_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.TrailUpdate)
        .options(joinedload(models.TrailUpdate.author))
        .filter(models.TrailUpdate.story_id == story_id)
        .order_by(models.TrailUpdate.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.TrailUpdateOut)
def create_trail_update(
    story_id: str,
    payload: schemas.TrailUpdateCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")

    note = (payload.note or "").strip() or None
    if note and len(note) > 500:
        raise HTTPException(400, "ההערה ארוכה מדי (עד 500 תווים)")

    update = models.TrailUpdate(
        story_id=story_id,
        author_id=current_user.id,
        status=payload.status,
        note=note,
    )
    db.add(update)

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
