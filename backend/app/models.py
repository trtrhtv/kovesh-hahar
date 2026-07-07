import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class VehicleType(str, enum.Enum):
    ADVENTURE = "adventure"        # אדוונצ'ר
    FOUR_STROKE = "four_stroke"    # 4 פעימות
    TWO_STROKE = "two_stroke"      # 2 פעימות
    DUAL_SPORT = "dual_sport"      # דו"ש (דו-שימושי)
    MOTOCROSS = "motocross"        # מוטוקרוס
    OTHER = "other"                # אחר - עם טקסט חופשי


class RideStyle(str, enum.Enum):
    SCENIC_TOURING = "scenic_touring"            # טיול נופים ופיקניק
    FAST_RALLY = "fast_rally"                    # רכיבה מהירה / ראלי
    TECHNICAL_SINGLES = "technical_singles"      # רכיבה טכנית / סינגלים
    HARD_ENDURO_EXTREME = "hard_enduro_extreme"  # הארד אנדורו / אקסטרים
    DESERT_DUNES = "desert_dunes"                # רכיבה מדברית / דיונות


class Season(str, enum.Enum):
    WINTER = "winter"
    SUMMER = "summer"
    ALL_YEAR = "all_year"


class TrailStatus(str, enum.Enum):
    OPEN = "open"        # פתוח וזורם
    BLOCKED = "blocked"  # חסום
    MUDDY = "muddy"      # מלכודת בוץ
    UNKNOWN = "unknown"  # לא ידוע / ישן מדי


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MODERATE = "moderate"
    HARD = "hard"
    EXTREME = "extreme"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)  # להתחברות קלה, בלי אימייל מלא
    hashed_password = Column(String, nullable=True)  # ריק אם נכנס עם גוגל
    display_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    bike_model = Column(String, nullable=True)  # legacy - נשמר לתאימות, לא בשימוש בממשק החדש
    home_region = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)  # לכפתור יצירת קשר ב-WhatsApp, לא חובה
    notifications_enabled = Column(Boolean, default=True)  # השתקת כל ההתראות
    accepted_disclaimer_at = Column(DateTime, nullable=True)  # מתי אישר את הצהרת האחריות
    created_at = Column(DateTime, default=datetime.utcnow)

    stories = relationship("Story", back_populates="author", cascade="all, delete-orphan")
    bikes = relationship("UserBike", back_populates="owner", cascade="all, delete-orphan")


class UserBike(Base):
    """אופנוע אחד מתוך כמה שרוכב יכול להחזיק - לא כל רוכב מוגבל לכלי אחד"""
    __tablename__ = "user_bikes"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    model_name = Column(String, nullable=False)  # למשל "KTM 500 EXC-F"
    vehicle_type = Column(String, nullable=True)  # אחת הקטגוריות הקיימות, לא חובה

    owner = relationship("User", back_populates="bikes")


class ParkingSecurity(str, enum.Enum):
    SAFE = "safe"      # בסיס בטוח, נראות גבוהה
    RISK = "risk"       # סיכון גניבה גבוה


