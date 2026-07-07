import os
import requests

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
# עד שיהיה דומיין מאומת ב-Resend, זה כתובת ה"מוצא" הזמנית שלהם - עובדת בלי הגדרה נוספת
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "כובש ההר <onboarding@resend.dev>")


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """שולח מייל איפוס סיסמה. מחזיר True/False בהצלחה - אף פעם לא זורק שגיאה
    כלפי חוץ, כדי לא לחשוף למשתמש אם המייל שלו קיים במערכת או לא (אבטחה)."""
    if not RESEND_API_KEY:
        print("[EMAIL] RESEND_API_KEY לא מוגדר - לא נשלח מייל בפועל")
        return False

    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>איפוס סיסמה - כובש ההר</h2>
      <p>קיבלנו בקשה לאפס את הסיסמה שלך. הקישור הזה בתוקף לשעה אחת בלבד:</p>
      <p style="margin: 24px 0;">
        <a href="{reset_url}" style="background:#FF5500;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;">
          איפוס סיסמה
        </a>
      </p>
      <p style="color:#888;font-size:13px;">אם לא ביקשת את זה, אפשר להתעלם מהמייל הזה בבטחה.</p>
    </div>
    """

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": "איפוס סיסמה - כובש ההר",
                "html": html,
            },
            timeout=10,
        )
        return res.status_code < 300
    except Exception as e:
        print(f"[EMAIL] שליחה נכשלה: {e}")
        return False
