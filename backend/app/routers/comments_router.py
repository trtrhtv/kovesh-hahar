from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas, auth, admin
from ..notifications import create_notification
from ..database import get_db

router = APIRouter(prefix="/stories/{story_id}/comments", tags=["comments"])


@router.get("", response_model=List[schemas.CommentOut])
def list_comments(story_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Comment)
        .options(joinedload(models.Comment.author))
        .filter(models.Comment.story_id == story_id)
        .order_by(models.Comment.created_at.asc())
        .all()
    )


@router.post("", response_model=schemas.CommentOut)
def create_comment(
    story_id: str,
    payload: schemas.CommentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "הסיפור לא נמצא")

    body = payload.body.strip()
    if not body:
        raise HTTPException(400, "לא ניתן לשלוח תגובה ריקה")
    if len(body) > 2000:
        raise HTTPException(400, "התגובה ארוכה מדי (עד 2000 תווים)")

    comment = models.Comment(story_id=story_id, author_id=current_user.id, body=body)
    db.add(comment)

    create_notification(
        db,
        user_id=story.author_id,
        actor_id=current_user.id,
        notif_type=models.NotificationType.COMMENT,
        story_id=story_id,
        message=f'{current_user.display_name} הגיב/ה לסיפור "{story.title}"',
    )

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}")
def delete_comment(
    story_id: str,
    comment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    comment = (
        db.query(models.Comment)
        .filter(models.Comment.id == comment_id, models.Comment.story_id == story_id)
        .first()
    )
    if not comment:
        raise HTTPException(404, "התגובה לא נמצאה")
    if comment.author_id != current_user.id and not admin.is_admin(current_user):
        raise HTTPException(403, "אפשר למחוק רק תגובות שכתבת בעצמך")

    db.delete(comment)
    db.commit()
    return {"deleted": True}
