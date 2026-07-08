"""
גיבוי יומי של מסד הנתונים לאחסון S3-compatible (Backblaze B2, Cloudflare R2, וכו').
רץ כשירות Railway נפרד עם Cron Schedule (לא שירות שרץ כל הזמן) -
ראה README.md לגבי הגדרת ה-Cron ומשתני הסביבה הנדרשים.
"""
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

import boto3
from botocore.client import Config

DATABASE_URL = os.getenv("DATABASE_URL", "")
S3_ENDPOINT_URL = os.getenv("BACKUP_S3_ENDPOINT_URL", "")  # למשל https://s3.us-west-004.backblazeb2.com
S3_ACCESS_KEY_ID = os.getenv("BACKUP_S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.getenv("BACKUP_S3_SECRET_ACCESS_KEY", "")
S3_BUCKET_NAME = os.getenv("BACKUP_S3_BUCKET_NAME", "")
RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))


def fail(message: str):
    print(f"[BACKUP] שגיאה: {message}", file=sys.stderr)
    sys.exit(1)


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY_ID,
        aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def run_backup():
    if not DATABASE_URL:
        fail("DATABASE_URL לא מוגדר")
    if not all([S3_ENDPOINT_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME]):
        fail("חסרים משתני BACKUP_S3_* - ראה README")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"backup_{timestamp}.sql.gz"
    local_path = f"/tmp/{filename}"

    print(f"[BACKUP] מריץ pg_dump...")
    # pg_dump | gzip - כדי לא לשמור קובץ ענק לא-דחוס בדיסק המקומי
    dump_proc = subprocess.Popen(["pg_dump", DATABASE_URL], stdout=subprocess.PIPE)
    with open(local_path, "wb") as f:
        gzip_proc = subprocess.Popen(["gzip"], stdin=dump_proc.stdout, stdout=f)
        dump_proc.stdout.close()
        gzip_proc.communicate()

    if dump_proc.wait() != 0:
        fail("pg_dump נכשל")

    size_mb = os.path.getsize(local_path) / (1024 * 1024)
    print(f"[BACKUP] קובץ נוצר: {filename} ({size_mb:.2f}MB)")

    print(f"[BACKUP] מעלה לאחסון...")
    client = get_s3_client()
    client.upload_file(local_path, S3_BUCKET_NAME, f"backups/{filename}")
    os.remove(local_path)
    print(f"[BACKUP] הועלה בהצלחה")

    cleanup_old_backups(client)


def cleanup_old_backups(client):
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    response = client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix="backups/")
    deleted = 0
    for obj in response.get("Contents", []):
        if obj["LastModified"] < cutoff:
            client.delete_object(Bucket=S3_BUCKET_NAME, Key=obj["Key"])
            deleted += 1
    print(f"[BACKUP] נוקו {deleted} גיבויים ישנים מ-{RETENTION_DAYS} יום")


if __name__ == "__main__":
    run_backup()
    print("[BACKUP] הושלם בהצלחה")
