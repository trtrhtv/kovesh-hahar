from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth, admin
from ..rate_limit import check_rate_limit
from ..database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


def _content_exists(db: Session, content_type: models.ReportContentType, content_id: str) -> bool:
    if content_type == models.ReportContentType.STORY:
        return db.query(models.Story).filter(models.Story.id == content_id).first() is not None
    if content_type == models.ReportContentType.COMMENT:
        return db.query(models.Comment).filter(models.Comment.id == content_id).first() is not None
    if content_type == models.ReportContentType.EVENT:
        return db.query(models.Event).filter(models.Event.id == content_id).first() is not None
    return False


@router.post("", response_model=schemas.ReportOut)
def create_report(
    payload: schemas.ReportCreate,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    check_rate_limit(request, "report", max_attempts=15, window_seconds=3600)

    if not _content_exists(db, payload.content_type, payload.content_id):
        raise HTTPException(404, "התוכן שמנסים לדווח עליו לא נמצא")

    note = (payload.note or "").strip()[:500] or None

    report = models.Report(
        reporter_id=current_user.id,
        content_type=payload.content_type,
        content_id=payload.content_id,
        reason=payload.reason,
        note=note,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=List[schemas.ReportOut])
def list_reports(
    status_filter: Optional[models.ReportStatus] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not admin.is_admin(current_user):
        raise HTTPException(403, "רק מנהל יכול לראות דיווחים")

    query = db.query(models.Report).options(joinedload(models.Report.reporter))
    if status_filter:
        query = query.filter(models.Report.status == status_filter)
    return query.order_by(models.Report.created_at.desc()).limit(200).all()


@router.patch("/{report_id}", response_model=schemas.ReportOut)
def update_report_status(
    report_id: str,
    payload: schemas.ReportStatusUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not admin.is_admin(current_user):
        raise HTTPException(403, "רק מנהל יכול לעדכן דיווחים")

    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(404, "הדיווח לא נמצא")

    report.status = payload.status
    db.commit()
    db.refresh(report)
    return report
