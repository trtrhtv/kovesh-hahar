from sqlalchemy.orm import Session

from . import models


def create_notification(
    db: Session,
    user_id: str,
    actor_id: str,
    notif_type: models.NotificationType,
    story_id: str,
    message: str,
):
    if user_id == actor_id:
        return  # לא מתריעים למישהו על הפעולה של עצמו

    recipient = db.query(models.User).filter(models.User.id == user_id).first()
    if not recipient or not recipient.notifications_enabled:
        return  # השתיק התראות - לא יוצרים בכלל

    db.add(
        models.Notification(
            user_id=user_id,
            actor_id=actor_id,
            type=notif_type,
            story_id=story_id,
            message=message,
        )
    )
