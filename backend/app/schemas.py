from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from .models import VehicleType, RideStyle, Difficulty, Season, TrailStatus, ParkingSecurity


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    accepted_disclaimer: bool
    phone_number: Optional[str] = None
    username: Optional[str] = None


class BikeCreate(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_name: str
    vehicle_type: Optional[VehicleType] = None


class BikeOut(BaseModel):
    model_config = {"protected_namespaces": (), "from_attributes": True}
    id: str
    model_name: str
    vehicle_type: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    home_region: Optional[str] = None
    notifications_enabled: Optional[bool] = None


class UserOut(BaseModel):
    id: str
    display_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    home_region: Optional[str] = None
    phone_number: Optional[str] = None
    notifications_enabled: bool = True
    bikes: List[BikeOut] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StoryCreate(BaseModel):
    title: str
    body: str
    vehicle_type: VehicleType
    vehicle_type_other: Optional[str] = None
    ride_style: RideStyle
    difficulty: Difficulty
    season: Season
    country: str
    region: str
    meeting_point_label: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lon: Optional[float] = None
    parking_security: Optional[ParkingSecurity] = None


class NotificationOut(BaseModel):
    id: str
    type: str
    story_id: Optional[str] = None
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    description: str
    event_date: datetime
    vehicle_type: Optional[VehicleType] = None
    difficulty: Optional[Difficulty] = None
    country: str
    region: str
    meeting_point_label: str
    meeting_point_lat: Optional[float] = None
    meeting_point_lon: Optional[float] = None
    contact_phone: str


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    vehicle_type: Optional[VehicleType] = None
    difficulty: Optional[Difficulty] = None
    country: Optional[str] = None
    region: Optional[str] = None
    meeting_point_label: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lon: Optional[float] = None
    contact_phone: Optional[str] = None


class EventOut(BaseModel):
    id: str
    title: str
    description: str
    event_date: datetime
    vehicle_type: Optional[str] = None
    difficulty: Optional[str] = None
    country: str
    region: str
    meeting_point_label: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lon: Optional[float] = None
    contact_phone: str
    created_at: datetime
    organizer: UserOut
    attendee_count: int = 0
    is_attending: bool = False
    my_guest_count: int = 0

    class Config:
        from_attributes = True


class RSVPRequest(BaseModel):
    guest_count: int = 1


class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    message: str


class ContactMessageOut(BaseModel):
    id: str
    name: str
    email: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    vehicle_type_other: Optional[str] = None
    ride_style: Optional[RideStyle] = None
    difficulty: Optional[Difficulty] = None
    season: Optional[Season] = None
    country: Optional[str] = None
    region: Optional[str] = None
    meeting_point_label: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lon: Optional[float] = None
    parking_security: Optional[ParkingSecurity] = None


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
    vehicle_type_other: Optional[str] = None
    ride_style: RideStyle
    difficulty: Difficulty
    season: Season
    country: str
    region: str
    meeting_point_label: Optional[str] = None
    parking_security: Optional[ParkingSecurity] = None
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
    vehicle_type_other: Optional[str] = None
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
