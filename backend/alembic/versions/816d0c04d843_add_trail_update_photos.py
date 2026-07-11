"""add trail_update_photos

Revision ID: 816d0c04d843
Revises: 1e23e6f2b5af
Create Date: 2026-07-11 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '816d0c04d843'
down_revision: Union[str, Sequence[str], None] = '1e23e6f2b5af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "trail_update_photos",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("trail_update_id", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["trail_update_id"], ["trail_updates.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_trail_update_photos_trail_update_id"),
        "trail_update_photos",
        ["trail_update_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_trail_update_photos_trail_update_id"), table_name="trail_update_photos"
    )
    op.drop_table("trail_update_photos")
