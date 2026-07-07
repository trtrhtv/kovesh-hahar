"""add contact_phone to events, guest_count to rsvps

Revision ID: ab338fdcd6fa
Revises: 5b9e313c5a07
Create Date: 2026-07-07 19:14:27.643007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab338fdcd6fa'
down_revision: Union[str, Sequence[str], None] = '5b9e313c5a07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('event_rsvps', sa.Column('guest_count', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('events', sa.Column('contact_phone', sa.String(), nullable=False, server_default=''))

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # מסירים את ברירת המחדל ברמת ה-DB אחרי שהיא מילאה את השורות הקיימות -
        # מעכשיו והלאה זה נאכף ברמת האפליקציה (Pydantic), לא ה-DB
        op.alter_column('event_rsvps', 'guest_count', server_default=None)
        op.alter_column('events', 'contact_phone', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('events', 'contact_phone')
    op.drop_column('event_rsvps', 'guest_count')
