import re


def is_valid_phone(phone: str) -> bool:
    """בדיקה בסיסית - לא מאמתת שהמספר באמת קיים, רק שהצורה הגיונית
    (רצף ספרות סביר, עם או בלי + מוביל, 9-15 ספרות)"""
    digits = re.sub(r"[^\d+]", "", phone)
    return bool(re.fullmatch(r"\+?\d{9,15}", digits))
