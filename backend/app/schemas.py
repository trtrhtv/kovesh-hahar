from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from .models import VehicleType, RideStyle, Difficulty, Season, TrailStatus


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class UserOut(BaseModel):
    id: str
    display_name: str
    avatar_url: Optional[str] = None
    bike_model: Optional[str] = None
    home_region: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StoryCreate(BaseModel):
    title: str
    body: str
    vehicle_type: VehicleType
    ride_style: RideStyle
    difficulty: Difficulty
    season: Season
    country: str
    region: str
    meeting_point_label: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lon: Optional[float] = None


class TrailUpdateCreate(BaseModel):
    status: TrailStatus
    note: Optional[str] = None


class TrailUpdateOut(BaseModel):
    id: str
    status: TrailStatus
    note: Optional[str] = None
    created_at: datetime
    author: UserOut

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    body: str


class CommentOut(BaseModel):
    id: str
    body: str
    created_at: datetime
    author: UserOut

    class Config:
        from_attributes = True


class PhotoOut(BaseModel):
    id: str
    url: str
    order_index: int

    class Config:
        from_attributes = True


class StoryOut(BaseModel):
    id: str
    title: str
    body: str
    vehicle_type: VehicleType
    ride_style: RideStyle
    difficulty: Difficulty
    season: Season
    country: str
    region: str
    meeting_point_label: Optional[str] = None
    pin_lat: Optional[float] = None
    pin_lon: Optional[float] = None
    distance_km: Optional[float] = None
    elevation_gain_m: Optional[float] = None
    elevation_profile_json: Optional[str] = None
    start_lat: Optional[float] = None
    start_lon: Optional[float] = None
    cover_photo_url: Optional[str] = None
    created_at: datetime
    author: UserOut
    photos: List[PhotoOut] = []
    like_count: int = 0
    comment_count: int = 0

    class Config:
        from_attributes = True


class StoryListItem(BaseModel):
    """גרסה מצומצמת לפיד - בלי body מלא, כדי לא לגרור טקסטים ארוכים"""
    id: str
    title: str
    vehicle_type: VehicleType
    ride_style: RideStyle
    difficulty: Difficulty
    season: Season
    country: str
    region: str
    pin_lat: Optional[float] = None
    pin_lon: Optional[float] = None
    distance_km: Optional[float] = None
    elevation_gain_m: Optional[float] = None
    elevation_profile_json: Optional[str] = None
    cover_photo_url: Optional[str] = None
    created_at: datetime
    author: UserOut
    like_count: int = 0
    comment_count: int = 0

    class Config:
        from_attributes = True
