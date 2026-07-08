"""
גיבוי יומי של מסד הנתונים ל-Cloudflare R2.
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
R2_ACCOUNT_ID = os.getenv("R2_BACKUP_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_BACKUP_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_BACKUP_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BACKUP_BUCKET_NAME", "")
RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))


def fail(message: str):
    print(f"[BACKUP] שגיאה: {message}", file=sys.stderr)
    sys.exit(1)


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def run_backup():
    if not DATABASE_URL:
        fail("DATABASE_URL לא מוגדר")
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
        fail("חסרים משתני R2_BACKUP_* - ראה README")

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

    print(f"[BACKUP] מעלה ל-R2...")
    client = get_r2_client()
    client.upload_file(local_path, R2_BUCKET_NAME, f"backups/{filename}")
    os.remove(local_path)
    print(f"[BACKUP] הועלה בהצלחה")

    cleanup_old_backups(client)


def cleanup_old_backups(client):
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    response = client.list_objects_v2(Bucket=R2_BUCKET_NAME, Prefix="backups/")
    deleted = 0
    for obj in response.get("Contents", []):
        if obj["LastModified"] < cutoff:
            client.delete_object(Bucket=R2_BUCKET_NAME, Key=obj["Key"])
            deleted += 1
    print(f"[BACKUP] נוקו {deleted} גיבויים ישנים מ-{RETENTION_DAYS} יום")


if __name__ == "__main__":
    run_backup()
    print("[BACKUP] הושלם בהצלחה")
