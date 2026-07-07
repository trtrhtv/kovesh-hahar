import os
import uuid
import boto3
from botocore.config import Config

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "roadstory-media")
R2_PUBLIC_URL_BASE = os.getenv("R2_PUBLIC_URL_BASE", "")  # ה-domain הציבורי שחיברת ל-bucket

_client = None


def get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _client


def upload_file(file_bytes: bytes, content_type: str, folder: str, extension: str) -> str:
    """מעלה קובץ ומחזיר URL ציבורי"""
    key = f"{folder}/{uuid.uuid4()}.{extension}"
    client = get_client()
    client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"{R2_PUBLIC_URL_BASE}/{key}"


# מגבלות שנקבעו בכוונה כדי לשמור על עלות אחסון נמוכה - ראה שיחה על בר-קיימות
MAX_PHOTOS_PER_STORY = 10
MAX_PHOTO_SIZE_MB = 8
MAX_GPX_SIZE_MB = 5
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
