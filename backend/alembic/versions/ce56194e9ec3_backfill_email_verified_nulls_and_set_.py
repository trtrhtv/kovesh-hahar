"""backfill email_verified nulls and set default

Revision ID: ce56194e9ec3
Revises: 1ddc53ce7964
Create Date: 2026-07-08 05:02:32.696853

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce56194e9ec3'
down_revision: Union[str, Sequence[str], None] = '1ddc53ce7964'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ממלאים את כל השורות הקיימות עם NULL בעמודת email_verified ל-false -
    # זו הייתה השגיאה: הוספתי את העמודה בלי server_default, אז משתמשים
    # שנרשמו לפני הפיצ'ר קיבלו NULL, ו-Pydantic דורש bool אמיתי (true/false).
    op.execute("UPDATE users SET email_verified = false WHERE email_verified IS NULL")
    # אותה בעיה בדיוק קרתה עם events.time_is_approximate - מתקן גם אותה כאן
    # ביחד, כדי לא לצטרך עוד סבב תיקונים לאותו סוג בעיה
    op.execute("UPDATE events SET time_is_approximate = false WHERE time_is_approximate IS NULL")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.alter_column("users", "email_verified", server_default=sa.false())
        op.alter_column("events", "time_is_approximate", server_default=sa.false())


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.alter_column("users", "email_verified", server_default=None)
        op.alter_column("events", "time_is_approximate", server_default=None)
