from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, admin
from ..database import get_db

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=schemas.ContactMessageOut)
def send_message(payload: schemas.ContactMessageCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    message = payload.message.strip()

    if not name:
        raise HTTPException(400, "יש למלא שם")
    if len(message) < 10:
        raise HTTPException(400, "ההודעה קצרה מדי")
    if len(message) > 5000:
        raise HTTPException(400, "ההודעה ארוכה מדי")

    contact_message = models.ContactMessage(name=name, email=payload.email, message=message)
    db.add(contact_message)
    db.commit()
    db.refresh(contact_message)
    return contact_message


@router.get("", response_model=List[schemas.ContactMessageOut])
def list_messages(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not admin.is_admin(current_user):
        raise HTTPException(403, "אין הרשאה")

    return (
        db.query(models.ContactMessage)
        .order_by(models.ContactMessage.created_at.desc())
        .all()
    )