class Story(Base):
    __tablename__ = "stories"

    id = Column(String, primary_key=True, default=gen_uuid)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    vehicle_type = Column(Enum(VehicleType), nullable=False, index=True)
    vehicle_type_other = Column(String, nullable=True)  # טקסט חופשי כשvehicle_type="other"
    ride_style = Column(Enum(RideStyle), nullable=False, index=True)
    difficulty = Column(Enum(Difficulty), nullable=False, index=True)
    season = Column(Enum(Season), nullable=False, default=Season.ALL_YEAR, index=True)
    country = Column(String, nullable=False, default="ישראל", index=True)
    region = Column(String, nullable=False, index=True)  # אזור מוגדר (ישראל) או שם מקום חופשי (חו"ל)

    # נקודת כינוס/התחלה - מוזן ידנית (חובה כדי לייצר ניווט גם לסיפור בלי GPX)
    meeting_point_label = Column(String, nullable=True)  # למשל "חניון עין גדי"
    meeting_point_lat = Column(Float, nullable=True)
    meeting_point_lon = Column(Float, nullable=True)
    parking_security = Column(Enum(ParkingSecurity), nullable=True)  # לא חובה - רק אם הכותב יודע

    # נתונים שנגזרים אוטומטית מקובץ ה-GPX בעת ההעלאה
    gpx_url = Column(String, nullable=True)          # קובץ ה-GPX המקורי ב-R2
    distance_km = Column(Float, nullable=True)
    elevation_gain_m = Column(Float, nullable=True)
    elevation_profile_json = Column(Text, nullable=True)  # מערך נקודות [lat,lon,ele] מדולל, ל"קו החתימה"
    start_lat = Column(Float, nullable=True)
    start_lon = Column(Float, nullable=True)

    cover_photo_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    author = relationship("User", back_populates="stories")
    photos = relationship("StoryPhoto", back_populates="story", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="story", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="story", cascade="all, delete-orphan")
    trail_updates = relationship("TrailUpdate", back_populates="story", cascade="all, delete-orphan")


class StoryPhoto(Base):
    __tablename__ = "story_photos"

    id = Column(String, primary_key=True, default=gen_uuid)
    story_id = Column(String, ForeignKey("stories.id"), nullable=False)
    url = Column(String, nullable=False)
    order_index = Column(Integer, default=0)

    story = relationship("Story", back_populates="photos")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=gen_uuid)
    story_id = Column(String, ForeignKey("stories.id"), nullable=False, index=True)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("Story", back_populates="comments")
    author = relationship("User")


class NotificationType(str, enum.Enum):
    COMMENT = "comment"            # מישהו הגיב לסיפור שלך
    TRAIL_UPDATE = "trail_update"  # עדכון שטח על סיפור שאהבת
    LIKE = "like"                  # מישהו אהב את הסיפור שלך
    EVENT_RSVP = "event_rsvp"      # מישהו נרשם לאירוע שלך


class Event(Base):
    """אירוע רכיבה - "מארגן רכיבה בשבת הבאה" וכו', נפרד מסיפורי הדרך"""
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=gen_uuid)
    organizer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    event_date = Column(DateTime, nullable=False, index=True)

    vehicle_type = Column(Enum(VehicleType), nullable=True)
    difficulty = Column(Enum(Difficulty), nullable=True)
    country = Column(String, nullable=False, default="ישראל")
    region = Column(String, nullable=False)

    meeting_point_label = Column(String, nullable=True)
    meeting_point_lat = Column(Float, nullable=True)
    meeting_point_lon = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    organizer = relationship("User")


class EventRSVP(Base):
    """מי הביע כוונה להגיע לאירוע"""
    __tablename__ = "event_rsvps"

    id = Column(String, primary_key=True, default=gen_uuid)
    event_id = Column(String, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)  # מי מקבל
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)  # מי גרם להתראה
    type = Column(Enum(NotificationType), nullable=False)
    story_id = Column(String, ForeignKey("stories.id"), nullable=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class TrailUpdate(Base):
    """עדכון שטח קצר על מצב המסלול - כל רוכב יכול לפרסם, לא רק מי שהעלה את הסיפור"""
    __tablename__ = "trail_updates"

    id = Column(String, primary_key=True, default=gen_uuid)
    story_id = Column(String, ForeignKey("stories.id"), nullable=False, index=True)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(TrailStatus), nullable=False)
    note = Column(Text, nullable=True)  # למשל "קריסה אחרי הגשם - 05/2026"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    story = relationship("Story", back_populates="trail_updates")
    author = relationship("User")


class Like(Base):
    __tablename__ = "likes"

    id = Column(String, primary_key=True, default=gen_uuid)
    story_id = Column(String, ForeignKey("stories.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    story = relationship("Story", back_populates="likes")
