import os

from . import models

# רשימת אימיילים של מנהלים, מופרדים בפסיקים. מוגדר כמשתנה סביבה ב-Railway,
# לא בקוד, כדי שלא יהיה חשוף ב-GitHub.
_ADMIN_EMAILS = {
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
}


def is_admin(user: models.User) -> bool:
    return user.email.lower() in _ADMIN_EMAILS
