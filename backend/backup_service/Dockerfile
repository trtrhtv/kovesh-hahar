FROM python:3.13-slim

# מתקינים pg_dump בגרסה 18 בדיוק - מהמאגר הרשמי של PostgreSQL (PGDG),
# לא מ-Debian הרגיל (ששם רק גרסה 15, וגרם לחוסר ההתאמה שראינו).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg lsb-release \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
       --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-18 \
    && apt-get purge -y curl gnupg lsb-release \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backup_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

COPY backup_service/backup.py .

CMD ["python", "backup.py"]
