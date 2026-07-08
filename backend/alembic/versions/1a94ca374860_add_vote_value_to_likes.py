"""add vote value to likes

Revision ID: 1a94ca374860
Revises: ce56194e9ec3
Create Date: 2026-07-08 09:55:19.377084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a94ca374860'
down_revision: Union[str, Sequence[str], None] = 'ce56194e9ec3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('likes', sa.Column('value', sa.Integer(), nullable=False, server_default='1'))

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.alter_column('likes', 'value', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('likes', 'value')
