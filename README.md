# סיפור דרך - תיעוד והפעלה

פלטפורמה חינמית לשיתוף סיפורי רכיבה (אינדורו כביש, סינגלים, הארד אינדורו).

## מבנה הפרויקט

```
roadstory/
  backend/     # FastAPI + Postgres
  frontend/    # Next.js + Tailwind
```

## הרצה מקומית

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
בלי משתני סביבה זה ירוץ על SQLite מקומי (`local_dev.db`) - טוב לפיתוח, לא לפרודקשן.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
פתח `.env.local` עם:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## פריסה לפרודקשן (בהתאם לתשתית שכבר יש לך)

### 1. Backend → Railway
- צור שירות חדש מה-repo, root directory: `backend`
- הוסף Postgres plugin - Railway יזריק `DATABASE_URL` אוטומטית
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- משתני סביבה נדרשים:
  - `JWT_SECRET_KEY` - מחרוזת אקראית ארוכה
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL_BASE`

### 2. אחסון קבצים → Cloudflare R2
- צור bucket חדש, חבר אליו custom domain ציבורי (זה ה-`R2_PUBLIC_URL_BASE`)
- צור API token עם הרשאות Object Read & Write
- R2 לא גובה עמלת יציאה (egress) - זה ההבדל המהותי מול S3 מבחינת עלות בגדילה

### 3. Frontend → Vercel
- חבר את ה-repo, root directory: `frontend`
- משתנה סביבה: `NEXT_PUBLIC_API_URL` = כתובת ה-Railway של ה-backend
- Vercel פרוס אוטומטית עם כל push ל-main

### 4. מפות → Mapbox
- יש טייר חינמי (50,000 טעינות מפה בחודש) - מספיק לשלב הזה בלי בעיה
- הוסף `NEXT_PUBLIC_MAPBOX_TOKEN` בפרונט כשמממשים את עמוד המפה המלא

## מגבלות בכוונה (לשמירה על עלות אפסית בגדילה)
- עד 10 תמונות לסיפור, עד 8MB לתמונה
- קובץ GPX עד 5MB
- וידאו לא מאוחסן באתר - בשלב זה מומלץ לקשר ליוטיוב/אינסטגרם בגוף הסיפור

## מה בנוי ומה נשאר

**בנוי:**
- מודל DB מלא: משתמשים, סיפורים, תמונות, לייקים, תגובות
- הרשמה/התחברות עם JWT
- העלאת סיפור מלאה: טקסט + GPX (מחושב אוטומטית מרחק/טיפוס/פרופיל) + עד 10 תמונות
- פיד עם סינון לפי אזור / סוג רכיבה / קושי / חיפוש
- עמוד בית מעוצב לגמרי (hero, פילטרים, פיד) עם "קו החתימה" הטופוגרפי

**נשאר לבנות (השלב הבא):**
- עמוד סיפור בודד עם מפת Mapbox אינטראקטיבית
- טופס העלאת סיפור (UI) - ה-API מוכן, חסר הטופס בפרונט
- עמוד פרופיל משתמש
- תגובות (ה-API endpoint עדיין לא נחשף - קל להוסיף לפי המודל של הלייקים)
- מודרציה בסיסית (דיווח על תוכן)
