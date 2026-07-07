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


class RideType(str, enum.Enum):
    ENDURO_ROAD = "enduro_road"          # אינדורו כביש
    SINGLES = "singles"                   # סינגלים
    HARD_ENDURO = "hard_enduro"           # הארד אינדורו
    OFF_ROAD_TOURING = "off_road_touring" # מסע שטח
    DESERT = "desert"                     # מדבר
    OTHER = "other"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MODERATE = "moderate"
    HARD = "hard"
    EXTREME = "extreme"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # ריק אם נכנס עם גוגל
    display_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    bike_model = Column(String, nullable=True)  # "KTM 500 EXC" וכו'
    home_region = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stories = relationship("Story", back_populates="author", cascade="all, delete-orphan")


class Story(Base):
    __tablename__ = "stories"

    id = Column(String, primary_key=True, default=gen_uuid)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    ride_type = Column(Enum(RideType), nullable=False, index=True)
    difficulty = Column(Enum(Difficulty), nullable=False, index=True)
    country = Column(String, nullable=False, default="ישראל", index=True)
    region = Column(String, nullable=False, index=True)  # אזור מוגדר (ישראל) או שם מקום חופשי (חו"ל)

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


class Like(Base):
    __tablename__ = "likes"

    id = Column(String, primary_key=True, default=gen_uuid)
    story_id = Column(String, ForeignKey("stories.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    story = relationship("Story", back_populates="likes")
