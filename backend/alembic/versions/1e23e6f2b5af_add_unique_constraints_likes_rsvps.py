"""add unique constraints to likes and event_rsvps

Revision ID: 1e23e6f2b5af
Revises: 5f6c342d2752
Create Date: 2026-07-10 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e23e6f2b5af'
down_revision: Union[str, Sequence[str], None] = '5f6c342d2752'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _dedupe(conn, table: str, key_cols: Sequence[str], order_by: str = "") -> None:
    """משאיר שורה אחת לכל צירוף key_cols ומוחק את השאר. order_by קובע איזו שורה
    'ראשונה' (ולכן נשמרת) - למשל 'created_at DESC' כדי לשמור את המאוחרת."""
    order = f" ORDER BY {order_by}" if order_by else ""
    rows = conn.execute(sa.text(f"SELECT id, {', '.join(key_cols)} FROM {table}{order}")).fetchall()
    seen = set()
    to_delete = []
    for row in rows:
        key = tuple(getattr(row, c) for c in key_cols)
        if key in seen:
            to_delete.append(row.id)
        else:
            seen.add(key)
    for row_id in to_delete:
        conn.execute(sa.text(f"DELETE FROM {table} WHERE id = :id"), {"id": row_id})


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()

    # חובה לנקות כפילויות קיימות לפני הוספת האילוץ, אחרת יצירת האילוץ תיכשל על
    # נתונים קיימים. RSVP: שומרים את ההרשמה המאוחרת (created_at DESC) - היא המצב
    # העדכני. likes: אין created_at, אז שומרים שרירותית את הראשונה שנתקלנו בה.
    _dedupe(conn, "event_rsvps", ["event_id", "user_id"], order_by="created_at DESC")
    _dedupe(conn, "likes", ["story_id", "user_id"])

    with op.batch_alter_table("likes") as batch_op:
        batch_op.create_unique_constraint("uq_likes_story_user", ["story_id", "user_id"])
    with op.batch_alter_table("event_rsvps") as batch_op:
        batch_op.create_unique_constraint("uq_event_rsvps_event_user", ["event_id", "user_id"])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("event_rsvps") as batch_op:
        batch_op.drop_constraint("uq_event_rsvps_event_user", type_="unique")
    with op.batch_alter_table("likes") as batch_op:
        batch_op.drop_constraint("uq_likes_story_user", type_="unique")
